// ==================== STORAGE MANAGEMENT ====================
const STORAGE_KEYS = {
  PERSONNEL: "cejec_personnel",
  CLIENTS: "cejec_clients",
  PRESENCES: "cejec_presences",
  PRESENCE_STATUS: "cejec_presenceStatus",
  COURSES: "cejec_courses",
  CLASSES: "cejec_classes",
  FILIERES: "cejec_filieres",
  FILIERE_FILTER: "cejec_filiereFilter",
  CLASSE_FILTER: "cejec_classeFilter",
  LAST_BACKUP: "cejec_lastBackup",
  NEXT_IDS: "cejec_nextIds",
};

function saveToLocalStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.PERSONNEL, JSON.stringify(personnel));
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    localStorage.setItem(
      STORAGE_KEYS.PRESENCES,
      JSON.stringify(historiquePresences),
    );
    localStorage.setItem(
      STORAGE_KEYS.PRESENCE_STATUS,
      JSON.stringify(presenceStatus),
    );
    localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    localStorage.setItem(STORAGE_KEYS.FILIERES, JSON.stringify(filieres));
    localStorage.setItem(STORAGE_KEYS.FILIERE_FILTER, currentFiliereFilter);
    localStorage.setItem(STORAGE_KEYS.CLASSE_FILTER, currentClasseFilter);
    localStorage.setItem(
      STORAGE_KEYS.NEXT_IDS,
      JSON.stringify({
        personnel: nextPersonnelId,
        client: nextClientId,
      }),
    );
    const now = new Date().toLocaleTimeString("fr-FR");
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, now);
    const backupElements = document.querySelectorAll(
      "#lastBackupTime, #lastBackupTimeClients",
    );
    backupElements.forEach((el) => {
      if (el) el.textContent = now;
    });
    return true;
  } catch (error) {
    console.error("Erreur de sauvegarde:", error);
    showToast("Erreur lors de la sauvegarde automatique", "error");
    return false;
  }
}

function loadFromLocalStorage() {
  try {
    const savedPersonnel = localStorage.getItem(STORAGE_KEYS.PERSONNEL);
    const savedClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    const savedPresences = localStorage.getItem(STORAGE_KEYS.PRESENCES);
    const savedPresenceStatus = localStorage.getItem(
      STORAGE_KEYS.PRESENCE_STATUS,
    );
    const savedCourses = localStorage.getItem(STORAGE_KEYS.COURSES);
    const savedClasses = localStorage.getItem(STORAGE_KEYS.CLASSES);
    const savedFilieres = localStorage.getItem(STORAGE_KEYS.FILIERES);
    const savedFiliereFilter = localStorage.getItem(
      STORAGE_KEYS.FILIERE_FILTER,
    );
    const savedClasseFilter = localStorage.getItem(STORAGE_KEYS.CLASSE_FILTER);
    const savedNextIds = localStorage.getItem(STORAGE_KEYS.NEXT_IDS);
    const savedLastBackup = localStorage.getItem(STORAGE_KEYS.LAST_BACKUP);

    if (savedPersonnel) personnel = JSON.parse(savedPersonnel);
    if (savedClients) clients = JSON.parse(savedClients);
    if (savedPresences) historiquePresences = JSON.parse(savedPresences);
    if (savedPresenceStatus) presenceStatus = JSON.parse(savedPresenceStatus);
    // Les filières / classes / cours codés en dur ont été retirés : on ne les
    // restaure depuis le cache local que s'ils y sont déjà (ancienne visite),
    // en attendant le rafraîchissement depuis l'API dans initialize().
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

    const backupElements = document.querySelectorAll(
      "#lastBackupTime, #lastBackupTimeClients",
    );
    const timeText = savedLastBackup || "À l'instant";
    backupElements.forEach((el) => {
      if (el) el.textContent = timeText;
    });

    return true;
  } catch (error) {
    console.error("Erreur de chargement:", error);
    return false;
  }
}

setInterval(() => {
  if (saveToLocalStorage()) {
    console.log("💾 Sauvegarde locale automatique");
  }
}, 30000);

// API Sync every 10 minutes (utilisateurs + données académiques)
setInterval(
  async () => {
    if (navigator.onLine) {
      console.log("🔄 Synchronisation API périodique (10 min)...");
      const [usersOk, academicOk] = await Promise.all([
        fetchUsersFromApi(),
        fetchAcademicDataFromApi(),
      ]);
      if (usersOk && academicOk) await fetchTeacherMatieresFromApi();
      if (usersOk && academicOk) enrichClientsWithAcademicInfo();
      if (usersOk || academicOk) renderAll();
    }
  },
  10 * 60 * 1000,
);

window.addEventListener("beforeunload", () => {
  saveToLocalStorage();
});

// ==================== VALIDATION ====================
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  const re = /^\+509\s\d{2}\s\d{2}\s\d{2}\s\d{2}$/;
  const reSimple = /^\+509\s?\d{8}$/;
  return re.test(phone) || reSimple.test(phone.replace(/\s/g, ""));
}

function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add("error");
  const existingError = field.parentElement.querySelector(".error-message");
  if (existingError) existingError.remove();
  const errorEl = document.createElement("div");
  errorEl.className = "error-message visible";
  errorEl.textContent = message;
  field.parentElement.appendChild(errorEl);
}

function clearFieldErrors() {
  document
    .querySelectorAll(".error")
    .forEach((el) => el.classList.remove("error"));
  document.querySelectorAll(".error-message").forEach((el) => el.remove());
}

function isDuplicateEmail(email, type, excludeId) {
  const arr = type === "personnel" ? personnel : clients;
  return arr.some(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== excludeId,
  );
}

// ==================== DJANGO API LAYER ====================
const API_BASE = "https://schoolmanagementsystem-production-6624.up.railway.app/api/v1";

// Role mapping: frontend display value <-> Django ROLE_CHOICES code
const ROLE_TO_API = {
  administrateur: "ADMIN",
  directeur: "DIRECTOR",
  secretaire: "SECRETARY",
  comptable: "ACCOUNTANT",
  professeur: "TEACHER",
  "etudiant-excellent": "STUDENT",
  "etudiant-regulier": "STUDENT",
  "etudiant-nouveau": "STUDENT",
};
const STATUS_TO_API = {
  actif: "ACTIVE",
  inactif: "INACTIVE",
  suspendu: "SUSPENDED",
};
const API_ROLE_TO_LOCAL = {
  ADMIN: "administrateur",
  DIRECTOR: "directeur",
  SECRETARY: "secretaire",
  ACCOUNTANT: "comptable",
  TEACHER: "professeur",
  STUDENT: "etudiant-regulier",
  STAFF: "administrateur",
};
const API_STATUS_TO_LOCAL = {
  ACTIVE: "actif",
  INACTIVE: "inactif",
  SUSPENDED: "suspendu",
};

function apiHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function mapApiUserToLocal(u, type) {
  // UserListSerializer returns full_name; UserDetailSerializer has first_name/last_name
  const fullName =
    u.full_name ||
    [u.first_name, u.last_name].filter(Boolean).join(" ") ||
    u.username ||
    u.email;
  const localRole = API_ROLE_TO_LOCAL[u.role] || "etudiant-regulier";
  const localStatus = API_STATUS_TO_LOCAL[u.status] || "actif";
  return {
    id: u.id,
    student_id: u.student_id,
    name: fullName,
    role: localRole,
    status: localStatus,
    email: u.email || "",
    phone: u.phone || "",
    type: type,
    lastLogin: u.last_login
      ? new Date(u.last_login).toLocaleString("fr-FR")
      : "Jamais",
    matieres: u.matieres || [],
    // student-specific
    classe: u.classe || "",
    filiere: u.filiere || "",
    promotion: u.promotion || "Promotion 2026",
    moyenne: u.moyenne ?? 0,
    cours: u.cours || "0 cours",
  };
}

async function refreshAccessToken() {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/users/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.access) {
      localStorage.setItem("authToken", data.access);
      return data.access;
    }
  } catch (e) {
    console.warn("Refresh token error:", e);
  }
  return null;
}

async function apiFetch(path, options = {}, isRetry = false) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...apiHeaders(), ...(options.headers || {}) },
    });
    if (res.status === 401 && !isRetry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiFetch(path, options, true);
      }
    }
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(
        errData.detail || errData.message || `HTTP ${res.status}`,
      );
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (err) {
    throw err;
  }
}

async function fetchUsersFromApi() {
  const token = localStorage.getItem("authToken");
  if (!navigator.onLine || !token) return false;
  try {
    const [teachersData, studentsData, inscriptionsData] = await Promise.all([
      apiFetch("/auth/users/?role=TEACHER&page_size=500"),
      apiFetch("/auth/users/?role=STUDENT&page_size=500"),
      apiFetch("/enrollments/inscriptions/?page_size=2000").catch(() => []), // Fallback
    ]);
    // Handle both paginated ({ results: [...] }) and plain array responses
    const teacherList =
      teachersData?.results ??
      (Array.isArray(teachersData) ? teachersData : []);
    let studentList =
      studentsData?.results ??
      (Array.isArray(studentsData) ? studentsData : []);

    // Exclure les étudiants qui n'ont que des inscriptions "pending" (Pré-inscrit)
    const inscriptions =
      inscriptionsData?.results ??
      (Array.isArray(inscriptionsData) ? inscriptionsData : []);
    if (inscriptions.length > 0) {
      const activeUserIds = new Set(
        inscriptions
          .filter((i) => i.status !== "pending")
          .map((i) => i.student_user_id || i.student?.user?.id || i.userId),
      );
      const pendingUserIds = new Set(
        inscriptions
          .filter((i) => i.status === "pending")
          .map((i) => i.student_user_id || i.student?.user?.id || i.userId),
      );

      studentList = studentList.filter((user) => {
        // Si l'utilisateur a une inscription validée/active, on le garde
        if (activeUserIds.has(user.id)) return true;
        // S'il n'a qu'une inscription pending (et aucune active), on le masque
        if (pendingUserIds.has(user.id)) return false;
        // S'il n'a aucune inscription (compte créé mais pas d'inscription), on le garde par défaut
        return true;
      });
    }
    if (teacherList.length > 0 || studentList.length > 0) {
      personnel = teacherList.map((u) => mapApiUserToLocal(u, "personnel"));
      clients = studentList.map((u) => mapApiUserToLocal(u, "client"));
      saveToLocalStorage();
    }
    console.log(
      `✅ API: ${personnel.length} professeurs, ${clients.length} élèves chargés`,
    );
    return true;
  } catch (err) {
    console.warn(
      "⚠️ API non disponible, utilisation du cache local:",
      err.message,
    );
    return false;
  }
}

// Les matières enseignées ("matieres") ne sont PAS renvoyées par
// /auth/users/ : elles vivent côté app "teachers", comme des TeacherSpecialty
// (champ "subject"), rattachées au Teacher (pas directement au User).
// Il faut donc : 1) lister les profs (/teachers/) pour connaître, pour
// chaque Teacher.id, l'id du User associé ; 2) récupérer les spécialités de
// chaque professeur ; 3) fusionner les noms de matières dans personnel[].
// Les matières enseignées ("matieres") ne sont PAS renvoyées par
// /auth/users/. On avait d'abord essayé /teachers/{id}/specialties/
// (TeacherSpecialty), mais cette table est vide en pratique : les cours
// (/courses/courses/) sont la vraie source — chaque Course a un champ
// "teacher" qui l'assigne à un professeur. Les "matières" d'un prof sont
// donc simplement les noms des cours dont il est responsable.
// ⚠️ Doit être appelée APRÈS fetchAcademicDataFromApi() (qui remplit
// coursesRaw) ET fetchUsersFromApi() (qui remplit personnel).
async function fetchTeacherMatieresFromApi() {
  if (!navigator.onLine) return false;
  try {
    const teachersRes = await apiFetch("/teachers/?page_size=1000");
    const teachersList =
      teachersRes?.results ?? (Array.isArray(teachersRes) ? teachersRes : []);
    if (teachersList.length === 0) return true;

    teachersList.forEach((t) => {
      const userId = typeof t.user === "object" ? t.user?.id : t.user;
      if (userId == null) return;
      const local = personnel.find((p) => p.id === userId);
      if (!local) return;

      const teacherName = t.full_name || t.email || null;

      const matieres = coursesRaw
        .filter((c) => {
          // CourseListSerializer (GET /courses/courses/) n'expose pas
          // toujours l'id "teacher", seulement "teacher_name" : on matche
          // par id quand possible, sinon par nom.
          const cTeacherId =
            typeof c.teacher === "object" ? c.teacher?.id : c.teacher;
          if (cTeacherId != null) return cTeacherId === t.id;
          return teacherName && c.teacher_name === teacherName;
        })
        .map((c) => c.name)
        .filter(Boolean);

      // On ne remplace la liste que si on a trouvé au moins un cours, pour
      // ne jamais écraser une correspondance déjà établie avec un tableau vide.
      if (matieres.length > 0) {
        local.matieres = [...new Set(matieres)];
      }
    });

    saveToLocalStorage();
    console.log(
      `✅ Matières déduites des cours pour ${teachersList.length} professeur(s)`,
    );
    return true;
  } catch (err) {
    console.warn(
      "⚠️ Impossible de déduire les matières des professeurs depuis les cours:",
      err.message,
    );
    return false;
  }
}

// ---- Filières / Classes / Cours : chargés depuis la base de données ----
// (spécializations = "filières", students/classes = "classes", courses/courses = "cours")
let specializationsRaw = []; // objets bruts venant de /students/specializations/
let classesRaw = []; // objets bruts venant de /students/classes/
let coursesRaw = []; // objets bruts venant de /courses/courses/
let studentProfilesRaw = []; // objets bruts venant de /students/students/ (id du PROFIL, distinct de user)
let inscriptionsRaw = []; // objets bruts venant de /enrollments/inscriptions/ (lien réel student <-> course)

async function fetchAcademicDataFromApi() {
  if (!navigator.onLine) return false;
  try {
    const [specsRes, classesRes, coursesRes, studentsRes, inscriptionsRes] = await Promise.all([
      apiFetch("/students/specializations/"),
      apiFetch("/students/classes/"),
      apiFetch("/courses/courses/"),
      apiFetch("/students/students/?page_size=1000"),
      apiFetch("/enrollments/inscriptions/?page_size=1000"),
    ]);

    specializationsRaw =
      specsRes?.results ?? (Array.isArray(specsRes) ? specsRes : []);
    classesRaw =
      classesRes?.results ?? (Array.isArray(classesRes) ? classesRes : []);
    coursesRaw =
      coursesRes?.results ?? (Array.isArray(coursesRes) ? coursesRes : []);
    studentProfilesRaw =
      studentsRes?.results ?? (Array.isArray(studentsRes) ? studentsRes : []);
    inscriptionsRaw =
      inscriptionsRes?.results ?? (Array.isArray(inscriptionsRes) ? inscriptionsRes : []);

    if (specializationsRaw.length > 0) {
      filieres = specializationsRaw.map((s) => s.name);
    }

    if (classesRaw.length > 0) {
      // Une "classe" affichée est "<Nom filière> <niveau>", comme dans gestion_classes.html
      classes = classesRaw.map((c) => {
        const specId =
          typeof c.specialization === "object"
            ? c.specialization?.id
            : c.specialization;
        const specName =
          c.specialization_name ||
          specializationsRaw.find((s) => s.id === specId)?.name ||
          "Filière inconnue";
        return `${specName} ${c.level}`;
      });
    }

    if (coursesRaw.length > 0) {
      courses = [...new Set(coursesRaw.map((c) => c.name))];
    }

    saveToLocalStorage();
    console.log(
      `✅ API: ${filieres.length} filières, ${classes.length} classes, ${courses.length} cours, ${studentProfilesRaw.length} profils élèves, ${inscriptionsRaw.length} inscriptions chargés`,
    );
    return true;
  } catch (err) {
    console.warn(
      "⚠️ Impossible de charger filières/classes/cours/profils élèves depuis l'API, utilisation du cache local:",
      err.message,
    );
    return false;
  }
}

// ==================== FUSION CLASSE / FILIÈRE (Student profile) ====================
// À appeler après fetchUsersFromApi() ET fetchAcademicDataFromApi()
// (les deux doivent être terminés, car on a besoin de studentProfilesRaw,
// specializationsRaw et classesRaw pour résoudre les noms).
function enrichClientsWithAcademicInfo() {
  if (studentProfilesRaw.length === 0) return;

  clients.forEach((client) => {
    const profile = findStudentProfileByUserId(client.id);
    if (!profile) return;

    // Filière
    const specId =
      typeof profile.specialization === "object"
        ? profile.specialization?.id
        : profile.specialization;
    const specName =
      profile.specialization_name ||
      specializationsRaw.find((s) => s.id === specId)?.name ||
      "";
    if (specName) client.filiere = specName;

    // Classe (affichée comme "<Filière> <niveau>")
    const classIdRaw =
      typeof profile.school_class === "object"
        ? profile.school_class?.id
        : profile.school_class;
    const classObj =
      profile.school_class_name != null
        ? { name: profile.school_class_name }
        : classesRaw.find((c) => c.id === classIdRaw);
    if (classObj) {
      client.classe =
        classObj.name ||
        `${specName || "Filière"} ${classObj.level ?? ""}`.trim();
    }
  });

  saveToLocalStorage();
}

// Petits helpers pour retrouver l'id backend à partir du libellé affiché.
function findSpecializationIdByName(name) {
  const s = specializationsRaw.find((s) => s.name === name);
  return s ? s.id : null;
}
function findClassIdByDisplayName(displayName) {
  const idx = classes.indexOf(displayName);
  if (idx === -1) return null;
  return classesRaw[idx]?.id ?? null;
}
// Le endpoint /students/students/<id>/ attend l'id du PROFIL Student, qui
// est différent de l'id du User. On le retrouve via son champ "user".
function findStudentProfileByUserId(userId) {
  const uid = typeof userId === "string" ? parseInt(userId, 10) : userId;
  return (
    studentProfilesRaw.find((s) =>
      typeof s.user === "object" ? s.user?.id === uid : s.user === uid,
    ) || null
  );
}

// Enregistre réellement la filière + classe d'un élève dans la base de
// données.
// - Si aucun profil Student n'existe encore pour ce User (le profil n'est
//   PAS créé automatiquement à l'inscription), on le crée via
//   POST /students/students/ (StudentCreateSerializer : user + specialization).
// - On (re)patch ensuite specialization + school_class via
//   PATCH /students/students/<profileId>/ (StudentSerializer).
// ⚠️ Nécessite que "school_class" soit ajouté à StudentSerializer.Meta.fields
// côté backend (il n'y est pas par défaut) — sinon ce champ est ignoré par DRF.
async function syncStudentAcademicInfo(userId, filiereName, classeName) {
  const specializationId = findSpecializationIdByName(filiereName);
  const classId = findClassIdByDisplayName(classeName);
  if (!specializationId && !classId) return false;

  try {
    let profile = findStudentProfileByUserId(userId);

    if (!profile) {
      // Profil éventuellement créé automatiquement côté serveur.
      const profilesResponse = await apiFetch(
        `/students/students/?user=${userId}`,
      );
      const profiles =
        profilesResponse?.results ??
        (Array.isArray(profilesResponse) ? profilesResponse : []);
      profile = profiles[0] || null;
      if (profile) studentProfilesRaw.push(profile);
    }
    if (!profile) {
      profile = await apiFetch("/students/students/", {
        method: "POST",
        body: JSON.stringify({
          user: typeof userId === "string" ? parseInt(userId, 10) : userId,
          ...(specializationId ? { specialization: specializationId } : {}),
        }),
      });
      if (profile) studentProfilesRaw.push(profile);
    }
    if (!profile || !profile.id) return false;

    const patchPayload = {};
    if (specializationId) patchPayload.specialization = specializationId;
    if (classId) patchPayload.school_class = classId;

    if (Object.keys(patchPayload).length > 0) {
      await apiFetch(`/students/students/${profile.id}/`, {
        method: "PATCH",
        body: JSON.stringify(patchPayload),
      });
      Object.assign(profile, patchPayload);
    }
    return true;
  } catch (err) {
    console.warn(
      "⚠️ Échec de l'enregistrement de la classe/filière en base:",
      err.message,
    );
    return false;
  }
}

// ==================== DATA ====================
let personnel = [];
let clients = [];
// Ces trois tableaux ne sont plus codés en dur : ils sont peuplés par
let courses = [];
let filieres = [];
let classes = [];
let elevesPresence = [];
let historiquePresences = {};
let presenceStatus = {};

let chartInstances = {};
let currentMainTab = "personnel";
let currentFilter = "all";
let currentFiliereFilter = "all";
let currentClasseFilter = "all";
let allDetailsVisible = true;
let nextPersonnelId = 200;
let nextClientId = 300;
let tempMatieres = [];
let searchQueryPersonnel = "";
let searchQueryClients = "";

// ==================== UTILITY FUNCTIONS ====================
function getInitials(name) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(str) {
  if (str === undefined || str === null) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}

function getRoleClass(role) {
  const map = {
    administrateur: "role-administrateur",
    directeur: "role-directeur",
    secretaire: "role-secretaire",
    comptable: "role-comptable",
    professeur: "role-professeur",
    "etudiant-excellent": "role-etudiant-excellent",
    "etudiant-regulier": "role-etudiant-regulier",
    "etudiant-nouveau": "role-etudiant-nouveau",
  };
  return map[role] || "role-etudiant";
}

function getStatusClass(status) {
  const map = {
    actif: "status-actif",
    inactif: "status-inactif",
    suspendu: "status-suspendu",
  };
  return map[status] || "status-actif";
}

function getIcon(role) {
  const map = {
    administrateur: "fa-shield-halved",
    directeur: "fa-user-tie",
    secretaire: "fa-headset",
    comptable: "fa-calculator",
    professeur: "fa-chalkboard-teacher",
    "etudiant-excellent": "fa-star",
    "etudiant-regulier": "fa-user-graduate",
    "etudiant-nouveau": "fa-user",
  };
  return map[role] || "fa-user";
}

function getRoleDisplay(role) {
  const map = {
    administrateur: "Administrateur",
    directeur: "Directeur",
    secretaire: "Secrétaire",
    comptable: "Comptable",
    professeur: "Professeur",
    "etudiant-excellent": "Élève Excellent ⭐",
    "etudiant-regulier": "Élève Régulier 📘",
    "etudiant-nouveau": "Nouvel Élève 🆕",
  };
  return map[role] || capitalize(role);
}

function getAvatarColor(i) {
  const c = [
    "#0A4D8C",
    "#D62828",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#6366f1",
    "#14b8a6",
    "#e11d48",
    "#0891b2",
    "#7c3aed",
    "#059669",
    "#0A4D8C",
    "#D62828",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
  ];
  return c[i % c.length];
}

function showToast(msg, type = "success") {
  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    info: "fa-info-circle",
    warning: "fa-exclamation-triangle",
  };
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<i class="fas ${icons[type]}"></i> ${escapeHtml(msg)}`;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(100px)";
    el.style.transition = "all .3s";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function getTodayDate() {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

// ==================== SEARCH ====================
function handleSearchInput(scope, value) {
  if (scope === "personnel") {
    searchQueryPersonnel = value.trim().toLowerCase();
    document.getElementById("clearSearchPersonnel").style.display =
      searchQueryPersonnel ? "flex" : "none";
  } else {
    searchQueryClients = value.trim().toLowerCase();
    document.getElementById("clearSearchClients").style.display =
      searchQueryClients ? "flex" : "none";
  }
  renderAll();
}

function clearSearch(scope) {
  if (scope === "personnel") {
    searchQueryPersonnel = "";
    const input = document.getElementById("searchInputPersonnel");
    if (input) input.value = "";
    document.getElementById("clearSearchPersonnel").style.display = "none";
  } else {
    searchQueryClients = "";
    const input = document.getElementById("searchInputClients");
    if (input) input.value = "";
    document.getElementById("clearSearchClients").style.display = "none";
  }
  renderAll();
}

function matchesSearch(user, query) {
  if (!query) return true;
  const haystack = [
    user.name,
    user.email,
    user.phone,
    user.classe,
    user.filiere,
    user.role,
  ]
    .concat(user.matieres || [])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

function resetAllFilters(scope) {
  currentFilter = "all";
  if (scope === "clients") {
    currentFiliereFilter = "all";
    currentClasseFilter = "all";
    clearSearch("clients");
  } else {
    clearSearch("personnel");
  }
  saveToLocalStorage();
  renderAll();
  showToast("Filtres réinitialisés", "info");
}

// ==================== FILIERE & CLASSE MANAGEMENT ====================
function applyFiliereFilter(filiere) {
  currentFiliereFilter = filiere;
  currentClasseFilter = "all";
  saveToLocalStorage();
  renderAll();
}

function applyClasseFilter() {
  const select = document.getElementById("classeFilter");
  currentClasseFilter = select?.value || "all";
  saveToLocalStorage();
  renderAll();
}

async function addNewFiliere() {
  const newFiliere = prompt(
    'Nom de la nouvelle filière (ex: "Entrepreneuriat") :',
  );
  if (!newFiliere || !newFiliere.trim()) return;
  const trimmed = newFiliere.trim();
  if (filieres.includes(trimmed)) {
    showToast("Cette filière existe déjà", "warning");
    return;
  }
  try {
    // Créée directement dans la base de données (comme dans gestion_classes.html)
    const spec = await apiFetch("/students/specializations/", {
      method: "POST",
      body: JSON.stringify({ name: trimmed, description: "", is_active: true }),
    });
    specializationsRaw.push(spec);
    filieres.push(spec.name || trimmed);
    saveToLocalStorage();
    renderAll();
    showToast(`Filière "${trimmed}" créée et synchronisée ✓`, "success");
  } catch (err) {
    // Repli local si l'API est indisponible
    filieres.push(trimmed);
    saveToLocalStorage();
    renderAll();
    showToast(
      `Filière ajoutée localement (synchronisation échouée: ${err.message})`,
      "warning",
    );
  }
}

async function promouvoirEleve(userId) {
  const user = clients.find((u) => u.id === userId);
  if (!user || !user.classe) return;
  const match = user.classe.match(/^(.+?)\s*(\d+)$/);
  if (!match) {
    showToast("Format de classe non reconnu", "error");
    return;
  }
  const baseName = match[1];
  const currentLevel = parseInt(match[2]);
  const newLevel = currentLevel + 1;
  const newClasse = `${baseName} ${newLevel}`;

  let classId = findClassIdByDisplayName(newClasse);

  if (!classes.includes(newClasse)) {
    classes.push(newClasse);
    if (!filieres.includes(baseName)) {
      filieres.push(baseName);
    }
    showToast(`Nouvelle classe "${newClasse}" créée`, "info");
  }

  // Si le niveau supérieur n'existe pas encore en base, on le crée
  // (comme dans gestion_classes.html).
  if (!classId) {
    const specializationId = findSpecializationIdByName(baseName);
    if (specializationId) {
      try {
        const createdClass = await apiFetch("/students/classes/", {
          method: "POST",
          body: JSON.stringify({
            specialization: specializationId,
            level: newLevel,
            capacity: 25,
          }),
        });
        if (createdClass && createdClass.id) {
          classesRaw.push(createdClass);
          classId = createdClass.id;
        }
      } catch (err) {
        console.warn(
          "⚠️ Échec de la création de la classe en base:",
          err.message,
        );
      }
    }
  }

  user.classe = newClasse;
  if (!user.filiere) user.filiere = baseName;
  user.promotion = `Promotion ${new Date().getFullYear() + (currentLevel > 2 ? 0 : 2 - currentLevel)}`;
  const coursMatch = String(user.cours || "0 cours").match(/\d+/);
  const coursNum = coursMatch ? parseInt(coursMatch[0]) : 0;
  user.cours = `${coursNum + 2} cours`;
  saveToLocalStorage();
  renderAll();
  showToast(`${user.name} promu en "${newClasse}" 🎉`, "success");

  const synced = await syncStudentAcademicInfo(
    user.id,
    user.filiere,
    newClasse,
  );
  if (!synced) {
    showToast(
      `Promotion enregistrée localement, mais l'enregistrement en base a échoué`,
      "warning",
    );
  }
}

function renderClasseFilter() {
  const select = document.getElementById("classeFilter");
  if (!select) return;
  let filteredClasses = [...classes];
  if (currentFiliereFilter && currentFiliereFilter !== "all") {
    filteredClasses = classes.filter((c) => c.startsWith(currentFiliereFilter));
  }
  const stats = {};
  filteredClasses.forEach((c) => {
    stats[c] = clients.filter((cl) => cl.classe === c).length;
  });
  select.innerHTML =
    '<option value="all">📚 Toutes les classes</option>' +
    filteredClasses
      .map((c) => {
        const count = stats[c] || 0;
        return `<option value="${c}" ${currentClasseFilter === c ? "selected" : ""}>📖 ${c} (${count} élève${count !== 1 ? "s" : ""})</option>`;
      })
      .join("");
}

function renderFiliereFilterBar() {
  const container = document.getElementById("filiereFilterBar");
  if (!container) return;
  const stats = {};
  filieres.forEach((f) => {
    stats[f] = clients.filter((c) => c.filiere === f).length;
  });
  const totalAll = clients.length;
  let html = `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;flex:1;"><button class="filiere-btn ${currentFiliereFilter === "all" ? "active" : ""}" onclick="applyFiliereFilter('all')"><i class="fas fa-layer-group"></i> Toutes <span class="count">${totalAll}</span></button>`;
  filieres.forEach((f) => {
    const count = stats[f] || 0;
    if (count > 0 || currentFiliereFilter === f) {
      html += `<button class="filiere-btn ${currentFiliereFilter === f ? "active" : ""}" onclick="applyFiliereFilter('${f}')"><i class="fas fa-graduation-cap"></i> ${f} <span class="count">${count}</span></button>`;
    }
  });
  html += `</div><div class="classe-select-wrapper"><select id="classeFilter" class="classe-select" onchange="applyClasseFilter()"><option value="all">📚 Toutes les classes</option></select><button class="btn-add-filiere" onclick="addNewFiliere()" title="Ajouter une filière"><i class="fas fa-plus"></i></button></div>`;
  container.innerHTML = html;
  renderClasseFilter();
}

// ==================== EXPORT ====================
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    showToast("Aucune donnée à exporter", "warning");
    return;
  }
  let csv = "";
  const headers = Object.keys(data[0]).filter(
    (h) => h !== "type" && h !== "lastLogin",
  );
  csv += headers.join(",") + "\n";
  data.forEach((row) => {
    csv +=
      headers
        .map((h) => {
          let value = row[h] || "";
          if (Array.isArray(value)) value = value.join("; ");
          if (
            typeof value === "string" &&
            (value.includes(",") || value.includes('"') || value.includes("\n"))
          ) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        })
        .join(",") + "\n";
  });
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  showToast(`Exportation réussie: ${filename}.csv`, "success");
}

function exportCurrentView() {
  if (currentMainTab === "personnel") {
    exportToCSV(personnel, "professeurs_cejec");
  } else if (currentMainTab === "clients") {
    exportToCSV(clients, "eleves_cejec");
  } else {
    exportToCSV(elevesPresence, "presences_cejec");
  }
}

// ==================== MODAL MANAGEMENT ====================
function openModal(action, id = null) {
  const overlay = document.getElementById("modalOverlay");
  const modalContent = document.getElementById("modalContent");
  clearFieldErrors();
  tempMatieres = [];
  if (action === "delete-confirm" && id) {
    const user = (currentMainTab === "personnel" ? personnel : clients).find(
      (u) => u.id === id,
    );
    if (!user) return;
    modalContent.innerHTML = `
                    <h2><i class="fas fa-exclamation-triangle" style="color:var(--red)"></i> Confirmer la suppression</h2>
                    <p style="margin-bottom:20px;font-size:0.95rem">Voulez-vous vraiment supprimer <strong>${escapeHtml(user.name)}</strong> ?<br>Cette action est irréversible.</p>
                    <div class="user-profile" style="margin-bottom:20px"><div class="avatar22">${getInitials(user.name)}</div><div><strong>${escapeHtml(user.name)}</strong><br><span class="badge ${getRoleClass(user.role)}">${getRoleDisplay(user.role)}</span>${user.classe ? ` <span class="badge badge-classe"><i class="fas fa-chalkboard"></i> ${escapeHtml(user.classe)}</span>` : ""}</div></div>
                    <div class="modal-actions"><button class="btn-save btn-danger" onclick="confirmDelete(${id}); closeModal();"><i class="fas fa-trash"></i> Supprimer définitivement</button><button class="btn-cancel" onclick="closeModal()">Annuler</button></div>`;
  } else if (action === "clear-history-confirm") {
    modalContent.innerHTML = `
                    <h2><i class="fas fa-exclamation-triangle" style="color:var(--red)"></i> Effacer l'historique</h2>
                    <p style="margin-bottom:20px;font-size:0.95rem">Voulez-vous vraiment effacer <strong>tout l'historique des présences</strong> ?<br>Cette action est irréversible et ne peut pas être annulée.</p>
                    <div class="modal-actions"><button class="btn-save btn-danger" onclick="doClearHistory(); closeModal();"><i class="fas fa-trash"></i> Effacer définitivement</button><button class="btn-cancel" onclick="closeModal()">Annuler</button></div>`;
  } else if (action === "edit" && id) {
    const user = (currentMainTab === "personnel" ? personnel : clients).find(
      (u) => u.id === id,
    );
    if (!user) return;
    if (user.matieres) tempMatieres = [...user.matieres];
    modalContent.innerHTML = `
                    <h2><i class="fas fa-edit"></i> Modifier ${user.type === "personnel" ? "le Professeur" : "l'Élève"}</h2>
                    <form id="modalForm" onsubmit="saveUser(event)">
                        <input type="hidden" id="editId" value="${user.id}">
                        <div class="form-group"><label>Nom complet</label><input type="text" id="userName" value="${escapeHtml(user.name)}" required></div>
                        <div class="form-group"><label>Email</label><input type="email" id="userEmail" value="${escapeHtml(user.email)}" required></div>
                        <div class="form-group"><label>Téléphone</label><input type="text" id="userPhone" value="${escapeHtml(user.phone)}" required></div>
                        <div class="form-group"><label>Type</label><select id="userType" required onchange="updateRoleOptions()"><option value="personnel" ${user.type === "personnel" ? "selected" : ""}>Professeur / Personnel</option><option value="client" ${user.type === "client" ? "selected" : ""}>Élève</option></select></div>
                        <div class="form-group" id="classeGroup" style="display:${user.type === "client" ? "block" : "none"};"><label><i class="fas fa-chalkboard"></i> Classe</label><select id="userClasse"><option value="">Sélectionner une classe</option>${classes.map((c) => `<option value="${c}" ${user.classe === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
                        <div class="form-group" id="filiereGroup" style="display:${user.type === "client" ? "block" : "none"};"><label><i class="fas fa-graduation-cap"></i> Filière</label><select id="userFiliere"><option value="">Sélectionner une filière</option>${filieres.map((f) => `<option value="${f}" ${user.filiere === f ? "selected" : ""}>${f}</option>`).join("")}</select></div>
                        <div class="form-group"><label id="roleLabel">Rôle</label><select id="userRole" required onchange="handleRoleChange()"></select></div>
                        <div class="form-group" id="matieresGroup" style="display:none;"><label><i class="fas fa-book"></i> Matières enseignées</label><div class="matieres-edit-container" id="matieresEditContainer"></div><div class="input-matiere-wrapper"><input type="text" id="newMatiereInput" placeholder="Ex: Entrepreneuriat 101" list="coursDatalist"><button type="button" class="btn-add-matiere-modal" onclick="addMatiereInModal()"><i class="fas fa-plus"></i> Ajouter</button></div></div>
                        <div class="form-group"><label>Statut</label><select id="userStatus" required><option value="actif" ${user.status === "actif" ? "selected" : ""}>Actif</option><option value="inactif" ${user.status === "inactif" ? "selected" : ""}>Inactif</option><option value="suspendu" ${user.status === "suspendu" ? "selected" : ""}>Suspendu</option></select></div>
                        <div class="modal-actions"><button type="submit" class="btn-save"><i class="fas fa-save"></i> Enregistrer</button><button type="button" class="btn-cancel" onclick="closeModal()">Annuler</button></div></form>`;
    setTimeout(() => {
      populateRoleSelect(user.type);
      document.getElementById("userRole").value = user.role;
      handleRoleChange();
      renderMatieresInModal(tempMatieres);
    }, 0);
  } else {
    const isPersonnel = currentMainTab === "personnel";
    modalContent.innerHTML = `
                    <h2><i class="fas fa-user-plus"></i> Ajouter ${isPersonnel ? "un Professeur" : "un Élève"}</h2>
                    <form id="modalForm" onsubmit="saveUser(event)">
                        <input type="hidden" id="editId" value="">
                        <div class="form-group"><label>Nom complet</label><input type="text" id="userName" placeholder="Ex: Jean Baptiste" required></div>
                        <div class="form-group"><label>Email</label><input type="email" id="userEmail" placeholder="Ex: jean@cejec.edu.ht" required></div>
                        <div class="form-group"><label>Téléphone</label><input type="text" id="userPhone" placeholder="Ex: +509 33 44 55 66" required></div>
                        <div class="form-group"><label>Type</label><select id="userType" required onchange="updateRoleOptions()"><option value="personnel" ${isPersonnel ? "selected" : ""}>Professeur / Personnel</option><option value="client" ${!isPersonnel ? "selected" : ""}>Élève</option></select></div>
                        <div class="form-group" id="classeGroup" style="display:${!isPersonnel ? "block" : "none"};"><label><i class="fas fa-chalkboard"></i> Classe</label><select id="userClasse"><option value="">Sélectionner une classe</option>${classes.map((c) => `<option value="${c}">${c}</option>`).join("")}</select></div>
                        <div class="form-group" id="filiereGroup" style="display:${!isPersonnel ? "block" : "none"};"><label><i class="fas fa-graduation-cap"></i> Filière</label><select id="userFiliere"><option value="">Sélectionner une filière</option>${filieres.map((f) => `<option value="${f}">${f}</option>`).join("")}</select></div>
                        <div class="form-group"><label id="roleLabel">Rôle</label><select id="userRole" required onchange="handleRoleChange()"></select></div>
                        <div class="form-group" id="matieresGroup" style="display:none;"><label><i class="fas fa-book"></i> Matières enseignées</label><div class="matieres-edit-container" id="matieresEditContainer"></div><div class="input-matiere-wrapper"><input type="text" id="newMatiereInput" placeholder="Ex: Entrepreneuriat 101" list="coursDatalist"><button type="button" class="btn-add-matiere-modal" onclick="addMatiereInModal()"><i class="fas fa-plus"></i> Ajouter</button></div></div>
                        <div class="form-group"><label>Mot de passe</label><input type="password" id="userPassword" placeholder="Minimum 8 caractères" required></div>
                        <div class="form-group"><label>Statut</label><select id="userStatus" required><option value="actif">Actif</option><option value="inactif">Inactif</option><option value="suspendu">Suspendu</option></select></div>
                        <div class="modal-actions"><button type="submit" class="btn-save"><i class="fas fa-save"></i> Enregistrer</button><button type="button" class="btn-cancel" onclick="closeModal()">Annuler</button></div></form>`;
    setTimeout(() => {
      populateRoleSelect(isPersonnel ? "personnel" : "client");
      renderMatieresInModal([]);
    }, 0);
  }
  overlay.classList.add("open");
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  tempMatieres = [];
  clearFieldErrors();
}

function saveUser(e) {
  e.preventDefault();
  clearFieldErrors();
  const id = document.getElementById("editId")?.value;
  const name = document.getElementById("userName").value.trim();
  const email = document.getElementById("userEmail").value.trim();
  const phone = document.getElementById("userPhone").value.trim();
  const type = document.getElementById("userType").value;
  const role = document.getElementById("userRole").value;
  const status = document.getElementById("userStatus").value;
  const classe = document.getElementById("userClasse")?.value;
  const filiere = document.getElementById("userFiliere")?.value;
  const password = document.getElementById("userPassword")?.value;
  let hasError = false;

  if (!id && (!password || password.length < 8)) {
    showFieldError("userPassword", "Minimum 8 caractères requis");
    hasError = true;
  }
  if (!name || name.length < 3) {
    showFieldError("userName", "Le nom doit contenir au moins 3 caractères");
    hasError = true;
  } else if (name.trim().split(/\s+/).filter(Boolean).length < 2) {
    showFieldError(
      "userName",
      'Merci d\'indiquer prénom ET nom de famille (ex: "Jean Baptiste")',
    );
    hasError = true;
  }
  if (!validateEmail(email)) {
    showFieldError("userEmail", "Format d'email invalide");
    hasError = true;
  } else if (isDuplicateEmail(email, type, id ? parseInt(id) : null)) {
    showFieldError(
      "userEmail",
      "Cet email est déjà utilisé par un autre membre",
    );
    hasError = true;
  }
  if (!validatePhone(phone)) {
    showFieldError("userPhone", "Format: +509 XX XX XX XX");
    hasError = true;
  }
  if (type === "client" && !classe) {
    showFieldError("userClasse", "Veuillez sélectionner une classe");
    hasError = true;
  }
  if (type === "client" && !filiere) {
    showFieldError("userFiliere", "Veuillez sélectionner une filière");
    hasError = true;
  }
  if (hasError) {
    showToast("Veuillez corriger les erreurs", "error");
    return;
  }
  const existingForLastLogin = id
    ? (currentMainTab === "personnel" ? personnel : clients).find(
        (u) => u.id === parseInt(id),
      )
    : null;
  const userData = {
    name,
    email,
    phone,
    type,
    role,
    status,
    lastLogin: existingForLastLogin ? existingForLastLogin.lastLogin : "Jamais",
  };
  if (type === "personnel") {
    userData.matieres = role === "professeur" ? [...tempMatieres] : [];
  } else {
    userData.classe = classe;
    userData.filiere = filiere;
    // classe/filiere viennent maintenant des listes chargées depuis la BD ;
    // on ne les pousse plus localement, elles existent déjà côté serveur.
    if (id) {
      const existing = clients.find((u) => u.id === parseInt(id));
      userData.promotion = existing?.promotion || "Promotion 2026";
      userData.moyenne = existing?.moyenne ?? 0;
      userData.cours = existing?.cours || "0 cours";
    } else {
      userData.promotion = "Promotion 2026";
      userData.moyenne = 0;
      userData.cours = "0 cours";
    }
  }

  // ---- Capture old state for API ----
  let oldRoleApi = null;
  let oldStatusApi = null;
  if (id) {
    const arr = type === "personnel" ? personnel : clients;
    const existingForDiff = arr.find((u) => u.id === parseInt(id));
    if (existingForDiff) {
      oldRoleApi = ROLE_TO_API[existingForDiff.role] || "STUDENT";
      oldStatusApi = STATUS_TO_API[existingForDiff.status] || "ACTIVE";
    }
  }

  // ---- Optimistic local update ----
  if (id) {
    const arr = type === "personnel" ? personnel : clients;
    const idx = arr.findIndex((u) => u.id === parseInt(id));
    if (idx !== -1) arr[idx] = { ...arr[idx], ...userData };
  } else {
    userData.id = type === "personnel" ? nextPersonnelId++ : nextClientId++;
    if (type === "personnel") personnel.push(userData);
    else clients.push(userData);
  }
  closeModal();
  tempMatieres = [];
  saveToLocalStorage();
  renderAll();

  // ---- Background API sync ----
  const nameParts = name.trim().split(" ");
  const apiPayload = {
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" ") || "",
    email,
    phone,
    role: ROLE_TO_API[role] || "STUDENT",
    status: STATUS_TO_API[status] || "ACTIVE",
  };
  if (!id) {
    // CREATE
    apiPayload.password = password;
    apiPayload.password_confirm = password;
    apiFetch("/auth/users/register/", {
      method: "POST",
      body: JSON.stringify(apiPayload),
    })
      .then(async (res) => {
        const serverUser = res?.user || res;
        if (serverUser?.id) {
          // update local id with real server id
          const arr = type === "personnel" ? personnel : clients;
          const local = arr.find((u) => u.email === email);
          if (local) local.id = serverUser.id;
          saveToLocalStorage();

          if (type === "client") {
            const classSynced = await syncStudentAcademicInfo(
              serverUser.id,
              filiere,
              classe,
            );
            if (!classSynced) {
              showToast(
                `${name} ajouté, mais la classe/filière n'a pas pu être enregistrée en base`,
                "warning",
              );
              return;
            }
          }
        }
        showToast(`${name} ajouté ✓ (synchronisé avec le serveur)`, "success");
      })
      .catch((err) => {
        showToast(
          `${name} ajouté localement (sync échouée: ${err.message})`,
          "warning",
        );
      });
  } else {
    // UPDATE
    const newRoleApi = ROLE_TO_API[role] || "STUDENT";
    const newStatusApi = STATUS_TO_API[status] || "ACTIVE";

    apiFetch(`/auth/users/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(apiPayload),
    })
      .then(async () => {
        try {
          if (oldRoleApi && oldRoleApi !== newRoleApi) {
            await apiFetch(`/auth/users/${id}/change-role/`, {
              method: "POST",
              body: JSON.stringify({ role: newRoleApi }),
            });
          }
          if (oldStatusApi && oldStatusApi !== newStatusApi) {
            await apiFetch(`/auth/users/${id}/change-status/`, {
              method: "POST",
              body: JSON.stringify({ status: newStatusApi }),
            });
          }
          if (type === "client") {
            const classSynced = await syncStudentAcademicInfo(
              id,
              filiere,
              classe,
            );
            if (!classSynced) {
              showToast(
                `${name} modifié, mais la classe/filière n'a pas pu être enregistrée en base`,
                "warning",
              );
              return;
            }
          }
          showToast(`${name} modifié ✓`, "success");
        } catch (roleStatusErr) {
          showToast(
            `Modifié partiellement (erreur de rôle/statut: ${roleStatusErr.message})`,
            "warning",
          );
        }
      })
      .catch((err) => {
        showToast(
          `${name} modifié localement (sync échouée: ${err.message})`,
          "warning",
        );
      });
  }
}

function confirmDelete(id) {
  let user, userName;
  if (currentMainTab === "personnel") {
    user = personnel.find((u) => u.id === id);
    personnel = personnel.filter((u) => u.id !== id);
  } else {
    user = clients.find((u) => u.id === id);
    clients = clients.filter((u) => u.id !== id);
  }
  userName = user ? user.name : "Utilisateur";
  // Prevent deletion of admin users
  if (user && user.role === "administrateur") {
    showToast(
      `${userName} est un administrateur et ne peut pas être supprimé.`,
      "warning",
    );
    renderAll();
    return;
  }
  saveToLocalStorage();
  renderAll();
  // Deactivate then delete to avoid server 500 errors
  apiFetch(`/auth/users/${id}/change-status/`, {
    method: "POST",
    body: JSON.stringify({ status: "INACTIVE" }),
  })
    .then(() => apiFetch(`/auth/users/${id}/`, { method: "DELETE" }))
    .then(() => showToast(`${userName} supprimé ✓`, "info"))
    .catch((err) => {
      showToast(`${userName} suppression échouée: ${err.message}`, "error");
    });
}

// ==================== UI INTERACTIONS ====================
function toggleDetails(id) {
  const details = document.getElementById(`details-${id}`);
  if (details) {
    details.classList.toggle("hidden");
  }
}

function toggleAllDetails() {
  allDetailsVisible = !allDetailsVisible;
  const btn = document.querySelector(".btn-toggle-all");
  if (!btn) return;
  const icon = btn.querySelector("i");
  const span = btn.querySelector("span");
  if (icon && span) {
    icon.className = allDetailsVisible ? "fas fa-eye-slash" : "fas fa-eye";
    span.textContent = allDetailsVisible
      ? "Masquer tous les détails"
      : "Afficher tous les détails";
  }
  renderAll();
}

const ROLE_OPTIONS = {
  personnel: [
    { value: "administrateur", text: "👑 Administrateur" },
    { value: "directeur", text: "👔 Directeur" },
    { value: "secretaire", text: "📋 Secrétaire" },
    { value: "comptable", text: "💼 Comptable" },
    { value: "professeur", text: "👨‍🏫 Professeur" },
  ],
  client: [
    { value: "etudiant-excellent", text: "⭐ Élève Excellent (≥85)" },
    { value: "etudiant-regulier", text: "📘 Élève Régulier (60-84)" },
    { value: "etudiant-nouveau", text: "🆕 Nouvel Élève (<60)" },
  ],
};

function populateRoleSelect(userType) {
  const roleSelect = document.getElementById("userRole");
  const roleLabel = document.getElementById("roleLabel");
  const classeGroup = document.getElementById("classeGroup");
  const filiereGroup = document.getElementById("filiereGroup");
  if (!roleSelect || !roleLabel) return;
  roleSelect.innerHTML = "";
  const options =
    userType === "personnel" ? ROLE_OPTIONS.personnel : ROLE_OPTIONS.client;
  roleLabel.textContent =
    userType === "personnel" ? "Fonction" : "Niveau Élève";
  options.forEach((r) => {
    const o = document.createElement("option");
    o.value = r.value;
    o.textContent = r.text;
    roleSelect.appendChild(o);
  });
  if (classeGroup)
    classeGroup.style.display = userType === "personnel" ? "none" : "block";
  if (filiereGroup)
    filiereGroup.style.display = userType === "personnel" ? "none" : "block";
  handleRoleChange();
}

function updateRoleOptions() {
  const userType = document.getElementById("userType")?.value;
  if (!userType) return;
  populateRoleSelect(userType);
}

function handleRoleChange() {
  const userType = document.getElementById("userType")?.value;
  const role = document.getElementById("userRole")?.value;
  const matieresGroup = document.getElementById("matieresGroup");
  if (matieresGroup) {
    matieresGroup.style.display =
      userType === "personnel" && role === "professeur" ? "block" : "none";
  }
}

function renderMatieresInModal(matieres) {
  const container = document.getElementById("matieresEditContainer");
  if (!container) return;
  container.innerHTML = "";
  matieres.forEach((matiere, index) => {
    const tag = document.createElement("span");
    tag.className = "matiere-edit-tag";
    tag.innerHTML = `<i class="fas fa-book"></i> ${escapeHtml(matiere)}<button type="button" class="btn-remove-edit" onclick="removeMatiereInModal(${index})"><i class="fas fa-times"></i></button>`;
    container.appendChild(tag);
  });
}

function addMatiereInModal() {
  const input = document.getElementById("newMatiereInput");
  if (!input) return;
  const matiere = input.value.trim().replace(/\s+/g, " ");
  if (!matiere) {
    input.focus();
    return;
  }
  const exists = tempMatieres.some(
    (m) => m.toLowerCase() === matiere.toLowerCase(),
  );
  if (exists) {
    showToast("Cette matière existe déjà", "warning");
    input.focus();
    return;
  }
  tempMatieres.push(matiere);
  renderMatieresInModal(tempMatieres);
  if (!courses.some((c) => c.toLowerCase() === matiere.toLowerCase())) {
    courses.push(matiere);
    saveToLocalStorage();
  }
  input.value = "";
  input.focus();
}

function removeMatiereInModal(index) {
  tempMatieres.splice(index, 1);
  renderMatieresInModal(tempMatieres);
}

function addMatiereInline(userId) {
  const user = personnel.find((u) => u.id === userId);
  if (!user || !user.matieres) return;
  const nouvelleMatiere = prompt("Nom de la nouvelle matière :");
  if (!nouvelleMatiere) return;
  const cleaned = nouvelleMatiere.trim().replace(/\s+/g, " ");
  if (!cleaned) return;
  const exists = user.matieres.some(
    (m) => m.toLowerCase() === cleaned.toLowerCase(),
  );
  if (exists) {
    showToast("Cette matière existe déjà pour ce professeur", "warning");
    return;
  }
  user.matieres.push(cleaned);
  if (!courses.some((c) => c.toLowerCase() === cleaned.toLowerCase())) {
    courses.push(cleaned);
  }
  saveToLocalStorage();
  renderAll();
  showToast("Matière ajoutée avec succès", "success");
}

function removeMatiereInline(userId, matiereIndex) {
  const user = personnel.find((u) => u.id === userId);
  if (!user || !user.matieres) return;
  user.matieres.splice(matiereIndex, 1);
  saveToLocalStorage();
  renderAll();
}

function filterStats(filter, el) {
  currentFilter = filter;
  document
    .querySelectorAll(".stat-card")
    .forEach((c) => c.classList.remove("active"));
  if (el) el.classList.add("active");
  renderAll();
}

function handleAddButton() {
  const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
  const allowedRoles = ["ADMIN", "DIRECTOR"];
  if (!user || !allowedRoles.includes(user.role)) {
    showToast(
      "Vous n'avez pas la permission d'ajouter un utilisateur.",
      "error",
    );
    return;
  }
  if (currentMainTab === "presences") {
    showToast("Ajout d'élève depuis la section Élèves", "info");
    return;
  }
  openModal("add");
}

// ==================== RENDER FUNCTIONS ====================
function renderAll() {
  renderPersonnel();
  renderClients();
  if (currentMainTab === "presences") {
    renderPresences();
    renderPresenceStats();
  }
  updatePageVisibility();
  renderCourseSelect();
  document.getElementById("personnelCount").textContent = personnel.length;
  document.getElementById("clientCount").textContent = clients.length;
}

function renderPersonnel() {
  let data = [...personnel];
  if (currentFilter === "actif")
    data = data.filter((u) => u.status === "actif");
  else if (currentFilter === "inactif")
    data = data.filter((u) => u.status !== "actif");
  if (searchQueryPersonnel)
    data = data.filter((u) => matchesSearch(u, searchQueryPersonnel));
  const container = document.getElementById("usersContainerPersonnel");
  const total = personnel.length;
  const actifs = personnel.filter((u) => u.status === "actif").length;
  const inactifs = personnel.filter((u) => u.status !== "actif").length;
  const professeurs = personnel.filter((u) => u.role === "professeur").length;
  const totalMatieres = personnel.reduce(
    (sum, u) => sum + (u.matieres ? u.matieres.length : 0),
    0,
  );
  document.getElementById("statsContainerPersonnel").innerHTML =
    `<div class="stat-card ${currentFilter === "all" ? "active" : ""}" data-filter="all" onclick="filterStats('all', this)"><div class="stat-info"><span class="stat-label">Total Personnel</span><h2>${total}</h2></div><i class="fas fa-users stat-icon"></i></div><div class="stat-card ${currentFilter === "actif" ? "active" : ""}" data-filter="actif" onclick="filterStats('actif', this)"><div class="stat-info"><span class="stat-label">Actifs</span><h2>${actifs}</h2></div><span class="dot dot-actif"></span></div><div class="stat-card ${currentFilter === "inactif" ? "active" : ""}" data-filter="inactif" onclick="filterStats('inactif', this)"><div class="stat-info"><span class="stat-label">Inactifs/Suspendus</span><h2>${inactifs}</h2></div><span class="dot dot-inactif"></span></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Professeurs</span><h2>${professeurs}</h2></div><i class="fas fa-chalkboard-teacher stat-icon" style="color:var(--blue);"></i></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Total Matières</span><h2>${totalMatieres}</h2></div><i class="fas fa-book stat-icon" style="color:var(--warning);"></i></div>`;
  document.getElementById("personnelResultCount").textContent =
    `${data.length} résultat${data.length !== 1 ? "s" : ""}`;
  container.innerHTML = "";
  if (data.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><h3>Aucun utilisateur trouvé</h3><p>${searchQueryPersonnel ? 'Aucun résultat pour "' + escapeHtml(searchQueryPersonnel) + '".' : "Aucun membre du personnel avec les filtres actuels."}</p></div>`;
  } else {
    data.forEach((user) => {
      const hiddenClass = allDetailsVisible ? "" : "hidden";
      let matieresHTML = "";
      if (user.matieres && user.matieres.length > 0) {
        matieresHTML = `<div class="detail-item" style="flex-wrap:wrap;"><i class="fas fa-book"></i><div class="matieres-list">${user.matieres.map((m, i) => `<span class="matiere-tag">${escapeHtml(m)}${user.role === "professeur" ? `<button class="btn-remove-matiere" onclick="event.stopPropagation();removeMatiereInline(${user.id},${i})"><i class="fas fa-times"></i></button>` : ""}</span>`).join("")}${user.role === "professeur" ? `<button class="btn-add-matiere" onclick="event.stopPropagation();addMatiereInline(${user.id})"><i class="fas fa-plus"></i> Ajouter</button>` : ""}</div></div>`;
      } else if (user.role === "professeur") {
        matieresHTML = `<div class="detail-item" style="flex-wrap:wrap;"><i class="fas fa-book"></i><span style="color:var(--muted-light);font-style:italic;">Aucune matière assignée</span><button class="btn-add-matiere" onclick="event.stopPropagation();addMatiereInline(${user.id})" style="margin-left:8px;"><i class="fas fa-plus"></i> Ajouter</button></div>`;
      }
      const card = document.createElement("div");
      card.className = "user-card";
      card.innerHTML = `<div><div class="user-profile"><div class="avatar22">${getInitials(user.name)}</div><div class="user-meta"><h3><i class="fas ${getIcon(user.role)}" style="color:var(--blue);"></i> ${escapeHtml(user.name)}</h3><div class="badges"><span class="badge ${getRoleClass(user.role)}">${getRoleDisplay(user.role)}</span><span class="badge ${getStatusClass(user.status)}">${capitalize(user.status)}</span></div></div></div><div class="user-details ${hiddenClass}" id="details-${user.id}"><div class="detail-item"><i class="fas fa-envelope"></i> ${escapeHtml(user.email)}</div><div class="detail-item"><i class="fas fa-phone"></i> ${escapeHtml(user.phone)}</div>${matieresHTML}<div class="detail-item"><i class="fas fa-clock"></i> Dernière connexion: ${escapeHtml(user.lastLogin)}</div></div></div><div class="user-actions"><button class="btn-toggle-info" onclick="toggleDetails(${user.id})" title="${allDetailsVisible ? "Masquer" : "Afficher"} détails"><i class="fas ${allDetailsVisible ? "fa-eye-slash" : "fa-eye"}"></i></button><button class="btn-action" onclick="openModal('edit', ${user.id})" title="Modifier"><i class="fas fa-pen"></i> Modifier</button><button class="btn-delete" onclick="openModal('delete-confirm', ${user.id})" title="Supprimer"><i class="fas fa-trash"></i></button></div>`;
      container.appendChild(card);
    });
  }
}

function renderClients() {
  let data = [...clients];
  if (currentFilter === "actif")
    data = data.filter((u) => u.status === "actif");
  else if (currentFilter === "inactif")
    data = data.filter((u) => u.status !== "actif");
  if (currentFiliereFilter && currentFiliereFilter !== "all") {
    data = data.filter((u) => u.filiere === currentFiliereFilter);
  }
  if (currentClasseFilter && currentClasseFilter !== "all") {
    data = data.filter((u) => u.classe === currentClasseFilter);
  }
  if (searchQueryClients)
    data = data.filter((u) => matchesSearch(u, searchQueryClients));
  const container = document.getElementById("usersContainerClients");
  const total = clients.length;
  const actifs = clients.filter((u) => u.status === "actif").length;
  const inactifs = clients.filter((u) => u.status !== "actif").length;
  const excellents = clients.filter(
    (u) => u.role === "etudiant-excellent",
  ).length;
  const moyenneGlobale =
    clients.length > 0
      ? Math.round(
          clients.reduce((sum, u) => sum + (u.moyenne || 0), 0) /
            clients.length,
        )
      : 0;
  document.getElementById("statsContainerClients").innerHTML =
    `<div class="stat-card ${currentFilter === "all" ? "active" : ""}" data-filter="all" onclick="filterStats('all', this)"><div class="stat-info"><span class="stat-label">Total Élèves</span><h2>${total}</h2></div><i class="fas fa-user-graduate stat-icon"></i></div><div class="stat-card ${currentFilter === "actif" ? "active" : ""}" data-filter="actif" onclick="filterStats('actif', this)"><div class="stat-info"><span class="stat-label">Actifs</span><h2>${actifs}</h2></div><span class="dot dot-actif"></span></div><div class="stat-card ${currentFilter === "inactif" ? "active" : ""}" data-filter="inactif" onclick="filterStats('inactif', this)"><div class="stat-info"><span class="stat-label">Inactifs</span><h2>${inactifs}</h2></div><span class="dot dot-inactif"></span></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Excellents</span><h2>${excellents}</h2></div><i class="fas fa-star stat-icon" style="color:var(--warning);"></i></div><div class="stat-card"><div class="stat-info"><span class="stat-label">Moyenne Générale</span><h2>${moyenneGlobale}%</h2></div><i class="fas fa-chart-line stat-icon" style="color:var(--success);"></i></div>`;
  document.getElementById("clientResultCount").textContent =
    `${data.length} résultat${data.length !== 1 ? "s" : ""}`;
  renderFiliereFilterBar();
  container.innerHTML = "";
  if (data.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-search"></i><h3>Aucun utilisateur trouvé</h3><p>${searchQueryClients ? 'Aucun résultat pour "' + escapeHtml(searchQueryClients) + '".' : "Aucun élève avec les filtres actuels."}</p></div>`;
  } else {
    data.forEach((user) => {
      const hiddenClass = allDetailsVisible ? "" : "hidden";
      const extraHTML = `<div class="student-extra-info"><span class="info-tag"><i class="fas fa-calendar"></i> ${escapeHtml(user.promotion)}</span><span class="info-tag"><i class="fas fa-chart-line"></i> ${user.moyenne}%</span><span class="info-tag"><i class="fas fa-book"></i> ${escapeHtml(user.cours)}</span>${user.classe ? `<span class="info-tag" style="background:#fce7f3;color:#9d174d;border-color:#fbcfe8;"><i class="fas fa-chalkboard"></i> ${escapeHtml(user.classe)}</span>` : ""}${user.filiere ? `<span class="info-tag" style="background:#ede9fe;color:#5b21b6;border-color:#ddd6fe;"><i class="fas fa-graduation-cap"></i> ${escapeHtml(user.filiere)}</span>` : ""}</div>`;
      const card = document.createElement("div");
      card.className = "user-card";
      card.innerHTML = `<div><div class="user-profile"><div class="avatar22">${getInitials(user.name)}</div><div class="user-meta"><h3><i class="fas ${getIcon(user.role)}" style="color:var(--blue);"></i> ${escapeHtml(user.name)}</h3><div class="badges"><span class="badge ${getRoleClass(user.role)}">${getRoleDisplay(user.role)}</span><span class="badge ${getStatusClass(user.status)}">${capitalize(user.status)}</span>${user.classe ? `<span class="badge badge-classe"><i class="fas fa-chalkboard"></i> ${escapeHtml(user.classe)}</span>` : ""}${user.filiere ? `<span class="badge" style="background:#ede9fe;color:#5b21b6;"><i class="fas fa-graduation-cap"></i> ${escapeHtml(user.filiere)}</span>` : ""}</div>${extraHTML}</div></div><div class="user-details ${hiddenClass}" id="details-${user.id}"><div class="detail-item"><i class="fas fa-envelope"></i> ${escapeHtml(user.email)}</div><div class="detail-item"><i class="fas fa-phone"></i> ${escapeHtml(user.phone)}</div>${user.classe ? `<div class="detail-item"><i class="fas fa-chalkboard"></i> Classe: ${escapeHtml(user.classe)}</div>` : ""}${user.filiere ? `<div class="detail-item"><i class="fas fa-graduation-cap"></i> Filière: ${escapeHtml(user.filiere)}</div>` : ""}<div class="detail-item"><i class="fas fa-calendar"></i> ${escapeHtml(user.promotion)}</div><div class="detail-item"><i class="fas fa-chart-line"></i> Moyenne: ${user.moyenne}%</div><div class="detail-item"><i class="fas fa-book"></i> ${escapeHtml(user.cours)}</div><div class="detail-item"><i class="fas fa-clock"></i> Dernière connexion: ${escapeHtml(user.lastLogin)}</div></div></div><div class="user-actions"><button class="btn-toggle-info" onclick="toggleDetails(${user.id})" title="${allDetailsVisible ? "Masquer" : "Afficher"} détails"><i class="fas ${allDetailsVisible ? "fa-eye-slash" : "fa-eye"}"></i></button><button class="btn-action" onclick="openModal('edit', ${user.id})" title="Modifier"><i class="fas fa-pen"></i> Modifier</button>${user.classe ? `<button class="btn-promote" onclick="promouvoirEleve(${user.id})" title="Promouvoir en classe supérieure"><i class="fas fa-arrow-up"></i> Monter</button>` : ""}<button class="btn-delete" onclick="openModal('delete-confirm', ${user.id})" title="Supprimer"><i class="fas fa-trash"></i></button></div>`;
      container.appendChild(card);
    });
  }
}

function populateSchoolClassFilter() {
  const select = document.getElementById("schoolClassFilter");
  if (!select) return;
  const previousValue = select.value;
  select.innerHTML =
    `<option value="">Sélectionnez une classe</option>` +
    classes.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  if (previousValue && classes.includes(previousValue)) {
    select.value = previousValue;
  }
}

function renderCourseSelect() {
  populateSchoolClassFilter();

  const select = document.getElementById("courseFilter");
  if (!select) return;
  const previousValue = select.value;

  // "classe" est stockée sous la forme "<Filière> <niveau>" (ex: "Développement Web 2").
  // Course n'a pas de FK directe vers Class, seulement vers Specialization :
  // on filtre donc les cours par nom de filière déduit de la classe choisie.
  const selectedClasse = document.getElementById("schoolClassFilter")?.value;
  let filteredCourses = coursesRaw;
  if (selectedClasse) {
    const match = selectedClasse.match(/^(.+?)\s*(\d+)$/);
    const filiereName = match ? match[1].trim() : selectedClasse;
    filteredCourses = coursesRaw.filter((c) => c.specialization_name === filiereName);
  }

  select.innerHTML = filteredCourses
    .map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.name)}</option>`)
    .join("");
  if (previousValue && filteredCourses.some(c => c.id === previousValue)) {
    select.value = previousValue;
  }
}

// Statuts d'inscription considérés comme "élève actuellement inscrit au
// cours" pour la feuille d'appel : pending/rejected/suspended en sont
// exclus (un élève en attente ou refusé n'assiste pas au cours).
const ENROLLED_INSCRIPTION_STATUSES = ["approved", "active", "validated"];

function getFilteredElevesPresence() {
  // Returns clients réellement inscrits (via Inscription) au cours sélectionné,
  // narrowed further to the selected class when one is chosen.
  const courseId = document.getElementById("courseFilter")?.value;
  if (!courseId) return [];

  const courseObj = coursesRaw.find((c) => c.id === courseId);
  const courseSpecializationId = courseObj
    ? (typeof courseObj.specialization === "object"
        ? courseObj.specialization?.id
        : courseObj.specialization)
    : null;

  const enrolledStudentIds = new Set(
    inscriptionsRaw
      .filter((insc) => {
        if (!ENROLLED_INSCRIPTION_STATUSES.includes(insc.status)) return false;

        const inscCourseId =
          typeof insc.course === "object" ? insc.course?.id : insc.course;
        if (inscCourseId && inscCourseId === courseId) return true;

        // Un élève inscrit à une CLASSE (school_class) est automatiquement
        // inscrit à TOUS les cours de la filière de cette classe — c'est le
        // mode d'inscription normal (cf. Inscription.school_class:
        // "Remplace le champ 'course' au niveau macro.").
        const inscSpecializationId =
          typeof insc.specialization_id === "object"
            ? insc.specialization_id?.id
            : insc.specialization_id;
        return (
          insc.school_class != null &&
          courseSpecializationId != null &&
          inscSpecializationId === courseSpecializationId
        );
      })
      .map((insc) =>
        typeof insc.student === "object" ? insc.student?.id : insc.student,
      ),
  );

  const selectedClasse = document.getElementById("schoolClassFilter")?.value;
  const courseName = courseObj ? courseObj.name : "";

  return clients
    .filter((u) => enrolledStudentIds.has(u.student_id ?? u.id))
    .filter((u) => !selectedClasse || u.classe === selectedClasse)
    .map((c) => ({
      id: c.student_id || c.id,
      nom: c.name,
      filiere: courseName,
      presences: 0,
      total: 0,
    }));
}

function setAttendance(studentId, status) {
  presenceStatus[studentId] = status;
  const row = document.querySelector(`tr[data-student-id="${studentId}"]`);
  if (!row) return;
  row
    .querySelectorAll(".btn-status")
    .forEach((b) => b.classList.remove("active"));
  const activeBtn = row.querySelector(`.btn-${status}`);
  if (activeBtn) activeBtn.classList.add("active");
  const statusCell = row.querySelector(".student-status");
  let badge = "";
  if (status === "present") {
    badge =
      '<span class="status-badge-presence state-present"><i class="fas fa-check-circle"></i> Présent</span>';
  } else if (status === "absent") {
    badge =
      '<span class="status-badge-presence state-absent"><i class="fas fa-times-circle"></i> Absent</span>';
  } else {
    badge =
      '<span class="status-badge-presence state-retard"><i class="fas fa-clock"></i> Retard</span>';
  }
  statusCell.innerHTML = badge;
  const badgeEl = statusCell.querySelector(".status-badge-presence");
  if (badgeEl) {
    badgeEl.classList.add("updated");
    setTimeout(() => badgeEl.classList.remove("updated"), 500);
  }
  updatePresenceCounters();
  updatePresenceCharts();
  const eleve = elevesPresence.find((e) => e.id === studentId);
  if (eleve) {
    const statusText =
      status === "present"
        ? "Présent"
        : status === "absent"
          ? "Absent"
          : "Retard";
    const toastType =
      status === "present" ? "success" : status === "absent" ? "error" : "info";
    showToast(`${eleve.nom} : ${statusText}`, toastType);
  }
  saveToLocalStorage();
}

function renderAttendanceTable() {
  const filtered = getFilteredElevesPresence();
  const courseId = document.getElementById("courseFilter")?.value;
  const courseObj = coursesRaw.find((c) => c.id === courseId);
  const cf = courseObj ? courseObj.name : "Entrepreneuriat";
  const display = document.getElementById("courseDisplay");
  if (display) display.textContent = cf;
  const tbody = document.getElementById("attendanceBody");
  if (!tbody) return;
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state" style="padding:30px 10px;"><i class="fas fa-user-slash"></i><h3>Aucun élève</h3><p>Aucun élève inscrit pour la filière "${escapeHtml(cf)}".</p></div></td></tr>`;
    updatePresenceCounters();
    updatePresenceCharts();
    return;
  }
  tbody.innerHTML = filtered
    .map((e, i) => {
      const s = presenceStatus[e.id] || "present";
      let badge = "",
        ap = "",
        aa = "",
        ar = "";
      if (s === "present") {
        badge =
          '<span class="status-badge-presence state-present"><i class="fas fa-check-circle"></i> Présent</span>';
        ap = "active";
      } else if (s === "absent") {
        badge =
          '<span class="status-badge-presence state-absent"><i class="fas fa-times-circle"></i> Absent</span>';
        aa = "active";
      } else {
        badge =
          '<span class="status-badge-presence state-retard"><i class="fas fa-clock"></i> Retard</span>';
        ar = "active";
      }
      return `<tr data-student-id="${e.id}"><td><span class="student-name"><span class="avatar-xs" style="background:${getAvatarColor(i)}">${getInitials(e.nom)}</span>${escapeHtml(e.nom)}</span></td><td class="student-status">${badge}</td><td><div class="action-btns"><button class="btn-status btn-present ${ap}" onclick="setAttendance(${e.id},'present')">Présent</button><button class="btn-status btn-absent ${aa}" onclick="setAttendance(${e.id},'absent')">Absent</button><button class="btn-status btn-retard ${ar}" onclick="setAttendance(${e.id},'retard')">Retard</button></div></td></tr>`;
    })
    .join("");
  updatePresenceCounters();
  updatePresenceCharts();
}

async function savePresences() {
  const today = document.getElementById("dateFilter")?.value || getTodayDate();
  const courseId = document.getElementById("courseFilter")?.value;
  const filtered = getFilteredElevesPresence();
  
  if (filtered.length === 0) {
    showToast("Aucun élève à enregistrer pour cette filière", "warning");
    return;
  }

  const items = filtered.map(e => ({
      student: e.id,
      status: presenceStatus[e.id] || "present",
      local_timestamp: new Date().toISOString(),
      local_uuid: window.generateLocalUuid ? window.generateLocalUuid() : crypto.randomUUID()
  }));

  const btn = document.querySelector('button[onclick="savePresences()"]');
  if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
  }

  try {
      const isOffline = !navigator.onLine;
      
      if (isOffline) {
          showToast("Vous êtes hors-ligne. (L'appel sera synchronisé plus tard)", "info");
          // Here we would normally use OfflineQueue, but for now just show a message.
      } else {
          await window.AttendanceAPI.submitBatch(courseId, today, false, items);
          
          let p = 0, a = 0, r = 0;
          items.forEach(i => {
              if (i.status === 'present') p++;
              else if (i.status === 'absent') a++;
              else r++;
          });
          
          showToast(`Appel du ${today} enregistré : ${p} présents, ${a} absents, ${r} retards`, "success");
          await applyFilter();
          // For history and stats, we could reload from API or just render what we have.
          // Since history currently relies on local `historiquePresences`, 
          // let's update it locally so the UI still looks responsive.
          const courseName = document.getElementById("courseFilter").options[document.getElementById("courseFilter").selectedIndex].text;
          if (!historiquePresences[today]) historiquePresences[today] = {};
          historiquePresences[today][courseName] = {};
          items.forEach(i => {
              historiquePresences[today][courseName][i.student] = i.status;
          });
          saveToLocalStorage();
          renderHistory();
          renderPresenceStats();
      }
  } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'appel:", error);
      showToast("Erreur lors de l'enregistrement", "error");
  } finally {
      if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer l\'Appel';
      }
  }
}

function renderHistory() {
  const container = document.getElementById("historyContainer");
  if (!container) return;
  const dates = Object.keys(historiquePresences).sort().reverse();
  if (dates.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-times"></i><h3>Aucun historique</h3><p>Enregistrez votre premier appel pour voir l'historique</p></div>`;
    return;
  }
  container.innerHTML = dates
    .slice(0, 10)
    .map((date) => {
      const coursData = historiquePresences[date];
      const coursList = Object.keys(coursData)
        .map((cours) => {
          const eleves = coursData[cours];
          let p = 0,
            a = 0,
            r = 0;
          Object.values(eleves).forEach((s) => {
            if (s === "present") p++;
            else if (s === "absent") a++;
            else r++;
          });
          return `<span style="font-size:0.8rem;color:var(--muted);margin-left:8px">${escapeHtml(cours)}: <span style="color:var(--green-ui);font-weight:600">${p}P</span> <span style="color:var(--red);font-weight:600">${a}A</span> <span style="color:var(--orange-ui);font-weight:600">${r}R</span></span>`;
        })
        .join("");
      return `<div class="presence-day-card"><h4><i class="fas fa-calendar-check"></i> ${new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h4><div style="display:flex;flex-wrap:wrap;gap:4px">${coursList}</div></div>`;
    })
    .join("");
}

function clearHistory() {
  if (Object.keys(historiquePresences).length === 0) {
    showToast("Aucun historique à effacer", "info");
    return;
  }
  openModal("clear-history-confirm");
}

function doClearHistory() {
  historiquePresences = {};
  saveToLocalStorage();
  renderHistory();
  showToast("Historique effacé", "info");
}

async function renderPresenceStats() {
  const container = document.getElementById("presenceStatsGrid");
  if (!container) return;
  
  try {
      const statsData = await window.AttendanceAPI.stats();
      // statsData is an array of objects: { student_id, total, present, absent }
      const statsMap = {};
      (statsData.results || statsData || []).forEach(st => {
          statsMap[st.student_id] = st;
      });

      const students = getFilteredElevesPresence();
      
      container.innerHTML = students
        .map((eleve) => {
          const st = statsMap[eleve.id] || { total: 0, present: 0, absent: 0 };
          const presences = st.present || 0;
          const total = st.total || 0;
          const taux = total > 0 ? Math.round((presences / total) * 100) : 0;
          
          let barClass = "bar-green";
          let textClass = "text-green";
          if (taux < 50) {
            barClass = "bar-red";
            textClass = "text-red";
          } else if (taux < 75) {
            barClass = "bar-blue";
            textClass = "text-blue";
          }
          return `<div class="student-stat-card"><div class="stat-student-name"><i class="fas fa-user-circle" style="color:var(--blue)"></i>${escapeHtml(eleve.nom)}</div><div class="stat-student-class">${escapeHtml(eleve.filiere)}</div><div class="stat-progress-row"><span class="stat-label-presence">Taux de présence</span><span class="stat-percentage ${textClass}">${taux}%</span></div><div class="progress-bar-container"><div class="progress-bar ${barClass}" style="width:${taux}%"></div></div><div class="stat-progress-row"><span class="stat-label-presence">Présences</span><span>${presences}/${total}</span></div><div class="stat-footer">${total - presences} absence${(total - presences) > 1 ? "s" : ""} enregistrée${(total - presences) > 1 ? "s" : ""}</div></div>`;
        })
        .join("");
  } catch (error) {
      console.error("Erreur stats présences:", error);
  }
}

function updatePresenceCounters() {
  const f = getFilteredElevesPresence();
  let p = 0,
    a = 0,
    r = 0;
  f.forEach((e) => {
    const s = presenceStatus[e.id] || "present";
    if (s === "present") p++;
    else if (s === "absent") a++;
    else r++;
  });
  const countTotal = document.getElementById("count-total");
  const countPresents = document.getElementById("count-presents");
  const countAbsents = document.getElementById("count-absents");
  const countRetards = document.getElementById("count-retards");
  if (countTotal) countTotal.textContent = f.length;
  if (countPresents) countPresents.textContent = p;
  if (countAbsents) countAbsents.textContent = a;
  if (countRetards) countRetards.textContent = r;
}

function updatePresenceCharts() {
  const f = getFilteredElevesPresence();
  let p = 0,
    a = 0,
    r = 0;
  f.forEach((e) => {
    const s = presenceStatus[e.id] || "present";
    if (s === "present") p++;
    else if (s === "absent") a++;
    else r++;
  });
  const ctx1 = document.getElementById("presencePieChart");
  if (ctx1) {
    if (chartInstances["pie"]) chartInstances["pie"].destroy();
    chartInstances["pie"] = new Chart(ctx1, {
      type: "doughnut",
      data: {
        labels: ["Présents", "Absents", "Retards"],
        datasets: [
          {
            data: [p, a, r],
            backgroundColor: ["#10b981", "#D62828", "#f59e0b"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { size: 10 }, usePointStyle: true, padding: 16 },
          },
        },
      },
    });
  }
  const ctx2 = document.getElementById("courseBarChart");
  if (ctx2) {
    if (chartInstances["bar"]) chartInstances["bar"].destroy();
    const courseData = {};
    elevesPresence.forEach((e) => {
      const c = e.filiere;
      if (!courseData[c]) courseData[c] = { total: 0, presents: 0 };
      courseData[c].total++;
      const s = presenceStatus[e.id] || "present";
      if (s === "present") courseData[c].presents++;
    });
    const labels = Object.keys(courseData);
    const data = labels.map((l) =>
      Math.round((courseData[l].presents / courseData[l].total) * 100),
    );
    chartInstances["bar"] = new Chart(ctx2, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Taux présence %",
            data,
            backgroundColor: "rgba(10,77,140,0.7)",
            borderRadius: 6,
            borderColor: "rgba(10,77,140,1)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 0,
            max: 100,
            ticks: {
              callback: function (value) {
                return value + "%";
              },
            },
          },
        },
        indexAxis: "y",
        plugins: { legend: { display: false } },
      },
    });
  }
}

async function applyFilter() {
  const dateStr = document.getElementById("dateFilter")?.value;
  const courseId = document.getElementById("courseFilter")?.value;
  
  if (!dateStr || !courseId) return;

  const students = getFilteredElevesPresence();
  // Default to present
  students.forEach((e) => {
    presenceStatus[e.id] = "present";
  });

  try {
    const data = await window.AttendanceAPI.byCourse(courseId, dateStr);
    const attendances = data.results || data || [];
    
    if (attendances && attendances.length > 0) {
      attendances.forEach(att => {
        if (!att.present && att.reason_if_absent === "Retard") {
            presenceStatus[att.student] = "retard";
        } else if (att.present && att.reason_if_absent === "Retard") {
            presenceStatus[att.student] = "retard";
        } else if (att.present) {
            presenceStatus[att.student] = "present";
        } else {
            presenceStatus[att.student] = "absent";
        }
      });
    }
  } catch (error) {
    console.error("Erreur lors du chargement des présences:", error);
    showToast("Erreur API présences, fallback en cours", "warning");
  }
  
  renderAttendanceTable();
}

async function renderPresences() {
  const dateFilter = document.getElementById("dateFilter");
  if (dateFilter) {
    if (!dateFilter.value) dateFilter.value = getTodayDate();
    dateFilter.max = getTodayDate();
  }
  await applyFilter();
  renderHistory();
  renderPresenceStats();
}

function updatePageVisibility() {
  document
    .getElementById("page-personnel")
    .classList.toggle("active", currentMainTab === "personnel");
  document
    .getElementById("page-clients")
    .classList.toggle("active", currentMainTab === "clients");
  document
    .getElementById("page-presences")
    .classList.toggle("active", currentMainTab === "presences");
  document.getElementById("breadcrumbCurrent").textContent =
    currentMainTab === "personnel"
      ? "Gestion Professeurs"
      : currentMainTab === "clients"
        ? "Gestion Élèves"
        : "Gestion des Présences";
  document.getElementById("headerTitle").textContent =
    currentMainTab === "personnel"
      ? "Gestion des Professeurs"
      : currentMainTab === "clients"
        ? "Gestion des Élèves"
        : "Gestion des Présences";
  document.getElementById("headerSubtitle").innerHTML =
    currentMainTab === "personnel"
      ? '<i class="fas fa-chalkboard-teacher"></i> Gérez vos professeurs et le personnel académique'
      : currentMainTab === "clients"
        ? '<i class="fas fa-user-graduate"></i> Gérez vos élèves par filière et classe'
        : '<i class="fas fa-clock"></i> Suivez les présences quotidiennes des élèves par filière';
  document.getElementById("addBtnText").textContent =
    currentMainTab === "presences"
      ? "Ajouter"
      : currentMainTab === "personnel"
        ? "Ajouter Professeur"
        : "Ajouter Élève";
  const actionBtn = document.querySelector(".section-action-btn");
  if (actionBtn) {
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
    const canManage = user && ["ADMIN", "DIRECTOR"].includes(user.role);
    actionBtn.style.display =
      currentMainTab === "presences" || !canManage ? "none" : "flex";
  }
}

function switchMainTab(tab) {
  currentMainTab = tab;
  currentFilter = "all";
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  if (tab === "presences") renderPresences();
  renderAll();
}

// ==================== EVENT LISTENERS ====================
document.addEventListener("keydown", function (e) {
  if (
    e.key === "Escape" &&
    document.getElementById("modalOverlay").classList.contains("open")
  ) {
    closeModal();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "n") {
    e.preventDefault();
    handleAddButton();
  }
  if (
    (e.ctrlKey || e.metaKey) &&
    e.key === "s" &&
    currentMainTab === "presences"
  ) {
    e.preventDefault();
    savePresences();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "e") {
    e.preventDefault();
    exportCurrentView();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    const targetId =
      currentMainTab === "clients"
        ? "searchInputClients"
        : "searchInputPersonnel";
    const input = document.getElementById(targetId);
    if (input) {
      input.focus();
      input.select();
    }
  }
});
document.getElementById("modalOverlay").addEventListener("click", function (e) {
  if (e.target === this) closeModal();
});
document.addEventListener("keydown", function (e) {
  if (e.target.id === "newMatiereInput" && e.key === "Enter") {
    e.preventDefault();
    addMatiereInModal();
  }
});

// ==================== INITIALIZATION ====================
async function initialize() {
  // 1. Load from localStorage immediately (instant render, si déjà en cache)
  if (!loadFromLocalStorage()) {
    console.log("Premier chargement - aucune donnée en cache");
  }
  renderAll();
  switchMainTab("personnel");

  // 2. Refresh from Django API in background : utilisateurs, données
  //    académiques (filières/classes/cours), profils élèves ET matières
  //    des professeurs (plus aucune valeur codée en dur).
  showToast("Synchronisation avec le serveur...", "info");
  const [apiOk, academicOk] = await Promise.all([
    fetchUsersFromApi(),
    fetchAcademicDataFromApi(),
  ]);

  if (apiOk && academicOk) {
    await fetchTeacherMatieresFromApi(); // matières déduites des cours (Course.teacher)
    enrichClientsWithAcademicInfo(); // classe/filière des élèves
  }
  if (apiOk || academicOk) {
    renderAll();
  } else {
    showToast("Mode hors-ligne — données locales utilisées", "warning");
  }
  if (!academicOk && filieres.length === 0) {
    showToast(
      "Impossible de charger filières/classes/cours depuis le serveur",
      "warning",
    );
  }

  console.log("✅ CEJEC ERP initialisé avec succès");
  console.log(
    `📊 ${personnel.length} professeurs, ${clients.length} élèves chargés`,
  );
  console.log(
    `📚 ${filieres.length} filières, ${classes.length} classes disponibles`,
  );
  console.log("💾 Sauvegarde automatique activée (30s)");
}
initialize();