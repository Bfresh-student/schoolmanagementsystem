        // ==================== STORAGE MANAGEMENT ====================
        const STORAGE_KEYS = {
            PERSONNEL: 'cejec_personnel',
            CLIENTS: 'cejec_clients',
            PRESENCES: 'cejec_presences',
            PRESENCE_STATUS: 'cejec_presenceStatus',
            COURSES: 'cejec_courses',
            CLASSES: 'cejec_classes',
            FILIERES: 'cejec_filieres',
            FILIERE_FILTER: 'cejec_filiereFilter',
            CLASSE_FILTER: 'cejec_classeFilter',
            LAST_BACKUP: 'cejec_lastBackup',
            NEXT_IDS: 'cejec_nextIds'
        };

        function saveToLocalStorage() {
            try {
                localStorage.setItem(STORAGE_KEYS.PERSONNEL, JSON.stringify(personnel));
                localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
                localStorage.setItem(STORAGE_KEYS.PRESENCES, JSON.stringify(historiquePresences));
                localStorage.setItem(STORAGE_KEYS.PRESENCE_STATUS, JSON.stringify(presenceStatus));
                localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
                localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
                localStorage.setItem(STORAGE_KEYS.FILIERES, JSON.stringify(filieres));
                localStorage.setItem(STORAGE_KEYS.FILIERE_FILTER, currentFiliereFilter);
                localStorage.setItem(STORAGE_KEYS.CLASSE_FILTER, currentClasseFilter);
                localStorage.setItem(STORAGE_KEYS.NEXT_IDS, JSON.stringify({
                    personnel: nextPersonnelId,
                    client: nextClientId
                }));
                const now = new Date().toLocaleTimeString('fr-FR');
                localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now);
                const backupElements = document.querySelectorAll('#lastBackupTime, #lastBackupTimeClients');
                backupElements.forEach(el => { if (el) el.textContent = now; });
                return true;
            } catch (error) {
                console.error('Erreur de sauvegarde:', error);
                showToast('Erreur lors de la sauvegarde automatique', 'error');
                return false;
            }
        }

        function loadFromLocalStorage() {
            try {
                const savedPersonnel = localStorage.getItem(STORAGE_KEYS.PERSONNEL);
                const savedClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
                const savedPresences = localStorage.getItem(STORAGE_KEYS.PRESENCES);
                const savedPresenceStatus = localStorage.getItem(STORAGE_KEYS.PRESENCE_STATUS);
                const savedCourses = localStorage.getItem(STORAGE_KEYS.COURSES);
                const savedClasses = localStorage.getItem(STORAGE_KEYS.CLASSES);
                const savedFilieres = localStorage.getItem(STORAGE_KEYS.FILIERES);
                const savedFiliereFilter = localStorage.getItem(STORAGE_KEYS.FILIERE_FILTER);
                const savedClasseFilter = localStorage.getItem(STORAGE_KEYS.CLASSE_FILTER);
                const savedNextIds = localStorage.getItem(STORAGE_KEYS.NEXT_IDS);
                const savedLastBackup = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);

                if (savedPersonnel) personnel = JSON.parse(savedPersonnel);
                if (savedClients) clients = JSON.parse(savedClients);
                if (savedPresences) historiquePresences = JSON.parse(savedPresences);
                if (savedPresenceStatus) presenceStatus = JSON.parse(savedPresenceStatus);
                if (savedCourses) courses = JSON.parse(savedCourses);
                if (savedClasses) classes = JSON.parse(savedClasses);
                if (savedFilieres) filieres = JSON.parse(savedFilieres);
                if (savedFiliereFilter) currentFiliereFilter = savedFiliereFilter;
                if (savedClasseFilter) currentClasseFilter = savedClasseFilter;
                if (savedNextIds) {
                    const ids = JSON.parse(savedNextIds);
                    nextPersonnelId = ids.personnel;
                    nextClientId = ids.client;
                }

                const backupElements = document.querySelectorAll('#lastBackupTime, #lastBackupTimeClients');
                const timeText = savedLastBackup || 'À l\'instant';
                backupElements.forEach(el => { if (el) el.textContent = timeText; });

                return true;
            } catch (error) {
                console.error('Erreur de chargement:', error);
                return false;
            }
        }

        setInterval(() => { if (saveToLocalStorage()) { console.log('💾 Sauvegarde locale automatique'); } }, 30000);
        
        // API Sync every 10 minutes
        setInterval(async () => {
            if (navigator.onLine) {
                console.log('🔄 Synchronisation API périodique (10 min)...');
                if (await fetchUsersFromApi()) {
                    renderAll();
                }
            }
        }, 10 * 60 * 1000);

        window.addEventListener('beforeunload', () => { saveToLocalStorage(); });

        // ==================== VALIDATION ====================
        function validateEmail(email) { const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; return re.test(email); }

        function validatePhone(phone) { const re = /^\+509\s\d{2}\s\d{2}\s\d{2}\s\d{2}$/; const reSimple = /^\+509\s?\d{8}$/; return re.test(phone) || reSimple.test(phone.replace(/\s/g, '')); }

        function showFieldError(fieldId, message) {
            const field = document.getElementById(fieldId); if (!field) return;
            field.classList.add('error'); const existingError = field.parentElement.querySelector('.error-message'); if (existingError) existingError.remove();
            const errorEl = document.createElement('div');
            errorEl.className = 'error-message visible';
            errorEl.textContent = message;
            field.parentElement.appendChild(errorEl);
        }

        function clearFieldErrors() { document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            document.querySelectorAll('.error-message').forEach(el => el.remove()); }

        function isDuplicateEmail(email, type, excludeId) {
            const arr = type === 'personnel' ? personnel : clients;
            return arr.some(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeId);
        }

        // ==================== DJANGO API LAYER ====================
        const API_BASE = 'http://localhost:8000/api/v1';

        // Role mapping: frontend display value <-> Django ROLE_CHOICES code
        const ROLE_TO_API = {
            administrateur: 'ADMIN',
            directeur: 'DIRECTOR',
            secretaire: 'SECRETARY',
            comptable: 'ACCOUNTANT',
            professeur: 'TEACHER',
            'etudiant-excellent': 'STUDENT',
            'etudiant-regulier': 'STUDENT',
            'etudiant-nouveau': 'STUDENT'
        };
        const STATUS_TO_API = {
            actif: 'ACTIVE',
            inactif: 'INACTIVE',
            suspendu: 'SUSPENDED'
        };
        const API_ROLE_TO_LOCAL = {
            ADMIN: 'administrateur',
            DIRECTOR: 'directeur',
            SECRETARY: 'secretaire',
            ACCOUNTANT: 'comptable',
            TEACHER: 'professeur',
            STUDENT: 'etudiant-regulier',
            STAFF: 'administrateur'
        };
        const API_STATUS_TO_LOCAL = {
            ACTIVE: 'actif',
            INACTIVE: 'inactif',
            SUSPENDED: 'suspendu'
        };

        function apiHeaders() {
            const token = localStorage.getItem('authToken');
            return {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
        }

        function mapApiUserToLocal(u, type) {
            // UserListSerializer returns full_name; UserDetailSerializer has first_name/last_name
            const fullName = u.full_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || u.email;
            const localRole = API_ROLE_TO_LOCAL[u.role] || 'etudiant-regulier';
            const localStatus = API_STATUS_TO_LOCAL[u.status] || 'actif';
            return {
                id: u.id,
                name: fullName,
                role: localRole,
                status: localStatus,
                email: u.email || '',
                phone: u.phone || '',
                type: type,
                lastLogin: u.last_login ? new Date(u.last_login).toLocaleString('fr-FR') : 'Jamais',
                matieres: u.matieres || [],
                // student-specific
                classe: u.classe || '',
                filiere: u.filiere || '',
                promotion: u.promotion || 'Promotion 2026',
                moyenne: u.moyenne ?? 0,
                cours: u.cours || '0 cours'
            };
        }

        async function refreshAccessToken() {
            const refresh = localStorage.getItem('refreshToken');
            if (!refresh) return null;
            try {
                const res = await fetch(`${API_BASE}/auth/users/refresh/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refresh })
                });
                if (!res.ok) return null;
                const data = await res.json();
                if (data.access) {
                    localStorage.setItem('authToken', data.access);
                    return data.access;
                }
            } catch (e) {
                console.warn('Refresh token error:', e);
            }
            return null;
        }

        async function apiFetch(path, options = {}, isRetry = false) {
            try {
                const res = await fetch(`${API_BASE}${path}`, {
                    ...options,
                    headers: { ...apiHeaders(), ...(options.headers || {}) }
                });
                if (res.status === 401 && !isRetry) {
                    const newToken = await refreshAccessToken();
                    if (newToken) {
                        return apiFetch(path, options, true);
                    }
                }
                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.detail || errData.message || `HTTP ${res.status}`);
                }
                if (res.status === 204) return null;
                return res.json();
            } catch (err) {
                throw err;
            }
        }

        async function fetchUsersFromApi() {
            const token = localStorage.getItem('authToken');
            if (!navigator.onLine || !token) return false;
            try {
                const [teachersData, studentsData] = await Promise.all([
                    apiFetch('/auth/users/?role=TEACHER&page_size=500'),
                    apiFetch('/auth/users/?role=STUDENT&page_size=500')
                ]);
                // Handle both paginated ({ results: [...] }) and plain array responses
                const teacherList = teachersData?.results ?? (Array.isArray(teachersData) ? teachersData : []);
                const studentList = studentsData?.results ?? (Array.isArray(studentsData) ? studentsData : []);
                if (teacherList.length > 0 || studentList.length > 0) {
                    personnel = teacherList.map(u => mapApiUserToLocal(u, 'personnel'));
                    clients   = studentList.map(u => mapApiUserToLocal(u, 'client'));
                    saveToLocalStorage();
                }
                console.log(`✅ API: ${personnel.length} professeurs, ${clients.length} élèves chargés`);
                return true;
            } catch (err) {
                console.warn('⚠️ API non disponible, utilisation du cache local:', err.message);
                return false;
            }
        }

        // ==================== DATA ====================
        let personnel = [];
        let clients = [];
        let courses = ["Entrepreneuriat", "Plan d'Affaires", "Sociologie des Affaires", "Éducation Technologique",
            "Développement Personnel", "Marketing", "Droit des Affaires", "Lois du Succès", "GRH", "Leadership",
            "Correspondance Admin", "Art Oratoire"
        ];
        let filieres = ["Entrepreneuriat", "Informatique", "Gestion", "Comptabilité", "Marketing", "Leadership",
            "Droit des Affaires", "GRH", "Commerce International"
        ];
        let classes = ["Entrepreneuriat 1", "Entrepreneuriat 2", "Entrepreneuriat 3", "Informatique 1", "Informatique 2",
            "Informatique 3", "Gestion 1", "Gestion 2", "Comptabilité 1", "Comptabilité 2", "Marketing 1", "Marketing 2",
            "Leadership 1", "Leadership 2", "Droit des Affaires 1", "GRH 1", "Commerce International 1"
        ];
        const elevesPresence = [
            { id: 1, nom: 'Marie Dupont', filiere: 'Plan d\'Affaires', presences: 18, total: 20 }, { id: 2,
                nom: 'Sophie Bernard', filiere: 'Plan d\'Affaires', presences: 20, total: 20 }, { id: 3,
                nom: 'Pierre Antoine', filiere: 'Entrepreneuriat', presences: 16, total: 20 }, { id: 4,
                nom: 'Jean Baptiste', filiere: 'Entrepreneuriat', presences: 19, total: 20 }, { id: 5,
                nom: 'Rose Michel', filiere: 'Marketing', presences: 14, total: 20 }, { id: 6,
                nom: 'Jameson Pierre', filiere: 'Marketing', presences: 18, total: 20 }, { id: 7,
                nom: 'Mireille Dumont', filiere: 'Leadership', presences: 20, total: 20 }, { id: 8,
                nom: 'Frantz Louis', filiere: 'Leadership', presences: 10, total: 20 }, { id: 9,
                nom: 'Marc Arthur', filiere: 'Droit des Affaires', presences: 17, total: 20 }, { id: 10,
                nom: 'Nathalie Pierre', filiere: 'Droit des Affaires', presences: 19, total: 20 }, { id: 11,
                nom: 'Carline Étienne', filiere: 'GRH', presences: 15, total: 20 }, { id: 12, nom: 'André Simon',
                filiere: 'GRH', presences: 13, total: 20 }, { id: 13, nom: 'Isabelle Martin',
            filiere: 'Art Oratoire', presences: 18, total: 20 }, { id: 14, nom: 'David Roche',
                filiere: 'Art Oratoire', presences: 16, total: 20 }, { id: 15, nom: 'Claire Fontaine',
                filiere: 'Développement Personnel', presences: 20, total: 20 }, { id: 16, nom: 'Paul Mercier',
                filiere: 'Développement Personnel', presences: 17, total: 20 }, { id: 17, nom: 'Thomas Martin',
                filiere: 'Sociologie des Affaires', presences: 10, total: 20 }, { id: 18, nom: 'Jacques Mentor',
                filiere: 'Sociologie des Affaires', presences: 19, total: 20 }
        ];
        let historiquePresences = {};
        let presenceStatus = {};
        elevesPresence.forEach(e => { presenceStatus[e.id] = 'present'; });
        let chartInstances = {};
        let currentMainTab = 'personnel';
        let currentFilter = 'all';
        let currentFiliereFilter = 'all';
        let currentClasseFilter = 'all';
        let allDetailsVisible = true;
        let nextPersonnelId = 200;
        let nextClientId = 300;
        let tempMatieres = [];
        let searchQueryPersonnel = '';
        let searchQueryClients = '';

        // ==================== UTILITY FUNCTIONS ====================
        function getInitials(name) { if (!name) return '??'; return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2); }

        function capitalize(str) { if (!str) return ''; return str.charAt(0).toUpperCase() + str.slice(1); }

        function escapeHtml(str) { if (str === undefined || str === null) return ''; const div = document.createElement('div'); div.textContent = String(str); return div.innerHTML; }

        function getRoleClass(role) { const map = { 'administrateur': 'role-administrateur',
                'directeur': 'role-directeur', 'secretaire': 'role-secretaire', 'comptable': 'role-comptable',
                'professeur': 'role-professeur', 'etudiant-excellent': 'role-etudiant-excellent',
                'etudiant-regulier': 'role-etudiant-regulier', 'etudiant-nouveau': 'role-etudiant-nouveau' }; return map[role] || 'role-etudiant'; }

        function getStatusClass(status) { const map = { 'actif': 'status-actif', 'inactif': 'status-inactif',
                'suspendu': 'status-suspendu' }; return map[status] || 'status-actif'; }

        function getIcon(role) { const map = { 'administrateur': 'fa-shield-halved', 'directeur': 'fa-user-tie',
                'secretaire': 'fa-headset', 'comptable': 'fa-calculator', 'professeur': 'fa-chalkboard-teacher',
                'etudiant-excellent': 'fa-star', 'etudiant-regulier': 'fa-user-graduate',
            'etudiant-nouveau': 'fa-user' }; return map[role] || 'fa-user'; }

        function getRoleDisplay(role) { const map = { 'administrateur': 'Administrateur', 'directeur': 'Directeur',
                'secretaire': 'Secrétaire', 'comptable': 'Comptable', 'professeur': 'Professeur',
                'etudiant-excellent': 'Élève Excellent ⭐', 'etudiant-regulier': 'Élève Régulier 📘',
                'etudiant-nouveau': 'Nouvel Élève 🆕' }; return map[role] || capitalize(role); }

        function getAvatarColor(i) { const c = ['#0A4D8C', '#D62828', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
                '#6366f1', '#14b8a6', '#e11d48', '#0891b2', '#7c3aed', '#059669', '#0A4D8C', '#D62828', '#10b981',
                '#f59e0b', '#8b5cf6', '#ec4899'
            ]; return c[i % c.length]; }

        function showToast(msg, type = 'success') { const icons = { success: 'fa-check-circle',
                error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' }; const el = document.createElement('div');
            el.className = `toast toast-${type}`;
            el.innerHTML = `<i class="fas ${icons[type]}"></i> ${escapeHtml(msg)}`;
            document.getElementById('toastContainer').appendChild(el);
            setTimeout(() => { el.style.opacity = '0';
                el.style.transform = 'translateX(100px)';
                el.style.transition = 'all .3s';
                setTimeout(() => el.remove(), 300); }, 3000); }

        function getTodayDate() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

        // ==================== SEARCH ====================
        function handleSearchInput(scope, value) {
            if (scope === 'personnel') { searchQueryPersonnel = value.trim().toLowerCase();
                document.getElementById('clearSearchPersonnel').style.display = searchQueryPersonnel ? 'flex' : 'none'; }
            else { searchQueryClients = value.trim().toLowerCase();
                document.getElementById('clearSearchClients').style.display = searchQueryClients ? 'flex' : 'none'; }
            renderAll();
        }

        function clearSearch(scope) {
            if (scope === 'personnel') { searchQueryPersonnel = ''; const input = document.getElementById('searchInputPersonnel'); if (input) input.value = '';
                document.getElementById('clearSearchPersonnel').style.display = 'none'; }
            else { searchQueryClients = ''; const input = document.getElementById('searchInputClients'); if (input) input.value = '';
                document.getElementById('clearSearchClients').style.display = 'none'; }
            renderAll();
        }

        function matchesSearch(user, query) {
            if (!query) return true;
            const haystack = [user.name, user.email, user.phone, user.classe, user.filiere, user.role]
                .concat(user.matieres || [])
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(query);
        }

        function resetAllFilters(scope) {
            currentFilter = 'all';
            if (scope === 'clients') { currentFiliereFilter = 'all'; currentClasseFilter = 'all'; clearSearch('clients'); }
            else { clearSearch('personnel'); }
            saveToLocalStorage();
            renderAll();
            showToast('Filtres réinitialisés', 'info');
        }

        // ==================== FILIERE & CLASSE MANAGEMENT ====================
        function applyFiliereFilter(filiere) { currentFiliereFilter = filiere; currentClasseFilter = 'all'; saveToLocalStorage(); renderAll(); }

        function applyClasseFilter() { const select = document.getElementById('classeFilter'); currentClasseFilter = select?.value || 'all'; saveToLocalStorage(); renderAll(); }

        function addNewFiliere() { const newFiliere = prompt('Nom de la nouvelle filière (ex: "Entrepreneuriat") :'); if (newFiliere && newFiliere.trim() && !filieres.includes(newFiliere.trim())) { filieres.push(newFiliere.trim()); saveToLocalStorage(); renderAll(); showToast(`Filière "${newFiliere}" ajoutée avec succès`, 'success'); } else if (newFiliere && filieres.includes(newFiliere.trim())) { showToast('Cette filière existe déjà', 'warning'); } }

        function promouvoirEleve(userId) { const user = clients.find(u => u.id === userId); if (!user || !user.classe) return; const match = user.classe.match(/^(.+?)\s*(\d+)$/); if (!match) { showToast('Format de classe non reconnu', 'error'); return; } const baseName = match[1]; const currentLevel = parseInt(match[2]); const newClasse = `${baseName} ${currentLevel + 1}`; if (!classes.includes(newClasse)) { classes.push(newClasse); if (!filieres.includes(baseName)) { filieres.push(baseName); }
                showToast(`Nouvelle classe "${newClasse}" créée`, 'info'); }
            user.classe = newClasse;
            if (!user.filiere) user.filiere = baseName;
            user.promotion = `Promotion ${new Date().getFullYear() + (currentLevel > 2 ? 0 : 2 - currentLevel)}`;
            const coursMatch = String(user.cours || '0 cours').match(/\d+/);
            const coursNum = coursMatch ? parseInt(coursMatch[0]) : 0;
            user.cours = `${coursNum + 2} cours`;
            saveToLocalStorage();
            renderAll();
            showToast(`${user.name} promu en "${newClasse}" 🎉`, 'success'); }

        function renderClasseFilter() { const select = document.getElementById('classeFilter'); if (!select) return; let filteredClasses = [...classes]; if (currentFiliereFilter && currentFiliereFilter !== 'all') { filteredClasses = classes.filter(c => c.startsWith(currentFiliereFilter)); } const stats = {};
            filteredClasses.forEach(c => { stats[c] = clients.filter(cl => cl.classe === c).length; });
            select.innerHTML = '<option value="all">📚 Toutes les classes</option>' + filteredClasses.map(c => { const count = stats[c] || 0; return `<option value="${c}" ${currentClasseFilter===c?'selected':''}>📖 ${c} (${count} élève${count!==1?'s':''})</option>`; }).join(''); }

        function renderFiliereFilterBar() { const container = document.getElementById('filiereFilterBar'); if (!container) return; const stats = {};
            filieres.forEach(f => { stats[f] = clients.filter(c => c.filiere === f).length; }); const totalAll = clients.length;
            let html = `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1;"><button class="filiere-btn ${currentFiliereFilter==='all'?'active':''}" onclick="applyFiliereFilter('all')"><i class="fas fa-layer-group"></i> Toutes <span class="count">${totalAll}</span></button>`;
            filieres.forEach(f => { const count = stats[f] || 0; if (count > 0 || currentFiliereFilter === f) { html += `<button class="filiere-btn ${currentFiliereFilter===f?'active':''}" onclick="applyFiliereFilter('${f}')"><i class="fas fa-graduation-cap"></i> ${f} <span class="count">${count}</span></button>`; } });
            html += `</div><div class="classe-select-wrapper"><select id="classeFilter" class="classe-select" onchange="applyClasseFilter()"><option value="all">📚 Toutes les classes</option></select><button class="btn-add-filiere" onclick="addNewFiliere()" title="Ajouter une filière"><i class="fas fa-plus"></i></button></div>`;
            container.innerHTML = html;
            renderClasseFilter(); }

        // ==================== EXPORT ====================
        function exportToCSV(data, filename) { if (!data || data.length === 0) { showToast('Aucune donnée à exporter', 'warning'); return; } let csv = ''; const headers = Object.keys(data[0]).filter(h => h !== 'type' && h !== 'lastLogin');
            csv += headers.join(',') + '\n';
            data.forEach(row => { csv += headers.map(h => { let value = row[h] || ''; if (Array.isArray(value)) value = value.join('; '); if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) { value = `"${value.replace(/"/g, '""')}"`; } return value; }).join(',') + '\n'; }); const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            showToast(`Exportation réussie: ${filename}.csv`, 'success'); }

        function exportCurrentView() { if (currentMainTab === 'personnel') { exportToCSV(personnel, 'professeurs_cejec'); }
            else if (currentMainTab === 'clients') { exportToCSV(clients, 'eleves_cejec'); } else { exportToCSV(elevesPresence, 'presences_cejec'); } }

        // ==================== MODAL MANAGEMENT ====================
        function openModal(action, id = null) { const overlay = document.getElementById('modalOverlay'); const modalContent = document.getElementById('modalContent');
            clearFieldErrors();
            tempMatieres = []; if (action === 'delete-confirm' && id) { const user = (currentMainTab === 'personnel' ? personnel : clients).find(u => u.id === id); if (!user) return;
                modalContent.innerHTML = `
                    <h2><i class="fas fa-exclamation-triangle" style="color:var(--red)"></i> Confirmer la suppression</h2>
                    <p style="margin-bottom:20px;font-size:0.95rem">Voulez-vous vraiment supprimer <strong>${escapeHtml(user.name)}</strong> ?<br>Cette action est irréversible.</p>
                    <div class="user-profile" style="margin-bottom:20px"><div class="avatar22">${getInitials(user.name)}</div><div><strong>${escapeHtml(user.name)}</strong><br><span class="badge ${getRoleClass(user.role)}">${getRoleDisplay(user.role)}</span>${user.classe?` <span class="badge badge-classe"><i class="fas fa-chalkboard"></i> ${escapeHtml(user.classe)}</span>`:''}</div></div>
                    <div class="modal-actions"><button class="btn-save btn-danger" onclick="confirmDelete(${id}); closeModal();"><i class="fas fa-trash"></i> Supprimer définitivement</button><button class="btn-cancel" onclick="closeModal()">Annuler</button></div>`; } else if (action === 'clear-history-confirm') {
                modalContent.innerHTML = `
                    <h2><i class="fas fa-exclamation-triangle" style="color:var(--red)"></i> Effacer l'historique</h2>
                    <p style="margin-bottom:20px;font-size:0.95rem">Voulez-vous vraiment effacer <strong>tout l'historique des présences</strong> ?<br>Cette action est irréversible et ne peut pas être annulée.</p>
                    <div class="modal-actions"><button class="btn-save btn-danger" onclick="doClearHistory(); closeModal();"><i class="fas fa-trash"></i> Effacer définitivement</button><button class="btn-cancel" onclick="closeModal()">Annuler</button></div>`; } else if (action === 'edit' && id) { const user = (currentMainTab === 'personnel' ? personnel : clients).find(u => u.id === id); if (!user) return; if (user.matieres) tempMatieres = [...user.matieres];
                modalContent.innerHTML = `
                    <h2><i class="fas fa-edit"></i> Modifier ${user.type==='personnel'?'le Professeur':"l'Élève"}</h2>
                    <form id="modalForm" onsubmit="saveUser(event)">
                        <input type="hidden" id="editId" value="${user.id}">
                        <div class="form-group"><label>Nom complet</label><input type="text" id="userName" value="${escapeHtml(user.name)}" required></div>
                        <div class="form-group"><label>Email</label><input type="email" id="userEmail" value="${escapeHtml(user.email)}" required></div>
                        <div class="form-group"><label>Téléphone</label><input type="text" id="userPhone" value="${escapeHtml(user.phone)}" required></div>
                        <div class="form-group"><label>Type</label><select id="userType" required onchange="updateRoleOptions()"><option value="personnel" ${user.type==='personnel'?'selected':''}>Professeur / Personnel</option><option value="client" ${user.type==='client'?'selected':''}>Élève</option></select></div>
                        <div class="form-group" id="classeGroup" style="display:${user.type==='client'?'block':'none'};"><label><i class="fas fa-chalkboard"></i> Classe</label><select id="userClasse"><option value="">Sélectionner une classe</option>${classes.map(c=>`<option value="${c}" ${user.classe===c?'selected':''}>${c}</option>`).join('')}</select></div>
                        <div class="form-group" id="filiereGroup" style="display:${user.type==='client'?'block':'none'};"><label><i class="fas fa-graduation-cap"></i> Filière</label><select id="userFiliere"><option value="">Sélectionner une filière</option>${filieres.map(f=>`<option value="${f}" ${user.filiere===f?'selected':''}>${f}</option>`).join('')}</select></div>
                        <div class="form-group"><label id="roleLabel">Rôle</label><select id="userRole" required onchange="handleRoleChange()"></select></div>
                        <div class="form-group" id="matieresGroup" style="display:none;"><label><i class="fas fa-book"></i> Matières enseignées</label><div class="matieres-edit-container" id="matieresEditContainer"></div><div class="input-matiere-wrapper"><input type="text" id="newMatiereInput" placeholder="Ex: Entrepreneuriat 101"><button type="button" class="btn-add-matiere-modal" onclick="addMatiereInModal()"><i class="fas fa-plus"></i> Ajouter</button></div></div>
                        <div class="form-group"><label>Statut</label><select id="userStatus" required><option value="actif" ${user.status==='actif'?'selected':''}>Actif</option><option value="inactif" ${user.status==='inactif'?'selected':''}>Inactif</option><option value="suspendu" ${user.status==='suspendu'?'selected':''}>Suspendu</option></select></div>
                        <div class="modal-actions"><button type="submit" class="btn-save"><i class="fas fa-save"></i> Enregistrer</button><button type="button" class="btn-cancel" onclick="closeModal()">Annuler</button></div></form>`;
                setTimeout(() => { populateRoleSelect(user.type);
                    document.getElementById('userRole').value = user.role;
                    handleRoleChange();
                    renderMatieresInModal(tempMatieres); }, 0); } else { const isPersonnel = currentMainTab === 'personnel';
                modalContent.innerHTML = `
                    <h2><i class="fas fa-user-plus"></i> Ajouter ${isPersonnel?'un Professeur':'un Élève'}</h2>
                    <form id="modalForm" onsubmit="saveUser(event)">
                        <input type="hidden" id="editId" value="">
                        <div class="form-group"><label>Nom complet</label><input type="text" id="userName" placeholder="Ex: Jean Baptiste" required></div>
                        <div class="form-group"><label>Email</label><input type="email" id="userEmail" placeholder="Ex: jean@cejec.edu.ht" required></div>
                        <div class="form-group"><label>Téléphone</label><input type="text" id="userPhone" placeholder="Ex: +509 33 44 55 66" required></div>
                        <div class="form-group"><label>Type</label><select id="userType" required onchange="updateRoleOptions()"><option value="personnel" ${isPersonnel?'selected':''}>Professeur / Personnel</option><option value="client" ${!isPersonnel?'selected':''}>Élève</option></select></div>
                        <div class="form-group" id="classeGroup" style="display:${!isPersonnel?'block':'none'};"><label><i class="fas fa-chalkboard"></i> Classe</label><select id="userClasse"><option value="">Sélectionner une classe</option>${classes.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
                        <div class="form-group" id="filiereGroup" style="display:${!isPersonnel?'block':'none'};"><label><i class="fas fa-graduation-cap"></i> Filière</label><select id="userFiliere"><option value="">Sélectionner une filière</option>${filieres.map(f=>`<option value="${f}">${f}</option>`).join('')}</select></div>
                        <div class="form-group"><label id="roleLabel">Rôle</label><select id="userRole" required onchange="handleRoleChange()"></select></div>
                        <div class="form-group" id="matieresGroup" style="display:none;"><label><i class="fas fa-book"></i> Matières enseignées</label><div class="matieres-edit-container" id="matieresEditContainer"></div><div class="input-matiere-wrapper"><input type="text" id="newMatiereInput" placeholder="Ex: Entrepreneuriat 101"><button type="button" class="btn-add-matiere-modal" onclick="addMatiereInModal()"><i class="fas fa-plus"></i> Ajouter</button></div></div>
                        <div class="form-group"><label>Mot de passe</label><input type="password" id="userPassword" placeholder="Minimum 8 caractères" required></div>
                        <div class="form-group"><label>Statut</label><select id="userStatus" required><option value="actif">Actif</option><option value="inactif">Inactif</option><option value="suspendu">Suspendu</option></select></div>
                        <div class="modal-actions"><button type="submit" class="btn-save"><i class="fas fa-save"></i> Enregistrer</button><button type="button" class="btn-cancel" onclick="closeModal()">Annuler</button></div></form>`;
                setTimeout(() => { populateRoleSelect(isPersonnel ? 'personnel' : 'client');
                    renderMatieresInModal([]); }, 0); }
            overlay.classList.add('open'); }

        function closeModal() { document.getElementById('modalOverlay').classList.remove('open');
            tempMatieres = [];
            clearFieldErrors(); }

        function saveUser(e) {
            e.preventDefault();
            clearFieldErrors();
            const id = document.getElementById('editId')?.value;
            const name = document.getElementById('userName').value.trim();
            const email = document.getElementById('userEmail').value.trim();
            const phone = document.getElementById('userPhone').value.trim();
            const type = document.getElementById('userType').value;
            const role = document.getElementById('userRole').value;
            const status = document.getElementById('userStatus').value;
            const classe = document.getElementById('userClasse')?.value;
            const filiere = document.getElementById('userFiliere')?.value;
            const password = document.getElementById('userPassword')?.value;
            let hasError = false;
            
            if (!id && (!password || password.length < 8)) { 
                showFieldError('userPassword', 'Minimum 8 caractères requis');
                hasError = true; 
            }
            if (!name || name.length < 3) { showFieldError('userName', 'Le nom doit contenir au moins 3 caractères');
                hasError = true; }
            if (!validateEmail(email)) { showFieldError('userEmail', 'Format d\'email invalide');
                hasError = true; }
            else if (isDuplicateEmail(email, type, id ? parseInt(id) : null)) { showFieldError('userEmail', 'Cet email est déjà utilisé par un autre membre');
                hasError = true; }
            if (!validatePhone(phone)) { showFieldError('userPhone', 'Format: +509 XX XX XX XX');
                hasError = true; }
            if (type === 'client' && !classe) { showFieldError('userClasse', 'Veuillez sélectionner une classe');
                hasError = true; }
            if (type === 'client' && !filiere) { showFieldError('userFiliere', 'Veuillez sélectionner une filière');
                hasError = true; }
            if (hasError) { showToast('Veuillez corriger les erreurs', 'error'); return; }
            const existingForLastLogin = id ? (currentMainTab === 'personnel' ? personnel : clients).find(u => u.id === parseInt(id)) : null;
            const userData = { name, email, phone, type, role, status, lastLogin: existingForLastLogin ? existingForLastLogin.lastLogin : 'Jamais' };
            if (type === 'personnel') { userData.matieres = role === 'professeur' ? [...tempMatieres] : []; }
            else {
                userData.classe = classe;
                userData.filiere = filiere;
                if (!classes.includes(classe)) classes.push(classe);
                if (!filieres.includes(filiere)) filieres.push(filiere);
                if (id) {
                    const existing = clients.find(u => u.id === parseInt(id));
                    userData.promotion = existing?.promotion || 'Promotion 2026';
                    userData.moyenne = existing?.moyenne ?? 0;
                    userData.cours = existing?.cours || '0 cours';
                } else {
                    userData.promotion = 'Promotion 2026';
                    userData.moyenne = 0;
                    userData.cours = '0 cours';
                }
            }
            
            // ---- Capture old state for API ----
            let oldRoleApi = null;
            let oldStatusApi = null;
            if (id) {
                const arr = type === 'personnel' ? personnel : clients;
                const existingForDiff = arr.find(u => u.id === parseInt(id));
                if (existingForDiff) {
                    oldRoleApi = ROLE_TO_API[existingForDiff.role] || 'STUDENT';
                    oldStatusApi = STATUS_TO_API[existingForDiff.status] || 'ACTIVE';
                }
            }

            // ---- Optimistic local update ----
            if (id) {
                const arr = type === 'personnel' ? personnel : clients;
                const idx = arr.findIndex(u => u.id === parseInt(id));
                if (idx !== -1) arr[idx] = { ...arr[idx], ...userData };
            } else {
                userData.id = type === 'personnel' ? nextPersonnelId++ : nextClientId++;
                if (type === 'personnel') personnel.push(userData); else clients.push(userData);
            }
            closeModal();
            tempMatieres = [];
            saveToLocalStorage();
            renderAll();

            // ---- Background API sync ----
            const nameParts = name.trim().split(' ');
            const apiPayload = {
                first_name: nameParts[0] || '',
                last_name: nameParts.slice(1).join(' ') || '',
                email,
                phone,
                role: ROLE_TO_API[role] || 'STUDENT',
                status: STATUS_TO_API[status] || 'ACTIVE'
            };
            if (!id) {
                // CREATE
                apiPayload.password = password;
                apiPayload.password_confirm = password;
                apiFetch('/auth/users/register/', {
                    method: 'POST',
                    body: JSON.stringify(apiPayload)
                }).then(res => {
                    if (res && res.id) {
                        // update local id with real server id
                        const arr = type === 'personnel' ? personnel : clients;
                        const local = arr.find(u => u.email === email);
                        if (local) local.id = res.id;
                        saveToLocalStorage();
                    }
                    showToast(`${name} ajouté ✓ (synchronisé avec le serveur)`, 'success');
                }).catch(err => {
                    showToast(`${name} ajouté localement (sync échouée: ${err.message})`, 'warning');
                });
            } else {
                // UPDATE
                const newRoleApi = ROLE_TO_API[role] || 'STUDENT';
                const newStatusApi = STATUS_TO_API[status] || 'ACTIVE';
                
                apiFetch(`/auth/users/${id}/`, {
                    method: 'PATCH',
                    body: JSON.stringify(apiPayload)
                }).then(async () => {
                    try {
                        if (oldRoleApi && oldRoleApi !== newRoleApi) {
                            await apiFetch(`/auth/users/${id}/change-role/`, {
                                method: 'POST',
                                body: JSON.stringify({ role: newRoleApi })
                            });
                        }
                        if (oldStatusApi && oldStatusApi !== newStatusApi) {
                            await apiFetch(`/auth/users/${id}/change-status/`, {
                                method: 'POST',
                                body: JSON.stringify({ status: newStatusApi })
                            });
                        }
                        showToast(`${name} modifié ✓`, 'success');
                    } catch (roleStatusErr) {
                        showToast(`Modifié partiellement (erreur de rôle/statut: ${roleStatusErr.message})`, 'warning');
                    }
                }).catch(err => {
                    showToast(`${name} modifié localement (sync échouée: ${err.message})`, 'warning');
                });
            }
        }

        function confirmDelete(id) {
            let user, userName;
            if (currentMainTab === 'personnel') {
                user = personnel.find(u => u.id === id);
                personnel = personnel.filter(u => u.id !== id);
            } else {
                user = clients.find(u => u.id === id);
                clients = clients.filter(u => u.id !== id);
            }
            userName = user ? user.name : 'Utilisateur';
            // Prevent deletion of admin users
            if (user && user.role === 'administrateur') {
                showToast(`${userName} est un administrateur et ne peut pas être supprimé.`, 'warning');
                renderAll();
                return;
            }
            saveToLocalStorage();
            renderAll();
            // Deactivate then delete to avoid server 500 errors
            apiFetch(`/auth/users/${id}/change-status/`, { method: 'POST', body: JSON.stringify({ status: 'INACTIVE' }) })
                .then(() => apiFetch(`/auth/users/${id}/`, { method: 'DELETE' }))
                .then(() => showToast(`${userName} supprimé ✓`, 'info'))
                .catch(err => {
                    showToast(`${userName} suppression échouée: ${err.message}`, 'error');
                });
        }

        // ==================== UI INTERACTIONS ====================
        function toggleDetails(id) { const details = document.getElementById(`details-${id}`); if (details) { details.classList.toggle('hidden'); } }

        function toggleAllDetails() { allDetailsVisible = !allDetailsVisible; const btn = document.querySelector('.btn-toggle-all'); if (!btn) return; const icon = btn.querySelector('i'); const span = btn.querySelector('span'); if (icon && span) { icon.className = allDetailsVisible ? 'fas fa-eye-slash' : 'fas fa-eye';
                span.textContent = allDetailsVisible ? 'Masquer tous les détails' : 'Afficher tous les détails'; }
            renderAll(); }

        const ROLE_OPTIONS = {
            personnel: [
                { value: 'administrateur', text: '👑 Administrateur' },
                { value: 'directeur', text: '👔 Directeur' },
                { value: 'secretaire', text: '📋 Secrétaire' },
                { value: 'comptable', text: '💼 Comptable' },
                { value: 'professeur', text: '👨‍🏫 Professeur' }
            ],
            client: [
                { value: 'etudiant-excellent', text: '⭐ Élève Excellent (≥85)' },
                { value: 'etudiant-regulier', text: '📘 Élève Régulier (60-84)' },
                { value: 'etudiant-nouveau', text: '🆕 Nouvel Élève (<60)' }
            ]
        };

        function populateRoleSelect(userType) {
            const roleSelect = document.getElementById('userRole'); const roleLabel = document.getElementById('roleLabel'); const classeGroup = document.getElementById('classeGroup'); const filiereGroup = document.getElementById('filiereGroup');
            if (!roleSelect || !roleLabel) return;
            roleSelect.innerHTML = '';
            const options = userType === 'personnel' ? ROLE_OPTIONS.personnel : ROLE_OPTIONS.client;
            roleLabel.textContent = userType === 'personnel' ? 'Fonction' : 'Niveau Élève';
            options.forEach(r => { const o = document.createElement('option'); o.value = r.value; o.textContent = r.text; roleSelect.appendChild(o); });
            if (classeGroup) classeGroup.style.display = userType === 'personnel' ? 'none' : 'block';
            if (filiereGroup) filiereGroup.style.display = userType === 'personnel' ? 'none' : 'block';
            handleRoleChange();
        }

        function updateRoleOptions() { const userType = document.getElementById('userType')?.value; if (!userType) return;
            populateRoleSelect(userType); }

        function handleRoleChange() { const userType = document.getElementById('userType')?.value; const role = document.getElementById('userRole')?.value; const matieresGroup = document.getElementById('matieresGroup'); if (matieresGroup) { matieresGroup.style.display = (userType === 'personnel' && role === 'professeur') ? 'block' : 'none'; } }

        function renderMatieresInModal(matieres) { const container = document.getElementById('matieresEditContainer'); if (!container) return;
            container.innerHTML = '';
            matieres.forEach((matiere, index) => { const tag = document.createElement('span');
                tag.className = 'matiere-edit-tag';
                tag.innerHTML = `<i class="fas fa-book"></i> ${escapeHtml(matiere)}<button type="button" class="btn-remove-edit" onclick="removeMatiereInModal(${index})"><i class="fas fa-times"></i></button>`;
                container.appendChild(tag); }); }

        function addMatiereInModal() { const input = document.getElementById('newMatiereInput'); if (!input) return; const matiere = input.value.trim().replace(/\s+/g, ' '); if (!matiere) { input.focus(); return; } const exists = tempMatieres.some(m => m.toLowerCase() === matiere.toLowerCase()); if (exists) { showToast('Cette matière existe déjà', 'warning');
            input.focus(); return; }
        tempMatieres.push(matiere);
        renderMatieresInModal(tempMatieres); if (!courses.some(c => c.toLowerCase() === matiere.toLowerCase())) { courses.push(matiere);
            saveToLocalStorage(); }
        input.value = '';
        input.focus(); }

        function removeMatiereInModal(index) { tempMatieres.splice(index, 1);
            renderMatieresInModal(tempMatieres); }

        function addMatiereInline(userId) { const user = personnel.find(u => u.id === userId); if (!user || !user.matieres) return; const nouvelleMatiere = prompt('Nom de la nouvelle matière :'); if (!nouvelleMatiere) return; const cleaned = nouvelleMatiere.trim().replace(/\s+/g, ' '); if (!cleaned) return; const exists = user.matieres.some(m => m.toLowerCase() === cleaned.toLowerCase()); if (exists) { showToast('Cette matière existe déjà pour ce professeur', 'warning'); return; }
            user.matieres.push(cleaned); if (!courses.some(c => c.toLowerCase() === cleaned.toLowerCase())) { courses.push(cleaned); }
            saveToLocalStorage();
            renderAll();
            showToast('Matière ajoutée avec succès', 'success'); }

        function removeMatiereInline(userId, matiereIndex) { const user = personnel.find(u => u.id === userId); if (!user || !user.matieres) return;
            user.matieres.splice(matiereIndex, 1);
            saveToLocalStorage();
            renderAll(); }

        function filterStats(filter, el) { currentFilter = filter;
            document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active')); if (el) el.classList.add('active');
            renderAll(); }

        function handleAddButton() { if (currentMainTab === 'presences') { showToast('Ajout d\'élève depuis la section Élèves', 'info'); return; }
            openModal('add'); }

        // ==================== RENDER FUNCTIONS ====================
        function renderAll() { renderPersonnel();
            renderClients(); if (currentMainTab === 'presences') { renderPresences();
                renderPresenceStats(); }
            updatePageVisibility();
            renderCourseSelect();
            document.getElementById('personnelCount').textContent = personnel.length;
            document.getElementById('clientCount').textContent = clients.length; }

        function renderPersonnel() { let data = [...personnel]; if (currentFilter === 'actif') data = data.filter(u => u.status === 'actif'); else if (currentFilter === 'inactif') data = data.filter(u => u.status !== 'actif'); if (searchQueryPersonnel) data = data.filter(u => matchesSearch(u, searchQueryPersonnel)); const container = document.getElementById('usersContainerPersonnel'); const total = personnel.length; const actifs = personnel.filter(u => u.status === 'actif').length; const inactifs = personnel.filter(u => u.status !== 'actif').length; const professeurs = personnel.filter(u => u.role === 'professeur').length; const totalMatieres = personnel.reduce((sum, u) => sum + (u.matieres ? u.matieres.length : 0), 0);
        document.getElementById('statsContainerPersonnel').innerHTML = `<div class="stat-card ${currentFilter==='all'?'active':''}" data-filter="all" onclick="filterStats('all', this)"><div class="stat-info"><span class="stat-label">Total Personnel</span><h2>${total}</h2></div><i class="fas fa-users stat-icon"></i></div><div class="stat-card ${currentFilter==='actif'?'active':''}" data-filter="actif" onclick="filterStats('actif', this)"><div class="stat-info"><span class="stat-label">Actifs</span><h2>${actifs}</h2></div><span class="dot dot-actif"></span></div><div class="stat-card ${currentFilter==='inactif'?'active':''}" data-filter="inactif" onclick="filterStats('inactif', this)"><div class="stat-info"><span class="stat-label">Inactifs/Suspendus</span><h2>${inactifs}</h2></div><span class="dot dot-inactif"></span></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Professeurs</span><h2>${professeurs}</h2></div><i class="fas fa-chalkboard-teacher stat-icon" style="color:var(--blue);"></i></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Total Matières</span><h2>${totalMatieres}</h2></div><i class="fas fa-book stat-icon" style="color:var(--warning);"></i></div>`;
        document.getElementById('personnelResultCount').textContent = `${data.length} résultat${data.length !== 1 ? 's' : ''}`;
        container.innerHTML = ''; if (data.length === 0) { container.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><h3>Aucun utilisateur trouvé</h3><p>${searchQueryPersonnel ? 'Aucun résultat pour "'+escapeHtml(searchQueryPersonnel)+'".' : 'Aucun membre du personnel avec les filtres actuels.'}</p></div>`; }
        else { data.forEach(user => { const hiddenClass = allDetailsVisible ? '' : 'hidden'; let matieresHTML = ''; if (user.matieres && user.matieres.length > 0) { matieresHTML = `<div class="detail-item" style="flex-wrap:wrap;"><i class="fas fa-book"></i><div class="matieres-list">${user.matieres.map((m,i)=>`<span class="matiere-tag">${escapeHtml(m)}${user.role==='professeur'?`<button class="btn-remove-matiere" onclick="event.stopPropagation();removeMatiereInline(${user.id},${i})"><i class="fas fa-times"></i></button>`:''}</span>`).join('')}${user.role==='professeur'?`<button class="btn-add-matiere" onclick="event.stopPropagation();addMatiereInline(${user.id})"><i class="fas fa-plus"></i> Ajouter</button>`:''}</div></div>`; }
            else if (user.role === 'professeur') { matieresHTML = `<div class="detail-item" style="flex-wrap:wrap;"><i class="fas fa-book"></i><span style="color:var(--muted-light);font-style:italic;">Aucune matière assignée</span><button class="btn-add-matiere" onclick="event.stopPropagation();addMatiereInline(${user.id})" style="margin-left:8px;"><i class="fas fa-plus"></i> Ajouter</button></div>`; } const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `<div><div class="user-profile"><div class="avatar22">${getInitials(user.name)}</div><div class="user-meta"><h3><i class="fas ${getIcon(user.role)}" style="color:var(--blue);"></i> ${escapeHtml(user.name)}</h3><div class="badges"><span class="badge ${getRoleClass(user.role)}">${getRoleDisplay(user.role)}</span><span class="badge ${getStatusClass(user.status)}">${capitalize(user.status)}</span></div></div></div><div class="user-details ${hiddenClass}" id="details-${user.id}"><div class="detail-item"><i class="fas fa-envelope"></i> ${escapeHtml(user.email)}</div><div class="detail-item"><i class="fas fa-phone"></i> ${escapeHtml(user.phone)}</div>${matieresHTML}<div class="detail-item"><i class="fas fa-clock"></i> Dernière connexion: ${escapeHtml(user.lastLogin)}</div></div></div><div class="user-actions"><button class="btn-toggle-info" onclick="toggleDetails(${user.id})" title="${allDetailsVisible?'Masquer':'Afficher'} détails"><i class="fas ${allDetailsVisible?'fa-eye-slash':'fa-eye'}"></i></button><button class="btn-action" onclick="openModal('edit', ${user.id})" title="Modifier"><i class="fas fa-pen"></i> Modifier</button><button class="btn-delete" onclick="openModal('delete-confirm', ${user.id})" title="Supprimer"><i class="fas fa-trash"></i></button></div>`;
        container.appendChild(card); }); } }

        function renderClients() { let data = [...clients]; if (currentFilter === 'actif') data = data.filter(u => u.status === 'actif'); else if (currentFilter === 'inactif') data = data.filter(u => u.status !== 'actif'); if (currentFiliereFilter && currentFiliereFilter !== 'all') { data = data.filter(u => u.filiere === currentFiliereFilter); } if (currentClasseFilter && currentClasseFilter !== 'all') { data = data.filter(u => u.classe === currentClasseFilter); } if (searchQueryClients) data = data.filter(u => matchesSearch(u, searchQueryClients)); const container = document.getElementById('usersContainerClients'); const total = clients.length; const actifs = clients.filter(u => u.status === 'actif').length; const inactifs = clients.filter(u => u.status !== 'actif').length; const excellents = clients.filter(u => u.role === 'etudiant-excellent').length; const moyenneGlobale = clients.length > 0 ? Math.round(clients.reduce((sum, u) => sum + (u.moyenne || 0), 0) / clients.length) : 0;
        document.getElementById('statsContainerClients').innerHTML = `<div class="stat-card ${currentFilter==='all'?'active':''}" data-filter="all" onclick="filterStats('all', this)"><div class="stat-info"><span class="stat-label">Total Élèves</span><h2>${total}</h2></div><i class="fas fa-user-graduate stat-icon"></i></div><div class="stat-card ${currentFilter==='actif'?'active':''}" data-filter="actif" onclick="filterStats('actif', this)"><div class="stat-info"><span class="stat-label">Actifs</span><h2>${actifs}</h2></div><span class="dot dot-actif"></span></div><div class="stat-card ${currentFilter==='inactif'?'active':''}" data-filter="inactif" onclick="filterStats('inactif', this)"><div class="stat-info"><span class="stat-label">Inactifs</span><h2>${inactifs}</h2></div><span class="dot dot-inactif"></span></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Excellents</span><h2>${excellents}</h2></div><i class="fas fa-star stat-icon" style="color:var(--warning);"></i></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Moyenne Générale</span><h2>${moyenneGlobale}%</h2></div><i class="fas fa-chart-line stat-icon" style="color:var(--success);"></i></div>`;
        document.getElementById('clientResultCount').textContent = `${data.length} résultat${data.length !== 1 ? 's' : ''}`;
        renderFiliereFilterBar();
        container.innerHTML = ''; if (data.length === 0) { container.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><h3>Aucun utilisateur trouvé</h3><p>${searchQueryClients ? 'Aucun résultat pour "'+escapeHtml(searchQueryClients)+'".' : 'Aucun élève avec les filtres actuels.'}</p></div>`; }
        else { data.forEach(user => { const hiddenClass = allDetailsVisible ? '' : 'hidden'; const extraHTML = `<div class="student-extra-info"><span class="info-tag"><i class="fas fa-calendar"></i> ${escapeHtml(user.promotion)}</span><span class="info-tag"><i class="fas fa-chart-line"></i> ${user.moyenne}%</span><span class="info-tag"><i class="fas fa-book"></i> ${escapeHtml(user.cours)}</span>${user.classe?`<span class="info-tag" style="background:#fce7f3;color:#9d174d;border-color:#fbcfe8;"><i class="fas fa-chalkboard"></i> ${escapeHtml(user.classe)}</span>`:''}${user.filiere?`<span class="info-tag" style="background:#ede9fe;color:#5b21b6;border-color:#ddd6fe;"><i class="fas fa-graduation-cap"></i> ${escapeHtml(user.filiere)}</span>`:''}</div>`; const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `<div><div class="user-profile"><div class="avatar22">${getInitials(user.name)}</div><div class="user-meta"><h3><i class="fas ${getIcon(user.role)}" style="color:var(--blue);"></i> ${escapeHtml(user.name)}</h3><div class="badges"><span class="badge ${getRoleClass(user.role)}">${getRoleDisplay(user.role)}</span><span class="badge ${getStatusClass(user.status)}">${capitalize(user.status)}</span>${user.classe?`<span class="badge badge-classe"><i class="fas fa-chalkboard"></i> ${escapeHtml(user.classe)}</span>`:''}${user.filiere?`<span class="badge" style="background:#ede9fe;color:#5b21b6;"><i class="fas fa-graduation-cap"></i> ${escapeHtml(user.filiere)}</span>`:''}</div>${extraHTML}</div></div><div class="user-details ${hiddenClass}" id="details-${user.id}"><div class="detail-item"><i class="fas fa-envelope"></i> ${escapeHtml(user.email)}</div><div class="detail-item"><i class="fas fa-phone"></i> ${escapeHtml(user.phone)}</div>${user.classe?`<div class="detail-item"><i class="fas fa-chalkboard"></i> Classe: ${escapeHtml(user.classe)}</div>`:''}${user.filiere?`<div class="detail-item"><i class="fas fa-graduation-cap"></i> Filière: ${escapeHtml(user.filiere)}</div>`:''}<div class="detail-item"><i class="fas fa-calendar"></i> ${escapeHtml(user.promotion)}</div><div class="detail-item"><i class="fas fa-chart-line"></i> Moyenne: ${user.moyenne}%</div><div class="detail-item"><i class="fas fa-book"></i> ${escapeHtml(user.cours)}</div><div class="detail-item"><i class="fas fa-clock"></i> Dernière connexion: ${escapeHtml(user.lastLogin)}</div></div></div><div class="user-actions"><button class="btn-toggle-info" onclick="toggleDetails(${user.id})" title="${allDetailsVisible?'Masquer':'Afficher'} détails"><i class="fas ${allDetailsVisible?'fa-eye-slash':'fa-eye'}"></i></button><button class="btn-action" onclick="openModal('edit', ${user.id})" title="Modifier"><i class="fas fa-pen"></i> Modifier</button>${user.classe?`<button class="btn-promote" onclick="promouvoirEleve(${user.id})" title="Promouvoir en classe supérieure"><i class="fas fa-arrow-up"></i> Monter</button>`:''}<button class="btn-delete" onclick="openModal('delete-confirm', ${user.id})" title="Supprimer"><i class="fas fa-trash"></i></button></div>`;
        container.appendChild(card); }); } }

        function renderCourseSelect() { const select = document.getElementById('courseFilter'); if (!select) return; const previousValue = select.value;
            select.innerHTML = courses.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
            if (previousValue && courses.includes(previousValue)) { select.value = previousValue; } }

        function getFilteredElevesPresence() { const cf = document.getElementById('courseFilter')?.value || 'Entrepreneuriat'; return elevesPresence.filter(e => e.filiere === cf); }

        function setAttendance(studentId, status) { presenceStatus[studentId] = status; const row = document.querySelector(`tr[data-student-id="${studentId}"]`); if (!row) return;
            row.querySelectorAll('.btn-status').forEach(b => b.classList.remove('active')); const activeBtn = row.querySelector(`.btn-${status}`); if (activeBtn) activeBtn.classList.add('active'); const statusCell = row.querySelector('.student-status'); let badge = ''; if (status === 'present') { badge = '<span class="status-badge-presence state-present"><i class="fas fa-check-circle"></i> Présent</span>'; }
            else if (status === 'absent') { badge = '<span class="status-badge-presence state-absent"><i class="fas fa-times-circle"></i> Absent</span>'; }
            else { badge = '<span class="status-badge-presence state-retard"><i class="fas fa-clock"></i> Retard</span>'; }
            statusCell.innerHTML = badge; const badgeEl = statusCell.querySelector('.status-badge-presence'); if (badgeEl) { badgeEl.classList.add('updated');
            setTimeout(() => badgeEl.classList.remove('updated'), 500); }
            updatePresenceCounters();
            updatePresenceCharts(); const eleve = elevesPresence.find(e => e.id === studentId); if (eleve) { const statusText = status === 'present' ? 'Présent' : status === 'absent' ? 'Absent' : 'Retard'; const toastType = status === 'present' ? 'success' : status === 'absent' ? 'error' : 'info';
                showToast(`${eleve.nom} : ${statusText}`, toastType); }
            saveToLocalStorage(); }

        function renderAttendanceTable() { const filtered = getFilteredElevesPresence(); const cf = document.getElementById('courseFilter')?.value || 'Entrepreneuriat'; const display = document.getElementById('courseDisplay'); if (display) display.textContent = cf; const tbody = document.getElementById('attendanceBody'); if (!tbody) return;
            if (filtered.length === 0) { tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state" style="padding:30px 10px;"><i class="fas fa-user-slash"></i><h3>Aucun élève</h3><p>Aucun élève inscrit pour la filière "${escapeHtml(cf)}".</p></div></td></tr>`;
                updatePresenceCounters();
                updatePresenceCharts(); return; }
            tbody.innerHTML = filtered.map((e, i) => { const s = presenceStatus[e.id] || 'present'; let badge = '', ap = '', aa = '', ar = ''; if (s === 'present') { badge = '<span class="status-badge-presence state-present"><i class="fas fa-check-circle"></i> Présent</span>';
                    ap = 'active' } else if (s === 'absent') { badge = '<span class="status-badge-presence state-absent"><i class="fas fa-times-circle"></i> Absent</span>';
                    aa = 'active' } else { badge = '<span class="status-badge-presence state-retard"><i class="fas fa-clock"></i> Retard</span>';
                    ar = 'active' } return `<tr data-student-id="${e.id}"><td><span class="student-name"><span class="avatar-xs" style="background:${getAvatarColor(i)}">${getInitials(e.nom)}</span>${escapeHtml(e.nom)}</span></td><td class="student-status">${badge}</td><td><div class="action-btns"><button class="btn-status btn-present ${ap}" onclick="setAttendance(${e.id},'present')">Présent</button><button class="btn-status btn-absent ${aa}" onclick="setAttendance(${e.id},'absent')">Absent</button><button class="btn-status btn-retard ${ar}" onclick="setAttendance(${e.id},'retard')">Retard</button></div></td></tr>`; }).join('');
            updatePresenceCounters();
            updatePresenceCharts(); }

        function savePresences() { const today = document.getElementById('dateFilter')?.value || getTodayDate(); const cours = document.getElementById('courseFilter')?.value || 'Entrepreneuriat'; const filtered = getFilteredElevesPresence(); if (filtered.length === 0) { showToast('Aucun élève à enregistrer pour cette filière', 'warning'); return; } if (!historiquePresences[today]) historiquePresences[today] = {}; if (!historiquePresences[today][cours]) historiquePresences[today][cours] = {}; let p = 0, a = 0, r = 0;
        filtered.forEach(e => { const s = presenceStatus[e.id] || 'present';
            historiquePresences[today][cours][e.id] = s; if (s === 'present') p++;
            else if (s === 'absent') a++;
            else r++; if (s === 'present' || s === 'retard') { e.presences = Math.min(e.presences + 1, e.total); } });
            saveToLocalStorage();
            showToast(`Appel du ${today} enregistré : ${p} présents, ${a} absents, ${r} retards`, 'success');
            renderHistory();
            renderPresenceStats(); }

        function renderHistory() { const container = document.getElementById('historyContainer'); if (!container) return; const dates = Object.keys(historiquePresences).sort().reverse(); if (dates.length === 0) { container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-times"></i><h3>Aucun historique</h3><p>Enregistrez votre premier appel pour voir l'historique</p></div>`; return; }
        container.innerHTML = dates.slice(0, 10).map(date => { const coursData = historiquePresences[date]; const coursList = Object.keys(coursData).map(cours => { const eleves = coursData[cours]; let p = 0, a = 0, r = 0;
                Object.values(eleves).forEach(s => { if (s === 'present') p++;
                    else if (s === 'absent') a++;
                    else r++; }); return `<span style="font-size:0.8rem;color:var(--muted);margin-left:8px">${escapeHtml(cours)}: <span style="color:var(--green-ui);font-weight:600">${p}P</span> <span style="color:var(--red);font-weight:600">${a}A</span> <span style="color:var(--orange-ui);font-weight:600">${r}R</span></span>`; }).join(''); return `<div class="presence-day-card"><h4><i class="fas fa-calendar-check"></i> ${new Date(date+'T00:00:00').toLocaleDateString('fr-FR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</h4><div style="display:flex;flex-wrap:wrap;gap:4px">${coursList}</div></div>`; }).join(''); }

        function clearHistory() { if (Object.keys(historiquePresences).length === 0) { showToast('Aucun historique à effacer', 'info'); return; }
            openModal('clear-history-confirm'); }

        function doClearHistory() { historiquePresences = {};
            saveToLocalStorage();
            renderHistory();
            showToast('Historique effacé', 'info'); }

        function renderPresenceStats() { const container = document.getElementById('presenceStatsGrid'); if (!container) return;
            container.innerHTML = elevesPresence.map(eleve => { const taux = eleve.total > 0 ? Math.round((eleve.presences / eleve.total) * 100) : 0; let barClass = 'bar-green'; let textClass = 'text-green'; if (taux < 50) { barClass = 'bar-red';
                    textClass = 'text-red'; } else if (taux < 75) { barClass = 'bar-blue';
                    textClass = 'text-blue'; } return `<div class="student-stat-card"><div class="stat-student-name"><i class="fas fa-user-circle" style="color:var(--blue)"></i>${escapeHtml(eleve.nom)}</div><div class="stat-student-class">${escapeHtml(eleve.filiere)}</div><div class="stat-progress-row"><span class="stat-label-presence">Taux de présence</span><span class="stat-percentage ${textClass}">${taux}%</span></div><div class="progress-bar-container"><div class="progress-bar ${barClass}" style="width:${taux}%"></div></div><div class="stat-progress-row"><span class="stat-label-presence">Présences</span><span>${eleve.presences}/${eleve.total}</span></div><div class="stat-footer">${eleve.total-eleve.presences} absence${eleve.total-eleve.presences>1?'s':''} enregistrée${eleve.total-eleve.presences>1?'s':''}</div></div>`; }).join(''); }

        function updatePresenceCounters() { const f = getFilteredElevesPresence(); let p = 0, a = 0, r = 0;
        f.forEach(e => { const s = presenceStatus[e.id] || 'present'; if (s === 'present') p++;
            else if (s === 'absent') a++;
            else r++; }); const countTotal = document.getElementById('count-total'); const countPresents = document.getElementById('count-presents'); const countAbsents = document.getElementById('count-absents'); const countRetards = document.getElementById('count-retards'); if (countTotal) countTotal.textContent = f.length; if (countPresents) countPresents.textContent = p; if (countAbsents) countAbsents.textContent = a; if (countRetards) countRetards.textContent = r; }

        function updatePresenceCharts() { const f = getFilteredElevesPresence(); let p = 0, a = 0, r = 0;
        f.forEach(e => { const s = presenceStatus[e.id] || 'present'; if (s === 'present') p++;
            else if (s === 'absent') a++;
            else r++; }); const ctx1 = document.getElementById('presencePieChart'); if (ctx1) { if (chartInstances['pie']) chartInstances['pie'].destroy();
        chartInstances['pie'] = new Chart(ctx1, { type: 'doughnut', data: { labels: ['Présents', 'Absents', 'Retards'], datasets: [{ data: [p, a, r], backgroundColor: ['#10b981', '#D62828', '#f59e0b'], borderWidth: 0 }] }, options: { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true, padding: 16 } } } } }); } const ctx2 = document.getElementById('courseBarChart'); if (ctx2) { if (chartInstances['bar']) chartInstances['bar'].destroy(); const courseData = {};
        elevesPresence.forEach(e => { const c = e.filiere; if (!courseData[c]) courseData[c] = { total: 0, presents: 0 };
            courseData[c].total++; const s = presenceStatus[e.id] || 'present'; if (s === 'present') courseData[c].presents++; }); const labels = Object.keys(courseData); const data = labels.map(l => Math.round((courseData[l].presents / courseData[l].total) * 100));
        chartInstances['bar'] = new Chart(ctx2, { type: 'bar', data: { labels, datasets: [{ label: 'Taux présence %', data, backgroundColor: 'rgba(10,77,140,0.7)', borderRadius: 6, borderColor: 'rgba(10,77,140,1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, ticks: { callback: function(value) { return value + '%'; } } } }, indexAxis: 'y', plugins: { legend: { display: false } } } }); } }

        function applyFilter() { const today = document.getElementById('dateFilter')?.value; const cours = document.getElementById('courseFilter')?.value; if (today && historiquePresences[today] && historiquePresences[today][cours]) { const saved = historiquePresences[today][cours];
            getFilteredElevesPresence().forEach(e => { presenceStatus[e.id] = saved[e.id] !== undefined ? saved[e.id] : 'present'; }); } else { getFilteredElevesPresence().forEach(e => { presenceStatus[e.id] = 'present'; }); }
        renderAttendanceTable(); }

        function renderPresences() { const dateFilter = document.getElementById('dateFilter'); if (dateFilter) { if (!dateFilter.value) dateFilter.value = getTodayDate();
            dateFilter.max = getTodayDate(); }
            applyFilter();
            renderHistory();
            renderPresenceStats(); }

        function updatePageVisibility() { document.getElementById('page-personnel').classList.toggle('active', currentMainTab === 'personnel');
            document.getElementById('page-clients').classList.toggle('active', currentMainTab === 'clients');
            document.getElementById('page-presences').classList.toggle('active', currentMainTab === 'presences');
            document.getElementById('breadcrumbCurrent').textContent = currentMainTab === 'personnel' ? 'Gestion Professeurs' : currentMainTab === 'clients' ? 'Gestion Élèves' : 'Gestion des Présences';
            document.getElementById('headerTitle').textContent = currentMainTab === 'personnel' ? 'Gestion des Professeurs' : currentMainTab === 'clients' ? 'Gestion des Élèves' : 'Gestion des Présences';
            document.getElementById('headerSubtitle').innerHTML = currentMainTab === 'personnel' ? '<i class="fas fa-chalkboard-teacher"></i> Gérez vos professeurs et le personnel académique' : currentMainTab === 'clients' ? '<i class="fas fa-user-graduate"></i> Gérez vos élèves par filière et classe' : '<i class="fas fa-clock"></i> Suivez les présences quotidiennes des élèves par filière';
            document.getElementById('addBtnText').textContent = currentMainTab === 'presences' ? 'Ajouter' : currentMainTab === 'personnel' ? 'Ajouter Professeur' : 'Ajouter Élève'; const actionBtn = document.querySelector('.section-action-btn'); if (actionBtn) actionBtn.style.display = currentMainTab === 'presences' ? 'none' : 'flex'; }

        function switchMainTab(tab) { currentMainTab = tab;
            currentFilter = 'all';
            document.querySelectorAll('.tab-btn').forEach(b => { b.classList.toggle('active', b.dataset.tab === tab); }); if (tab === 'presences') renderPresences();
            renderAll(); }

        // ==================== EVENT LISTENERS ====================
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && document.getElementById('modalOverlay').classList.contains('open')) { closeModal(); } if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault();
                handleAddButton(); } if ((e.ctrlKey || e.metaKey) && e.key === 's' && currentMainTab === 'presences') { e.preventDefault();
                savePresences(); } if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault();
                exportCurrentView(); } if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); const targetId = currentMainTab === 'clients' ? 'searchInputClients' : 'searchInputPersonnel'; const input = document.getElementById(targetId); if (input) { input.focus();
                    input.select(); } } });
        document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });
        document.addEventListener('keydown', function(e) { if (e.target.id === 'newMatiereInput' && e.key === 'Enter') { e.preventDefault();
            addMatiereInModal(); } });

        // ==================== INITIALIZATION ====================
        async function initialize() {
            // 1. Load from localStorage immediately (instant render)
            if (!loadFromLocalStorage()) {
                console.log('Premier chargement - utilisation des données par défaut');
            }
            renderAll();
            switchMainTab('personnel');

            // 2. Refresh from Django API in background
            showToast('Synchronisation avec le serveur...', 'info');
            const apiOk = await fetchUsersFromApi();
            if (apiOk) {
                renderAll();
                showToast(`${personnel.length} professeurs · ${clients.length} élèves chargés du serveur`, 'success');
            } else {
                showToast('Mode hors-ligne — données locales utilisées', 'warning');
            }

            console.log('✅ CEJEC ERP initialisé avec succès');
            console.log(`📊 ${personnel.length} professeurs, ${clients.length} élèves chargés`);
            console.log(`📚 ${filieres.length} filières, ${classes.length} classes disponibles`);
            console.log('💾 Sauvegarde automatique activée (30s)');
        }
        initialize();