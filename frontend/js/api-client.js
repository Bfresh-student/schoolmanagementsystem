// ==========================================
// CEJEC ERP — Couche d'accès API (Inscriptions & Encaissement)
// ==========================================
// Version corrigée — voir les commentaires "🔧 FIX #N" pour chaque bug
// résolu par rapport à la version précédente.

const API_CONFIG = {
    BASE_URL: 'https://schoolmanagementsystem-production-6624.up.railway.app/api/v1',
    TOKEN_KEY: 'authToken',
    REFRESH_KEY: 'refreshToken',
    OFFLINE_QUEUE_KEY: 'cejec_offline_queue_inscriptions',
};

// ------------------------------------------
// Utilitaires bas niveau
// ------------------------------------------
function getAccessToken() {
    return localStorage.getItem(API_CONFIG.TOKEN_KEY);
}
function getRefreshToken() {
    return localStorage.getItem(API_CONFIG.REFRESH_KEY);
}
function setTokens({ access, refresh }) {
    if (access) localStorage.setItem(API_CONFIG.TOKEN_KEY, access);
    if (refresh) localStorage.setItem(API_CONFIG.REFRESH_KEY, refresh);
}
function clearTokens() {
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.REFRESH_KEY);
}

function redirectToLogin() {
    clearTokens();
    window.location.href = 'Se connecter - Admin.html';
}

async function apiFetch(path, { method = 'GET', body = null, retry = true } = {}) {
    const url = path.startsWith('http') ? path : `${API_CONFIG.BASE_URL}${path}`;
    const headers = { 'Content-Type': 'application/json' };
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch (networkErr) {
        const err = new Error('NETWORK_ERROR');
        err.cause = networkErr;
        throw err;
    }

    if (response.status === 401 && retry) {
        const refreshed = await tryRefreshToken();
        if (refreshed) return apiFetch(path, { method, body, retry: false });
        redirectToLogin();
        throw new Error('UNAUTHORIZED');
    }

    if (!response.ok) {
        let detail = null;
        try { detail = await response.json(); } catch (_) { /* pas de JSON */ }
        const err = new Error(`API_ERROR_${response.status}`);
        err.status = response.status;
        err.detail = detail;
        // 🔧 Diagnostic : loggez toujours le détail en console, plutôt que
        // de le laisser invisible tant qu'un appelant ne le gère pas
        // explicitement — c'est ce qui a caché le bug #1 (local_uuid: null)
        // pendant longtemps : l'erreur 400 existait bien, mais personne ne
        // la regardait en dehors d'un `catch` générique qui basculait tout
        // en mode démo silencieusement.
        console.error(`[API] ${method} ${url} -> ${response.status}`, detail);
        throw err;
    }

    if (response.status === 204) return null;
    return response.json();
}

async function tryRefreshToken() {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/auth/users/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return false;
        const data = await res.json();
        setTokens({ access: data.access });
        return true;
    } catch (_) {
        return false;
    }
}

// ------------------------------------------
// Auth
// ------------------------------------------
const AuthAPI = {
    async login(email, password) {
        const data = await apiFetch('/auth/users/login/', { method: 'POST', body: { email, password } });
        setTokens({ access: data.access, refresh: data.refresh });
        return data;
    },
    async me() {
        return apiFetch('/auth/users/me/');
    },
    async registerStudent({ first_name, last_name, phone = '', password }) {
        return apiFetch('/auth/users/register/', {
            method: 'POST',
            body: {
                first_name,
                last_name,
                phone,
                password,
                password_confirm: password,
                role: 'STUDENT',
            },
        });
    },
    async listStudents() {
        const data = await apiFetch('/auth/users/?role=STUDENT');
        return data.results || data;
    },
    async createUser(body) {
        return apiFetch('/auth/users/', { method: 'POST', body });
    },
    async updateUser(id, body) {
        return apiFetch(`/auth/users/${id}/`, { method: 'PATCH', body });
    },
    async deleteUser(id) {
        return apiFetch(`/auth/users/${id}/`, { method: 'DELETE' });
    },
};
window.AuthAPI = AuthAPI;

// 🔧 FIX #6 — extraction défensive de l'ID étudiant depuis la réponse de
// /auth/users/register/. La forme exacte de cette réponse n'était pas
// confirmée ({ user: { student_id } } supposé à tort dans la v1) : on
// tente maintenant plusieurs formes plausibles dans l'ordre, et on log
// la réponse brute si aucune ne correspond, pour diagnostiquer en 5
// secondes au lieu de deviner.
function extractStudentId(registerResponse) {
    const r = registerResponse || {};
    const candidate =
        r.student_id ??
        r.student?.id ??
        r.user?.student_id ??
        r.user?.student?.id ??
        null;
    if (candidate == null) {
        console.error(
            "[AuthAPI.registerStudent] Impossible de déterminer l'ID étudiant. " +
            "Forme de réponse reçue (à comparer avec ce que le backend renvoie réellement) :",
            r
        );
    }
    return candidate;
}

// ------------------------------------------
// Étudiants — 🔧 FIX #3 : endpoint manquant côté InscriptionSerializer
// (adresse, sexe, date de naissance, contacts d'urgence n'y figurent
// pas). On complète donc les données via /students/students/<id>/,
// exactement comme le prévoyait déjà le guide d'intégration.
// ------------------------------------------
const StudentsAPI = {
    async get(id) {
        return apiFetch(`/students/students/${id}/`);
    },
    async list() {
        const data = await apiFetch('/students/students/?page_size=1000');
        return data.results || data;
    },
};

// ------------------------------------------
// Classes (SchoolClass — données académiques)
// ------------------------------------------
const ClassesAPI = {
    async list() {
        const data = await apiFetch('/students/classes/?page_size=1000');
        return data.results || data;
    },
    async update(id, payload) {
        return apiFetch('/students/classes/' + id + '/', { method: 'PATCH', body: payload });
    },
};

// ------------------------------------------
// Cours (catalogue de formations)
// ------------------------------------------
const CoursesAPI = {
    async list() {
        const data = await apiFetch('/courses/courses/');
        return data.results || data;
    },
};

// ------------------------------------------
// Notes
// ------------------------------------------
const GradesAPI = {
    async list() {
        const data = await apiFetch('/grades/grades/?page_size=1000');
        return data.results || data;
    },
    async submit({ student, course, assessment, value, date, local_uuid }) {
        const body = {
            student,
            ...(assessment ? { assessment } : { course }),
            value,
            local_timestamp: `${date || new Date().toISOString().slice(0, 10)}T12:00:00Z`,
        };
        if (local_uuid) body.local_uuid = local_uuid;
        return apiFetch('/grades/grades/submit/', { method: 'POST', body });
    },
};
const AssessmentsAPI = {
    async list({ schoolClass, academicYear } = {}) {
        const params = new URLSearchParams();
        if (schoolClass) params.set('school_class', schoolClass);
        if (academicYear) params.set('academic_year', academicYear);
        const data = await apiFetch(`/grades/assessments/${params.toString() ? `?${params}` : ''}`);
        return data.results || data;
    },
    async create(payload) {
        return apiFetch('/grades/assessments/', { method: 'POST', body: payload });
    },
    async update(id, payload) {
        return apiFetch(`/grades/assessments/${id}/`, { method: 'PATCH', body: payload });
    },
};
// ------------------------------------------
// Helper multipart/form-data (pour upload de fichiers)
// ------------------------------------------
async function apiFetchMultipart(path, formData, method = 'POST') {
    const url = path.startsWith('http') ? path : `${API_CONFIG.BASE_URL}${path}`;
    const headers = {};
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    // NE PAS mettre Content-Type — le navigateur le fait automatiquement avec la boundary
    let response;
    try {
        response = await fetch(url, { method, headers, body: formData });
    } catch (networkErr) {
        const err = new Error('NETWORK_ERROR'); err.cause = networkErr; throw err;
    }
    if (response.status === 401) { redirectToLogin(); throw new Error('UNAUTHORIZED'); }
    if (!response.ok) {
        let detail = null;
        try { detail = await response.json(); } catch (_) {}
        const err = new Error(`API_ERROR_${response.status}`);
        err.status = response.status; err.detail = detail;
        console.error(`[API] ${method} ${url} -> ${response.status}`, detail);
        throw err;
    }
    if (response.status === 204) return null;
    return response.json();
}

const HRAPI = {
    // --- Lecture générique ---
    async list(path) {
        const data = await apiFetch(`/hr/${path}/?page_size=1000`);
        return data.results || data;
    },

    // --- Teachers (pour l'onglet Professeurs) ---
    teachers() {
        return apiFetch('/teachers/?page_size=1000').then(data => data.results || data);
    },
    updateTeacher(id, body) {
        return apiFetch(`/teachers/${id}/`, { method: 'PATCH', body });
    },

    // --- Personnel administratif ---
    employees() { return this.list('employees'); },
    createEmployee(body) { return apiFetch('/hr/employees/', { method: 'POST', body }); },
    updateEmployee(id, body) { return apiFetch(`/hr/employees/${id}/`, { method: 'PATCH', body }); },
    deleteEmployee(id) { return apiFetch(`/hr/employees/${id}/`, { method: 'DELETE' }); },

    // --- Présences du personnel ---
    attendances() { return this.list('attendances'); },
    createAttendance(body) { return apiFetch('/hr/attendances/', { method: 'POST', body }); },
    updateAttendance(id, body) { return apiFetch(`/hr/attendances/${id}/`, { method: 'PATCH', body }); },
    deleteAttendance(id) { return apiFetch(`/hr/attendances/${id}/`, { method: 'DELETE' }); },

    // --- Recrutement ---
    candidates() { return this.list('candidates'); },
    createCandidate(formData) { return apiFetchMultipart('/hr/candidates/', formData); },
    updateCandidate(id, formData) { return apiFetchMultipart(`/hr/candidates/${id}/`, formData, 'PATCH'); },
    deleteCandidate(id) { return apiFetch(`/hr/candidates/${id}/`, { method: 'DELETE' }); },
    // --- Contrats ---
    contracts() { return this.list('contracts'); },
    createContract(body) { return apiFetch('/hr/contracts/', { method: 'POST', body }); },
    updateContract(id, body) { return apiFetch(`/hr/contracts/${id}/`, { method: 'PATCH', body }); },
    deleteContract(id) { return apiFetch(`/hr/contracts/${id}/`, { method: 'DELETE' }); },
    terminateContract(id, body) { return apiFetch(`/hr/contracts/${id}/terminate/`, { method: 'POST', body }); },

    // --- Salaires ---
    salaries() { return this.list('salaries'); },
    createSalary(body) { return apiFetch('/hr/salaries/', { method: 'POST', body }); },
    updateSalary(id, body) { return apiFetch(`/hr/salaries/${id}/`, { method: 'PATCH', body }); },
    deleteSalary(id) { return apiFetch(`/hr/salaries/${id}/`, { method: 'DELETE' }); },
    markSalaryPaid(id, body) { return apiFetch(`/hr/salaries/${id}/mark_paid/`, { method: 'POST', body }); },
    salaryBalance(teacherId) { return apiFetch(`/hr/salaries/?teacher=${teacherId}&page_size=100`).then(d => d.results || d); },

    // --- Congés ---
    leaves() { return this.list('leaves'); },
    leaveTypes() { return this.list('leave-types'); },
    createLeave(body) { return apiFetch('/hr/leaves/', { method: 'POST', body }); },
    updateLeave(id, body) { return apiFetch(`/hr/leaves/${id}/`, { method: 'PATCH', body }); },
    deleteLeave(id) { return apiFetch(`/hr/leaves/${id}/`, { method: 'DELETE' }); },
    approveLeave(id) { return apiFetch(`/hr/leaves/${id}/approve/`, { method: 'POST' }); },
    rejectLeave(id) { return apiFetch(`/hr/leaves/${id}/reject/`, { method: 'POST' }); },
    leaveBalance() { return apiFetch('/hr/leaves/balance/'); },

    // --- Évaluations ---
    evaluations() { return this.list('evaluations'); },
    createEvaluation(body) { return apiFetch('/hr/evaluations/', { method: 'POST', body }); },
    updateEvaluation(id, body) { return apiFetch(`/hr/evaluations/${id}/`, { method: 'PATCH', body }); },
    deleteEvaluation(id) { return apiFetch(`/hr/evaluations/${id}/`, { method: 'DELETE' }); },
    acknowledgeEvaluation(id, comments) { return apiFetch(`/hr/evaluations/${id}/acknowledge/`, { method: 'POST', body: { comments } }); },

    // --- Documents RH ---
    documents() { return this.list('documents'); },
    createDocument(formData) { return apiFetchMultipart('/hr/documents/', formData); },
    updateDocument(id, formData) { return apiFetchMultipart(`/hr/documents/${id}/`, formData, 'PATCH'); },
    deleteDocument(id) { return apiFetch(`/hr/documents/${id}/`, { method: 'DELETE' }); },
    getDocument(id) { return apiFetch(`/hr/documents/${id}/`); },

    // --- Audit Log ---
    auditLog() { return this.list('audit-log'); },
};
window.HRAPI = HRAPI;


// ------------------------------------------
// Inscriptions
// ------------------------------------------
const InscriptionStatus = {
    PENDING: 'pending',
    APPROVED: 'approved',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    VALIDATED: 'validated',
    REJECTED: 'rejected',
};

const InscriptionsAPI = {
    async list() {
        const data = await apiFetch('/enrollments/inscriptions/');
        return data.results || data;
    },
    async get(id) {
        return apiFetch(`/enrollments/inscriptions/${id}/`);
    },
    async create({ student, school_class, requested_at, created_offline = false, local_uuid = null }) {
        // 🔧 FIX #1 — bug principal du CRUD cassé.
        // InscriptionCreateSerializer déclare :
        //   local_uuid = serializers.UUIDField(required=False)
        // `required=False` signifie "la CLÉ peut être absente du JSON",
        // PAS "la valeur peut être null". Envoyer explicitement
        // "local_uuid": null faisait échouer TOUTE création en ligne avec
        // une erreur 400 { "local_uuid": ["This field may not be null."] }.
        // On construit maintenant le body sans la clé du tout quand il n'y
        // a pas de local_uuid réel à envoyer.
        const body = { student, school_class, requested_at, created_offline };
        if (local_uuid) body.local_uuid = local_uuid;
        return apiFetch('/enrollments/inscriptions/', { method: 'POST', body });
    },
    async delete(id) {
        return apiFetch(`/enrollments/inscriptions/${id}/`, { method: 'DELETE' });
    },
    async approve(id) {
        return apiFetch(`/enrollments/inscriptions/${id}/approve/`, { method: 'POST' });
    },
    async reject(id, reason) {
        return apiFetch(`/enrollments/inscriptions/${id}/reject/`, {
            method: 'POST',
            body: { reason },
        });
    },
    async transition(id, targetStatus) {
        return apiFetch(`/enrollments/inscriptions/${id}/transition/`, {
            method: 'POST',
            body: { status: targetStatus },
        });
    },
    async syncBatch(items) {
        // Chaque item de la file offline porte déjà un vrai local_uuid
        // généré par generateLocalUuid() — ce chemin n'était pas concerné
        // par le bug #1, on ne touche donc à rien ici.
        return apiFetch('/enrollments/inscriptions/sync_batch/', {
            method: 'POST',
            body: { items },
        });
    },
};

// ------------------------------------------
// Pre-Inscriptions
// ------------------------------------------
const PreInscriptionsAPI = {
    async list() {
        const data = await apiFetch('/enrollments/pre-inscriptions/');
        return data.results || data;
    },
    async create(data) {
        return apiFetch('/enrollments/pre-inscriptions/', {
            method: 'POST',
            body: data,
        });
    },
    async update(id, data) {
        return apiFetch(`/enrollments/pre-inscriptions/${id}/`, {
            method: 'PATCH',
            body: data,
        });
    },
    async delete(id) {
        return apiFetch(`/enrollments/pre-inscriptions/${id}/`, {
            method: 'DELETE',
        });
    },
    async convert(id, payload = {}) {
        return apiFetch(`/enrollments/pre-inscriptions/${id}/convert/`, {
            method: 'POST',
            body: payload,
        });
    }
};

// ------------------------------------------
// Attendances
// ------------------------------------------
const AttendanceAPI = {
    async byCourse(courseId, date) {
        let url = `/attendances/attendances/by_course/?course_id=${courseId}`;
        if (date) url += `&date=${date}`;
        return apiFetch(url);
    },
    async stats() {
        return apiFetch('/attendances/attendances/stats/');
    },
    async submitBatch(course, attendanceDate, offline, items) {
        return apiFetch('/attendances/attendances/submit_batch/', {
            method: 'POST',
            body: {
                course,
                attendance_date: attendanceDate,
                offline,
                items,
            },
        });
    },
};
window.AttendanceAPI = AttendanceAPI;

// ------------------------------------------
// Finance
// ------------------------------------------
const FinanceAPI = {
    async listInvoices(studentId) {
        const data = await apiFetch(`/finance/invoices/?student=${studentId}`);
        return data.results || data;
    },
    async listPaymentMethods() {
        const data = await apiFetch('/finance/payment-methods/');
        return data.results || data;
    },
    async listPayments() {
        const data = await apiFetch('/finance/payments/');
        return data.results || data;
    },
    async addPayment({ invoice, amount, payment_method, reference, payment_date }) {
        return apiFetch('/finance/payments/', {
            method: 'POST',
            body: { invoice, amount, payment_method, reference, payment_date },
        });
    },
};

// ------------------------------------------
// File d'attente hors-ligne
// ------------------------------------------
const OfflineQueue = {
    read() {
        try {
            return JSON.parse(localStorage.getItem(API_CONFIG.OFFLINE_QUEUE_KEY)) || [];
        } catch (_) {
            return [];
        }
    },
    write(items) {
        localStorage.setItem(API_CONFIG.OFFLINE_QUEUE_KEY, JSON.stringify(items));
    },
    push(item) {
        if (!item.school_class) {
            console.error(
                'OfflineQueue.push refusé : "school_class" manquant. ' +
                'Une inscription sans classe ne peut jamais être facturée ni payée.',
                item
            );
            throw new Error('MISSING_SCHOOL_CLASS');
        }
        const items = OfflineQueue.read();
        items.push(item);
        OfflineQueue.write(items);
        return items;
    },
    clear() {
        localStorage.removeItem(API_CONFIG.OFFLINE_QUEUE_KEY);
    },
    count() {
        return OfflineQueue.read().length;
    },

    async _resolveStudentAccount(item) {
        if (item.student != null) return item;

        if (!item.first_name || !item.last_name) {
            console.warn('Item hors-ligne incomplet (nom manquant), impossible de créer le compte étudiant :', item.local_uuid);
            return null;
        }

        try {
            const userRes = await AuthAPI.registerStudent({
                first_name: item.first_name,
                last_name: item.last_name,
                phone: item.phone || '',
                password: genererMotDePasseTemporaire(),
            });
            // 🔧 FIX #6 appliqué aussi ici (même point d'échec que dans
            // saveInscription côté script_inscription.js).
            const studentId = extractStudentId(userRes);
            if (!studentId) return null;
            return { ...item, student: studentId };
        } catch (err) {
            console.warn('Échec de création du compte étudiant pour', item.local_uuid, err);
            return null;
        }
    },

    async sync() {
        const items = OfflineQueue.read();
        if (items.length === 0) return { synced: 0, errors: 0 };

        const resolved = [];
        const stillPending = [];
        for (const item of items) {
            const fixedItem = await OfflineQueue._resolveStudentAccount(item);
            if (fixedItem) resolved.push(fixedItem);
            else stillPending.push(item);
        }

        if (resolved.length === 0) {
            OfflineQueue.write(stillPending);
            return { synced: 0, errors: 0 };
        }

        try {
            const res = await InscriptionsAPI.syncBatch(resolved);
            const errored = (res.results || []).filter(r => r.status === 'error');
            const succeededUuids = (res.results || [])
                .filter(r => r.status === 'synced')
                .map(r => r.local_uuid);
            const stillFailed = resolved.filter(i => !succeededUuids.includes(i.local_uuid));
            OfflineQueue.write([...stillPending, ...stillFailed]);
            return { synced: succeededUuids.length, errors: errored.length, results: res.results };
        } catch (err) {
            OfflineQueue.write([...stillPending, ...resolved]);
            return { synced: 0, errors: 0, offline: true };
        }
    },
};

function generateLocalUuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

function genererMotDePasseTemporaire() {
    return 'Cejec' + Math.random().toString(36).slice(-8) + '!1';
}

window.addEventListener('online', () => {
    OfflineQueue.sync().then(res => {
        if (res.synced > 0 && window.showToast) {
            showToast(`${res.synced} inscription(s) hors-ligne synchronisée(s)`, 'success');
        }
    });
});