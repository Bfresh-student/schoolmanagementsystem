// ==========================================
// CEJEC ERP — Gestion des Inscriptions & Encaissement
// Version corrigée — voir "🔧 FIX #N" pour chaque bug résolu.
// ==========================================
// Suppose que js/api-client.js est chargé AVANT ce script.
// ==========================================

// ------------------------------------------
// DONNÉES DE SECOURS (mode démo hors-ligne / backend absent)
// ------------------------------------------
const MOCK_ETUDIANTS = [
  {
    id: "ETU-2026-001", nom: "Pierre Antoine", prenom: "Pierre", sexe: "Homme",
    tel: "+509 41 22 33 44", email: "pierre@email.com", adresse: "Rue des Miracles, Delmas",
    commune: "Delmas", departement: "Ouest", dateNaissance: "1998-05-15",
    parentNom: "Jean Antoine", parentTel: "+509 40 11 22 33", parentProfession: "Commerçant",
    parentAdresse: "Delmas 75", promo: "Promotion 2026", statut: "Inscrit",
    dateInscription: "2026-01-15", plan: "VIP", montantPaye: 25000, resteAPayer: 25000, totalFormation: 50000,
  },
  {
    id: "ETU-2026-002", nom: "Marie Joseph", prenom: "Marie", sexe: "Femme",
    tel: "+509 42 33 44 55", email: "marie@email.com", adresse: "Avenue du Centre, Pétion-Ville",
    commune: "Pétion-Ville", departement: "Ouest", dateNaissance: "1999-08-22",
    parentNom: "Paul Joseph", parentTel: "+509 41 22 44 55", parentProfession: "Enseignante",
    parentAdresse: "Pétion-Ville 45", promo: "Promotion 2026", statut: "Inscrit",
    dateInscription: "2026-02-01", plan: "Standard", montantPaye: 50000, resteAPayer: 0, totalFormation: 50000,
  },
  {
    id: "ETU-2026-003", nom: "Jameson Pierre", prenom: "Jameson", sexe: "Homme",
    tel: "+509 43 55 66 77", email: "jameson@email.com", adresse: "Boulevard 15 Octobre, Tabarre",
    commune: "Tabarre", departement: "Ouest", dateNaissance: "2000-01-10",
    parentNom: "Rose Pierre", parentTel: "+509 40 33 66 77", parentProfession: "Avocat",
    parentAdresse: "Tabarre 12", promo: "Promotion 2026", statut: "Suspendu",
    dateInscription: "2026-03-10", plan: "VIP", montantPaye: 10000, resteAPayer: 40000, totalFormation: 50000,
  },
  {
    id: "ETU-2026-004", nom: "Mireille Dumont", prenom: "Mireille", sexe: "Femme",
    tel: "+509 44 66 77 88", email: "mireille@email.com", adresse: "Rue Lamarre, Cap-Haïtien",
    commune: "Cap-Haïtien", departement: "Nord", dateNaissance: "1997-12-03",
    parentNom: "André Dumont", parentTel: "+509 42 77 88 99", parentProfession: "Médecin",
    parentAdresse: "Cap-Haïtien 78", promo: "Promotion 2026", statut: "Inscrit",
    dateInscription: "2026-04-05", plan: "Standard", montantPaye: 50000, resteAPayer: 0, totalFormation: 50000,
  },
  {
    id: "ETU-2026-005", nom: "Frantz Louis", prenom: "Frantz", sexe: "Homme",
    tel: "+509 45 77 88 99", email: "frantz@email.com", adresse: "Rue des Fleurs, Jacmel",
    commune: "Jacmel", departement: "Sud", dateNaissance: "1996-06-28",
    parentNom: "Marie Louis", parentTel: "+509 43 88 99 00", parentProfession: "Ingénieur",
    parentAdresse: "Jacmel 34", promo: "Promotion 2025", statut: "Diplômé",
    dateInscription: "2025-09-01", plan: "VIP", montantPaye: 50000, resteAPayer: 0, totalFormation: 50000,
  },
  {
    id: "ETU-2026-006", nom: "Marc Antoine Pierre", prenom: "Marc", sexe: "Homme",
    tel: "+509 46 99 00 11", email: "marc@email.com", adresse: "Avenue des Palmiers, Gonaïves",
    commune: "Gonaïves", departement: "Artibonite", dateNaissance: "1999-03-14",
    parentNom: "Lucie Pierre", parentTel: "+509 44 00 11 22", parentProfession: "Entrepreneur",
    parentAdresse: "Gonaïves 56", promo: "Promotion 2026", statut: "Inscrit",
    dateInscription: "2026-05-20", plan: "Standard", montantPaye: 18000, resteAPayer: 32000, totalFormation: 50000,
  },
];

const MOCK_PAIEMENTS = [
  { id: "PAY-001", date: "2026-06-01", etudiantId: "ETU-2026-001", etudiantNom: "Pierre Antoine", montant: 5000, mode: "MonCash", ref: "REF-12345", agent: "Admin", statut: "Validé", recu: "RECU-2026-0001" },
  { id: "PAY-002", date: "2026-05-15", etudiantId: "ETU-2026-002", etudiantNom: "Marie Joseph", montant: 25000, mode: "Virement bancaire", ref: "VIR-67890", agent: "Admin", statut: "Validé", recu: "RECU-2026-0002" },
  { id: "PAY-003", date: "2026-04-20", etudiantId: "ETU-2026-003", etudiantNom: "Jameson Pierre", montant: 5000, mode: "Espèces", ref: "ESP-11111", agent: "Admin", statut: "Validé", recu: "RECU-2026-0003" },
  { id: "PAY-004", date: "2026-03-10", etudiantId: "ETU-2026-004", etudiantNom: "Mireille Dumont", montant: 25000, mode: "MonCash", ref: "REF-22222", agent: "Admin", statut: "Validé", recu: "RECU-2026-0004" },
  { id: "PAY-005", date: "2026-06-05", etudiantId: "ETU-2026-006", etudiantNom: "Marc Antoine Pierre", montant: 18000, mode: "NatCash", ref: "REF-33333", agent: "Admin", statut: "Validé", recu: "RECU-2026-0005" },
];

const MOCK_PAYMENT_METHODS = [
  { id: 1, code: "moncash", name: "MonCash", is_active: true, is_online: false },
  { id: 2, code: "natcash", name: "NatCash", is_active: true, is_online: false },
  { id: 3, code: "bank_transfer", name: "Virement bancaire", is_active: true, is_online: false },
  { id: 4, code: "cash", name: "Espèces", is_active: true, is_online: false },
  { id: 5, code: "mobile_money", name: "Mobile Money", is_active: true, is_online: false },
];

// ------------------------------------------
// ÉTAT DE L'APPLICATION
// ------------------------------------------
let etudiants = [];
let paiements = [];
let coursesDisponibles = [];
let classesDisponibles = [];
let studentsIndex = {};

let currentPage = "etudiants";
let nextMatricule = 13;
let currentRecuData = null;
let currentDetailEtudiantId = null;
let currentModifEtudiantId = null;

let API_DISPONIBLE = false;

let paymentMethodsCache = [];
let currentInvoiceForEncaissement = null;

const STATUT_API_VERS_UI = {
  pending: "Pré-inscrit",
  approved: "Inscrit",
  active: "Inscrit",
  validated: "Diplômé",
  suspended: "Suspendu",
  rejected: "Rejeté",
};
const STATUT_UI_VERS_TRANSITION = {
  Suspendu: "suspended",
  Diplômé: "validated",
  Inscrit: "active",
};

// ==========================================
// CHARGEMENT DES DONNÉES (API réelle avec repli mock)
// ==========================================
async function chargerDonnees() {
  const [inscriptionsR, classesR, preInscripR] = await Promise.allSettled([
    InscriptionsAPI.list(),
    ClassesAPI.list(),
    typeof PreInscriptionsAPI !== "undefined" ? PreInscriptionsAPI.list() : Promise.resolve([]),
  ]);

  if (inscriptionsR.status === "rejected") {
    console.error("GET /enrollments/inscriptions/ a échoué :", inscriptionsR.reason);
  }
  if (classesR.status === "rejected") {
    console.error("GET /students/classes/ a échoué :", classesR.reason);
  }
  if (preInscripR.status === "rejected") {
    console.error("GET /enrollments/pre-inscriptions/ a échoué :", preInscripR.reason);
  }

  if (inscriptionsR.status === "fulfilled") {
    API_DISPONIBLE = true;
    etudiants = (inscriptionsR.value || []).map(mapInscriptionToEtudiant);
    
    // Add pre-inscriptions
    const preInscriptions = (preInscripR.status === "fulfilled" ? (preInscripR.value || []) : []).map(mapPreInscriptionToEtudiant);
    etudiants = etudiants.concat(preInscriptions);

    paiements = [];
    await enrichirDetailsEtudiants(etudiants);
    paiements = await chargerPaiementsAPI();
  } else {
    console.warn("Utilisation des données locales - API non prête");
    API_DISPONIBLE = false;
    etudiants = MOCK_ETUDIANTS.map((e) => ({ ...e }));
    paiements = MOCK_PAIEMENTS.map((p) => ({ ...p }));
  }

  classesDisponibles =
    classesR.status === "fulfilled" && classesR.value?.length
      ? classesR.value
      : [
          { id: 1, name: "Entrepreneuriat 1", specialization_name: "Entrepreneuriat", tuition_fee: 50000 },
        ];

  // Fusionne la file d'attente hors-ligne locale
  OfflineQueue.read().forEach((item) => {
    if (!etudiants.some((e) => e.id === item.local_uuid)) {
      etudiants.push({
        id: item.local_uuid,
        nom: item.nomAffiche?.split(" ").slice(1).join(" ") || "(hors-ligne)",
        prenom: item.nomAffiche?.split(" ")[0] || "",
        tel: item.telAffiche || "",
        promo: "Promotion 2026",
        statut: "Pré-inscrit",
        offline: true,
        montantPaye: 0,
        resteAPayer: item.feesAmount || 50000,
        totalFormation: item.feesAmount || 50000,
        dateInscription: item.requested_at?.slice(0, 10) || "",
      });
    }
  });
}

/**
 * 🔧 FIX #3 — enrichit chaque étudiant avec les données personnelles
 * (adresse, sexe, date de naissance, contact d'urgence) absentes de
 * InscriptionSerializer, via GET /students/students/<studentId>/.
 * Best-effort et parallélisé : un échec individuel n'affecte que
 * l'étudiant concerné (log en console, valeurs par défaut conservées).
 */
async function enrichirDetailsEtudiants(list) {
  if (!API_DISPONIBLE) return;
  const results = await Promise.allSettled(
    list.map((e) => (e.studentId ? StudentsAPI.get(e.studentId) : Promise.reject("no studentId")))
  );

  results.forEach((res, i) => {
    if (res.status !== "fulfilled" || !res.value) {
      if (list[i].studentId) {
        console.warn(`GET /students/students/${list[i].studentId}/ a échoué`, res.reason);
      }
      return;
    }
    const student = res.value;
    studentsIndex[student.id] = student;
    const e = list[i];

    e.sexe = student.sexe || student.gender || e.sexe || "N/A";
    e.dateNaissance = student.date_of_birth || e.dateNaissance || "";
    if (typeof student.address === "string" && student.address) {
      const parts = student.address.split(",").map((s) => s.trim());
      e.adresse = parts[0] || e.adresse;
      e.commune = parts[1] || e.commune;
      e.departement = parts[2] || e.departement;
    }
    const contact = Array.isArray(student.emergency_contacts) ? student.emergency_contacts[0] : null;
    if (contact) {
      e.parentNom = contact.name || e.parentNom;
      e.parentTel = contact.phone || e.parentTel;
      e.parentProfession = contact.profession || e.parentProfession;
      e.parentAdresse = contact.address || e.parentAdresse;
    }
  });
}

/**
 * Convertit un objet Inscription renvoyé par l'API en objet "étudiant"
 * consommé par l'UI existante.
 */
function mapInscriptionToEtudiant(insc) {
  const feesRaw = insc.tuition_fee ?? insc.fees_amount;
  const fees = feesRaw != null && feesRaw !== "" ? Number(feesRaw) : 50000;

  const amountPaid = insc.amount_paid != null ? Number(insc.amount_paid) : 0;
  const balanceDue = insc.balance_due != null ? Number(insc.balance_due) : fees;

  return {
    id: insc.id ?? insc.local_uuid,
    matricule: insc.id,
    nom: insc.student_last_name || "—",
    prenom: insc.student_first_name || "",
    sexe: "Homme",
    tel: insc.student_phone || "",
    email: insc.student_email || "",
    adresse: "",
    commune: "",
    departement: "Ouest",
    dateNaissance: "",
    parentNom: "",
    parentTel: "",
    parentProfession: "",
    parentAdresse: "",
    classe: insc.class_name || insc.course_name || "",
    filiere: insc.specialization_name || "",
    promo: insc.academic_year ? `Promotion ${insc.academic_year}` : "Promotion 2026",
    statut: STATUT_API_VERS_UI[insc.status] || "Pré-inscrit",
    statutApi: insc.status,
    dateInscription: (insc.requested_at || insc.created_at || "").slice(0, 10),
    plan: "Standard",
    montantPaye: amountPaid,
    resteAPayer: balanceDue,
    totalFormation: fees,
    school_class_id: typeof insc.school_class === "number" ? insc.school_class : null,
    courseId: typeof insc.course === "number" ? insc.course : null,
    studentId: typeof insc.student === "number" ? insc.student : null,
    userId: insc.student_user_id || null,
    synced: insc.synced !== false,
  };
}

function mapPreInscriptionToEtudiant(pre) {
  return {
    id: pre.id,
    matricule: pre.reference,
    nom: pre.nom || "—",
    prenom: pre.prenom || "",
    sexe: "N/A", // We don't ask for gender in pre-inscription
    tel: pre.telephone || "",
    email: pre.email || "",
    adresse: pre.adresse || "",
    commune: pre.commune || "",
    departement: pre.departement || "",
    dateNaissance: pre.date_naissance || "",
    parentNom: "",
    parentTel: "",
    parentProfession: "",
    parentAdresse: "",
    classe: pre.programme || "",
    filiere: "",
    promo: "Promotion 2026",
    statut: pre.status === "converted" ? "Inscrit" : "Pré-inscrit",
    statutApi: pre.status,
    dateInscription: (pre.created_at || "").slice(0, 10),
    plan: "Standard",
    montantPaye: 0,
    resteAPayer: 0,
    totalFormation: 0,
    school_class_id: null,
    courseId: null,
    studentId: null,
    userId: null,
    synced: true,
    is_pre_inscription: true,
  };
}

async function chargerPaiementsAPI() {
  try {
    const payments = await FinanceAPI.listPayments();
    return (payments || []).map((p) => {
      const etudiant = etudiants.find((e) => String(e.studentId) === String(p.student));
      if (!etudiant) return null;
      return {
        id: p.id,
        date: (p.paid_at || p.created_at || "").slice(0, 10),
        etudiantId: etudiant.id,
        etudiantNom: `${etudiant.prenom} ${etudiant.nom}`,
        montant: Number(p.amount) || 0,
        mode: p.payment_method?.name || "—",
        ref: p.reference || "—",
        agent: "Administration",
        statut: p.status === "completed" ? "Validé" : p.status,
        recu: p.receipt?.receipt_number || "En cours",
      };
    }).filter(Boolean);
  } catch (err) {
    console.warn("Impossible de charger l'historique des paiements", err);
    return [];
  }
}

// ==========================================
// UTILITAIRES
// ==========================================
function formatPrix(m) {
  return (m || 0).toLocaleString("fr-FR") + " HTG";
}

function showToast(msg, type = "success") {
  const icons = { success: "fa-check-circle", error: "fa-times-circle", info: "fa-info-circle" };
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<i class="fas ${icons[type]}"></i> ${msg}`;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(100px)";
    el.style.transition = "all .3s";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function openModal(id) { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }

document.querySelectorAll(".modal-overlay").forEach((m) => {
  m.addEventListener("click", function (e) { if (e.target === this) this.classList.remove("open"); });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") document.querySelectorAll(".modal-overlay.open").forEach((m) => m.classList.remove("open"));
});

function navigateTo(page) {
  document.querySelectorAll("#navTabs button").forEach((b) => b.classList.remove("active"));
  const btn = document.querySelector(`#navTabs button[data-page="${page}"]`);
  if (btn) btn.classList.add("active");
  currentPage = page;
  document.getElementById("breadcrumbCurrent").textContent =
    page === "etudiants" ? "Étudiants" :
    page === "paiements" ? "Paiements" :
    page === "dettes" ? "Dettes" :
    page === "recus" ? "Reçus" : "Inscription & Encaissement";
  renderPage(page);
}

document.querySelectorAll("#navTabs button").forEach((btn) => {
  btn.addEventListener("click", function () { navigateTo(this.dataset.page); });
});

// ==========================================
// BANNIÈRE DE STATUT RÉSEAU / SYNCHRONISATION
// ==========================================
function updateStatusBanner() {
  const banner = document.getElementById("syncStatusBanner");
  if (!banner) return;
  const pending = OfflineQueue.count();

  if (!API_DISPONIBLE) {
    banner.style.display = "flex";
    banner.className = "sync-banner sync-banner-warning";
    banner.innerHTML = `<i class="fas fa-plug"></i> Mode démo : API backend non joignable, données locales affichées.`;
    return;
  }
  if (!navigator.onLine || pending > 0) {
    banner.style.display = "flex";
    banner.className = "sync-banner sync-banner-warning";
    banner.innerHTML = `<i class="fas fa-wifi"></i> ${pending} inscription(s) en attente de synchronisation
            <button class="btn btn-sm btn-outline" style="margin-left:10px" onclick="forcerSynchronisation()">
                <i class="fas fa-sync"></i> Synchroniser
            </button>`;
    return;
  }
  banner.style.display = "none";
}

async function forcerSynchronisation() {
  showToast("Synchronisation en cours...", "info");
  const res = await OfflineQueue.sync();
  if (res.offline) {
    showToast("Toujours hors-ligne, réessai plus tard", "error");
  } else {
    showToast(`${res.synced} inscription(s) synchronisée(s), ${res.errors} erreur(s)`, res.errors ? "error" : "success");
    await chargerDonnees();
    renderPage(currentPage);
  }
  updateStatusBanner();
}

window.addEventListener("online", updateStatusBanner);
window.addEventListener("offline", updateStatusBanner);

// ==========================================
// FONCTIONS KPIs PAR SECTION
// ==========================================
function getSectionKpis(section) {
  const totalEtudiants = etudiants.length;
  const actifs = etudiants.filter((e) => e.statut === "Inscrit").length;
  const suspendus = etudiants.filter((e) => e.statut === "Suspendu").length;
  const diplomes = etudiants.filter((e) => e.statut === "Diplômé").length;
  const totalEncaisse = etudiants.reduce((s, e) => s + e.montantPaye, 0);
  const resteAPayer = etudiants.reduce((s, e) => s + e.resteAPayer, 0);
  const debiteurs = etudiants.filter((e) => e.resteAPayer > 0).length;
  const totalPaiements = paiements.length;
  const paiementsCeMois = paiements.filter((p) => p.date >= "2026-06-01").length;
  const moyenneTransaction = totalPaiements > 0 ? Math.round(totalEncaisse / totalPaiements) : 0;

  switch (section) {
    case "etudiants":
      return `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Total Étudiants</span><h3>${totalEtudiants}</h3></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-user-graduate"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Actifs</span><h3>${actifs}</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Suspendus</span><h3>${suspendus}</h3></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-pause-circle"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Diplômés</span><h3>${diplomes}</h3></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-graduation-cap"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Payé Total</span><h3>${formatPrix(totalEncaisse)}</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-coins"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Reste à Payer</span><h3>${formatPrix(resteAPayer)}</h3></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-hand-holding-usd"></i></div></div>
            </div>`;

    case "paiements":
      return `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Total Encaissé</span><h3>${formatPrix(totalEncaisse)}</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-coins"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Transactions</span><h3>${totalPaiements}</h3></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-exchange-alt"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Ce Mois</span><h3>${paiementsCeMois}</h3></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-calendar-check"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Moy/Transaction</span><h3>${formatPrix(moyenneTransaction)}</h3></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-chart-bar"></i></div></div>
            </div>`;

    case "dettes":
      const critiques = etudiants.filter((e) => e.resteAPayer > 0 && e.montantPaye < e.totalFormation * 0.3).length;
      const tauxRecouvrement = totalEncaisse + resteAPayer > 0 ? Math.round((totalEncaisse / (totalEncaisse + resteAPayer)) * 100) : 100;
      return `
            <div class="stats-grid">
                <div class="stat-card" style="border-left:4px solid var(--red)"><div class="stat-info"><span>Débiteurs</span><h3>${debiteurs}</h3></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-users-slash"></i></div></div>
                <div class="stat-card" style="border-left:4px solid var(--red)"><div class="stat-info"><span>Total Impayés</span><h3>${formatPrix(resteAPayer)}</h3></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-hand-holding-usd"></i></div></div>
                <div class="stat-card" style="border-left:4px solid var(--orange)"><div class="stat-info"><span>Critiques</span><h3>${critiques}</h3></div><div class="stat-icon" style="color:var(--orange)"><i class="fas fa-exclamation-triangle"></i></div></div>
                <div class="stat-card" style="border-left:4px solid var(--success)"><div class="stat-info"><span>Taux Recouvrement</span><h3>${tauxRecouvrement}%</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-percentage"></i></div></div>
            </div>`;

    case "recus":
      const recusCeMois = paiements.filter((p) => p.date >= "2026-06-01").length;
      const monCash = paiements.filter((p) => p.mode === "MonCash").length;
      const especes = paiements.filter((p) => p.mode === "Espèces").length;
      return `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Total Reçus</span><h3>${totalPaiements}</h3></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-receipt"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Reçus/Mois</span><h3>${recusCeMois}</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-calendar-alt"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>MonCash</span><h3>${monCash}</h3></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-mobile-alt"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Espèces</span><h3>${especes}</h3></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-money-bill"></i></div></div>
            </div>`;

    default:
      return "";
  }
}

// ==========================================
// FONCTIONS ACTIONS ÉTUDIANTS
// ==========================================
function voirDetailsEtudiant(id) {
  const e = etudiants.find((x) => String(x.id) === String(id));
  if (!e) { showToast("Étudiant non trouvé", "error"); return; }
  currentDetailEtudiantId = id;
  const paiementsEtudiant = paiements.filter((p) => p.etudiantId === id);
  const pct = e.totalFormation ? Math.round((e.montantPaye / e.totalFormation) * 100) : 0;
  const statutColor =
    e.statut === "Inscrit" ? "var(--success)" :
    e.statut === "Suspendu" ? "var(--warning)" :
    e.statut === "Diplômé" ? "var(--info)" : "var(--muted)";

  document.getElementById("detailsEtudiantContent").innerHTML = `
        <div style="text-align:center;margin-bottom:16px;">
            <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--blue-dark));margin:0 auto;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:1.5rem">${(e.prenom || "?").charAt(0)}${(e.nom || "?").charAt(0)}</div>
            <h3 style="margin-top:8px;font-weight:700;">${e.prenom} ${e.nom}</h3>
            <span class="pill" style="background:${statutColor};color:white;">${e.statut}</span>
            ${e.plan === "VIP" ? '<span class="badge-vip">VIP</span>' : ""}
            ${e.offline ? '<span class="pill pill-warning" style="margin-left:6px"><i class="fas fa-cloud-upload-alt"></i> Non synchronisé</span>' : ""}
        </div>
        <div class="detail-grid">
            <div class="detail-item"><label>Matricule</label><span>${e.id}</span></div>
            <div class="detail-item"><label>Date inscription</label><span>${e.dateInscription}</span></div>
            <div class="detail-item"><label>Sexe</label><span>${e.sexe}</span></div>
            <div class="detail-item"><label>Date naissance</label><span>${e.dateNaissance || "N/A"}</span></div>
            <div class="detail-item"><label>Téléphone</label><span>${e.tel}</span></div>
            <div class="detail-item"><label>Email</label><span>${e.email || "N/A"}</span></div>
            <div class="detail-item" style="grid-column:1/-1"><label>Adresse</label><span>${e.adresse || ""}, ${e.commune || ""}, ${e.departement || ""}</span></div>
            <div class="detail-item"><label>Responsable</label><span>${e.parentNom || "N/A"}</span></div>
            <div class="detail-item"><label>Tél. Responsable</label><span>${e.parentTel || "N/A"}</span></div>
            <div class="detail-item"><label>Profession</label><span>${e.parentProfession || "N/A"}</span></div>
            <div class="detail-item"><label>Adresse resp.</label><span>${e.parentAdresse || "N/A"}</span></div>
            <div class="detail-item"><label>Promotion</label><span>${e.promo}</span></div>
            <div class="detail-item"><label>Plan</label><span>${e.plan}</span></div>
            <div class="detail-item"><label>Total formation</label><span>${formatPrix(e.totalFormation)}</span></div>
            <div class="detail-item"><label>Déjà payé</label><span style="color:var(--success)">${formatPrix(e.montantPaye)}</span></div>
            <div class="detail-item"><label>Reste à payer</label><span style="color:var(--red)">${formatPrix(e.resteAPayer)}</span></div>
            <div class="detail-item" style="grid-column:1/-1">
                <label>Progression paiement</label>
                <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                    <div style="flex:1;height:8px;background:#e5e7eb;border-radius:10px;overflow:hidden">
                        <div style="width:${pct}%;height:100%;background:${pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--red)"};border-radius:10px;"></div>
                    </div>
                    <span style="font-weight:700;font-size:.8rem;">${pct}%</span>
                </div>
            </div>
            ${!e.offline ? `
            <div class="detail-item" style="grid-column:1/-1">
                <label>Statut du dossier (backend)</label>
                <div class="btn-group" style="margin-top:6px;flex-wrap:wrap">
                    ${e.statutApi === "pending" ? `<button class="btn btn-sm btn-success" onclick="approuverInscription('${e.id}')"><i class="fas fa-check"></i> Approuver</button>
                    <button class="btn btn-sm btn-danger" onclick="rejeterInscription('${e.id}')"><i class="fas fa-times"></i> Rejeter</button>` : ""}
                    ${e.statutApi === "approved" ? `<button class="btn btn-sm btn-primary" onclick="transitionerInscription('${e.id}','active')"><i class="fas fa-play"></i> Activer</button>` : ""}
                    ${e.statutApi === "active" ? `<button class="btn btn-sm btn-outline" onclick="transitionerInscription('${e.id}','suspended')"><i class="fas fa-pause"></i> Suspendre</button>
                    <button class="btn btn-sm btn-info" onclick="transitionerInscription('${e.id}','validated')"><i class="fas fa-graduation-cap"></i> Valider (diplômer)</button>` : ""}
                    ${e.statutApi === "suspended" ? `<button class="btn btn-sm btn-primary" onclick="transitionerInscription('${e.id}','active')"><i class="fas fa-play"></i> Réactiver</button>` : ""}
                    ${e.is_pre_inscription && e.statutApi !== "converted" ? `<button class="btn btn-sm btn-success" onclick="ouvrirModalConversion('${e.id}')"><i class="fas fa-user-check"></i> Convertir en Inscription</button>` : ""}
                </div>
            </div>` : ""}
            ${paiementsEtudiant.length > 0 ? `
            <div class="detail-item" style="grid-column:1/-1">
                <label>Derniers paiements</label>
                <div style="margin-top:4px;">
                    ${paiementsEtudiant.slice(-3).reverse().map((p) => `
                        <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border-light);font-size:.75rem;">
                            <span>${p.date}</span>
                            <span>${p.mode}</span>
                            <span style="color:var(--success);font-weight:600;">${formatPrix(p.montant)}</span>
                        </div>
                    `).join("")}
                </div>
            </div>` : ""}
        </div>
    `;
  openModal("detailsEtudiantModal");
}

// ------------------------------------------
// Actions de workflow (approve / reject / transition)
// ------------------------------------------
async function approuverInscription(id) {
  if (!API_DISPONIBLE) { showToast("Action indisponible en mode démo", "error"); return; }
  try {
    await InscriptionsAPI.approve(id);
    showToast("Inscription approuvée", "success");
    await chargerDonnees();
    closeModal("detailsEtudiantModal");
    renderPage(currentPage);
  } catch (err) {

    showToast("Erreur lors de l'approbation : " + (err.detail?.detail || err.message), "error");
  }
}

async function rejeterInscription(id) {
  if (!API_DISPONIBLE) { showToast("Action indisponible en mode démo", "error"); return; }
  const reason = prompt("Motif du rejet :");
  if (!reason) return;
  try {
    await InscriptionsAPI.reject(id, reason);
    showToast("Inscription rejetée", "info");
    await chargerDonnees();
    closeModal("detailsEtudiantModal");
    renderPage(currentPage);
  } catch (err) {

    showToast("Erreur lors du rejet : " + (err.detail?.detail || err.message), "error");
  }
}

async function transitionerInscription(id, targetStatus) {
  if (!API_DISPONIBLE) { showToast("Action indisponible en mode démo", "error"); return; }
  try {
    await InscriptionsAPI.transition(id, targetStatus);
    showToast("Statut mis à jour", "success");
    await chargerDonnees();
    closeModal("detailsEtudiantModal");
    renderPage(currentPage);
  } catch (err) {

    showToast("Transition refusée : " + (err.detail?.detail || err.message), "error");
  }
}

let preInscriptionToConvertId = null;

function ouvrirModalConversion(id) {
  const e = etudiants.find((x) => String(x.id) === String(id));
  if (!e) return;
  preInscriptionToConvertId = id;

  const nomEl = document.getElementById("convertEtudiantNom");
  if (nomEl) nomEl.textContent = `Étudiant : ${e.prenom} ${e.nom} (${e.matricule || e.id})`;

  const select = document.getElementById("convertClasseSelect");
  if (select) {
    select.innerHTML = classesDisponibles.map((c) =>
      `<option value="${c.id}">${c.name}${c.specialization_name ? " — " + c.specialization_name : ""}${c.tuition_fee ? " (" + Number(c.tuition_fee).toLocaleString("fr-FR") + " HTG)" : ""}</option>`
    ).join("");
  }

  openModal("convertModal");
}

async function executerConversionPreInscription() {
  if (!preInscriptionToConvertId) return;
  if (!API_DISPONIBLE) { showToast("Action indisponible en mode démo", "error"); return; }

  const select = document.getElementById("convertClasseSelect");
  const classId = select ? Number(select.value) || null : null;

  try {
    const btn = document.getElementById("btnConfirmerConversion");
    if (btn) btn.disabled = true;

    const res = await PreInscriptionsAPI.convert(preInscriptionToConvertId, { class_id: classId });
    showToast("Pré-inscription convertie et inscrite en classe avec succès !", "success");
    closeModal("convertModal");
    closeModal("detailsEtudiantModal");
    await chargerDonnees();
    renderPage(currentPage);
  } catch (err) {
    showToast("Erreur lors de la conversion : " + (err.detail?.detail || err.message), "error");
  } finally {
    const btn = document.getElementById("btnConfirmerConversion");
    if (btn) btn.disabled = false;
    preInscriptionToConvertId = null;
  }
}

function ouvrirModifierEtudiant(id) {
  const e = etudiants.find((x) => String(x.id) === String(id));
  if (!e) { showToast("Étudiant non trouvé", "error"); return; }
  currentModifEtudiantId = id;

  document.getElementById("modMatricule").value = e.id;
  document.getElementById("modNom").value = e.nom;
  document.getElementById("modPrenom").value = e.prenom;
  document.getElementById("modSexe").value = e.sexe;
  document.getElementById("modDateNaissance").value = e.dateNaissance || "";
  document.getElementById("modTel").value = e.tel;
  document.getElementById("modEmail").value = e.email || "";
  document.getElementById("modAdresse").value = e.adresse || "";
  document.getElementById("modCommune").value = e.commune || "";
  document.getElementById("modDepartement").value = e.departement || "Ouest";
  document.getElementById("modParentNom").value = e.parentNom || "";
  document.getElementById("modParentTel").value = e.parentTel || "";
  document.getElementById("modParentProfession").value = e.parentProfession || "";
  document.getElementById("modParentAdresse").value = e.parentAdresse || "";
  document.getElementById("modPromotion").value = e.promo;
  document.getElementById("modStatut").value = e.statut;
  document.getElementById("modPlan").value = e.plan;
  document.getElementById("modTotalFormation").value = e.totalFormation;
  document.getElementById("modMontantPaye").value = e.montantPaye;

  openModal("modifierEtudiantModal");
}

async function sauvegarderModifications() {
  const id = currentModifEtudiantId;
  const e = etudiants.find((x) => String(x.id) === String(id));
  if (!e) return;

  const nom = document.getElementById("modNom").value;
  const prenom = document.getElementById("modPrenom").value;
  if (!nom || !prenom) { showToast("Le nom et le prénom sont obligatoires", "error"); inscriptionEnregistrementEnCours = false; return; }

  e.nom = nom;
  e.prenom = prenom;
  e.sexe = document.getElementById("modSexe").value;
  e.dateNaissance = document.getElementById("modDateNaissance").value;
  e.tel = document.getElementById("modTel").value;
  e.email = document.getElementById("modEmail").value;
  e.adresse = document.getElementById("modAdresse").value;
  e.commune = document.getElementById("modCommune").value;
  e.departement = document.getElementById("modDepartement").value;
  e.parentNom = document.getElementById("modParentNom").value;
  e.parentTel = document.getElementById("modParentTel").value;
  e.parentProfession = document.getElementById("modParentProfession").value;
  e.parentAdresse = document.getElementById("modParentAdresse").value;
  e.promo = document.getElementById("modPromotion").value;
  e.statut = document.getElementById("modStatut").value;
  e.plan = document.getElementById("modPlan").value;
  e.totalFormation = parseInt(document.getElementById("modTotalFormation").value) || 50000;
  e.montantPaye = parseInt(document.getElementById("modMontantPaye").value) || 0;
  e.resteAPayer = e.totalFormation - e.montantPaye;

  paiements.forEach((p) => {
    if (p.etudiantId === id) p.etudiantNom = e.prenom + " " + e.nom;
  });

  if (API_DISPONIBLE) {
    if (e.is_pre_inscription) {
      try {
        await PreInscriptionsAPI.update(e.id, {
          nom: e.nom,
          prenom: e.prenom,
          sexe: e.sexe,
          date_naissance: e.dateNaissance || null,
          telephone: e.tel,
          email: e.email,
          adresse: e.adresse,
          commune: e.commune,
          departement: e.departement,
          promotion: e.promo,
        });
      } catch (err) {
        console.warn("PATCH /enrollments/pre-inscriptions/ a échoué", err);
      }
    } else {
      if (e.userId) {
        try {
          await apiFetch(`/auth/users/${e.userId}/`, {
            method: "PATCH",
            body: { first_name: prenom, last_name: nom, phone: e.tel },
          });
        } catch (err) {
          console.warn("PATCH /auth/users/ a échoué, modification gardée en local uniquement", err);
        }
      }
      if (e.studentId) {
        try {
          await apiFetch(`/students/students/${e.studentId}/`, {
            method: "PATCH",
            body: {
              date_of_birth: e.dateNaissance || null,
              address: [e.adresse, e.commune, e.departement].filter(Boolean).join(", "),
              emergency_contacts: [{
                name: e.parentNom, phone: e.parentTel,
                profession: e.parentProfession, address: e.parentAdresse,
              }],
            },
          });
        } catch (err) {
          console.warn("PATCH /students/students/ a échoué", err);
        }
      }
    }
  }

  closeModal("modifierEtudiantModal");
  renderPage("etudiants");
  showToast("Modifications enregistrées avec succès", "success");
}

async function supprimerEtudiant() {
  const id = currentModifEtudiantId;
  const etudiant = etudiants.find((x) => String(x.id) === String(id));

  if (!confirm(`Voulez-vous vraiment supprimer cet enregistrement (${id}) ? Cette action est irréversible.`)) return;

  const estIdBackendReel = API_DISPONIBLE && !String(id).includes("-");

  if (estIdBackendReel) {
    if (etudiant?.is_pre_inscription) {
      try {
        await PreInscriptionsAPI.delete(id);
      } catch (err) {
        console.error("DELETE /enrollments/pre-inscriptions/ a échoué :", err);
        showToast("Échec de la suppression : " + (err.detail?.detail || err.message), "error");
        return;
      }
    } else {
      if (!etudiant?.userId) {
        showToast("Impossible de supprimer : identifiant utilisateur introuvable côté API", "error");
        return;
      }
      try {
        await apiFetch(`/auth/users/${etudiant.userId}/`, { method: "DELETE" });
      } catch (err) {
        console.error("DELETE /auth/users/ a échoué :", err);
        showToast("Échec de la suppression côté serveur : " + (err.detail?.detail || err.message), "error");
        return;
      }
      try {
        await InscriptionsAPI.delete(id);
      } catch (err) {
        console.error("DELETE inscription failed:", err);
      }
    }
  }

  const index = etudiants.findIndex((x) => x.id === id);
  if (index >= 0) etudiants.splice(index, 1);

  for (let i = paiements.length - 1; i >= 0; i--) {
    if (paiements[i].etudiantId === id) paiements.splice(i, 1);
  }

  closeModal("modifierEtudiantModal");
  renderPage("etudiants");
  showToast("Supprimé avec succès", "info");
}

function imprimerFicheEtudiantPOS() {
  const id = currentDetailEtudiantId;
  const e = etudiants.find((x) => String(x.id) === String(id));
  if (!e) return;

  const printArea = document.getElementById("pos-print-area");
  printArea.innerHTML = `
        <div style="font-family:'Courier New',monospace;font-size:10px;">
            <div style="text-align:center;">
                <div style="font-size:16px;font-weight:bold;">C E J E C</div>
                <div style="font-size:8px;">Centre d'Études des Jeunes en Entrepreneuriat</div>
                <div style="font-size:10px;font-weight:bold;margin:8px 0;">FICHE ÉTUDIANT</div>
            </div>
            <div class="pos-divider"></div>
            <div class="pos-receipt-row"><span>Matricule:</span><span>${e.id}</span></div>
            <div class="pos-receipt-row"><span>Nom:</span><span>${e.prenom} ${e.nom}</span></div>
            <div class="pos-receipt-row"><span>Sexe:</span><span>${e.sexe}</span></div>
            <div class="pos-receipt-row"><span>Né(e) le:</span><span>${e.dateNaissance || "N/A"}</span></div>
            <div class="pos-receipt-row"><span>Tél:</span><span>${e.tel}</span></div>
            <div class="pos-receipt-row"><span>Email:</span><span>${e.email || "N/A"}</span></div>
            <div class="pos-receipt-row"><span>Adresse:</span><span>${e.adresse || "N/A"}</span></div>
            <div class="pos-receipt-row"><span>Commune:</span><span>${e.commune || "N/A"}</span></div>
            <div class="pos-divider"></div>
            <div class="pos-receipt-row"><span>Responsable:</span><span>${e.parentNom || "N/A"}</span></div>
            <div class="pos-receipt-row"><span>Tél resp.:</span><span>${e.parentTel || "N/A"}</span></div>
            <div class="pos-divider"></div>
            <div class="pos-receipt-row"><span>Formation:</span><span>Entrepreneuriat</span></div>
            <div class="pos-receipt-row"><span>Promotion:</span><span>${e.promo}</span></div>
            <div class="pos-receipt-row"><span>Statut:</span><span>${e.statut}</span></div>
            <div class="pos-receipt-row"><span>Plan:</span><span>${e.plan}</span></div>
            <div class="pos-divider"></div>
            <div class="pos-receipt-row"><span>Total formation:</span><span>${formatPrix(e.totalFormation)}</span></div>
            <div class="pos-receipt-row"><span>Payé:</span><span>${formatPrix(e.montantPaye)}</span></div>
            <div class="pos-receipt-row"><span>Reste à payer:</span><span>${formatPrix(e.resteAPayer)}</span></div>
            <div class="pos-divider"></div>
            <div style="text-align:center;font-size:8px;margin-top:8px;">Date: ${new Date().toLocaleDateString("fr-FR")}</div>
            <div style="text-align:center;font-size:8px;margin-top:12px;">Signature / Cachet</div>
        </div>
    `;
  printArea.style.display = "block";
  window.print();
  printArea.style.display = "none";
  showToast("Fiche envoyée à l'imprimante POS-80", "info");
}

// ==========================================
// MODALS
// ==========================================
function openInscriptionModal() {
  document.getElementById("matricule").value = "ETU-2026-" + String(nextMatricule).padStart(3, "0");
  document.getElementById("dateInscription").value = new Date().toISOString().split("T")[0];
  peuplerSelectFormation();
  openModal("inscriptionModal");
}

function openPreInscriptionModal() {
  document.getElementById("preNom").value = "";
  document.getElementById("prePrenom").value = "";
  document.getElementById("preTel").value = "";
  document.getElementById("preEmail").value = "";
  document.getElementById("preAdresse").value = "";
  document.getElementById("preCommune").value = "";
  document.getElementById("preDateNaissance").value = "";
  openModal("preInscriptionModal");
}

async function savePreInscription() {
  const nom = document.getElementById("preNom").value.trim();
  const prenom = document.getElementById("prePrenom").value.trim();
  const tel = document.getElementById("preTel").value.trim();

  if (!nom || !prenom || !tel) {
    showToast("Le nom, le prénom et le téléphone sont obligatoires", "error");
    return;
  }

  const payload = {
    nom,
    prenom,
    sexe: document.getElementById("preSexe").value,
    date_naissance: document.getElementById("preDateNaissance").value || null,
    telephone: tel,
    email: document.getElementById("preEmail").value.trim(),
    adresse: document.getElementById("preAdresse").value.trim(),
    commune: document.getElementById("preCommune").value.trim(),
    departement: document.getElementById("preDepartement").value,
    programme: document.getElementById("preProgramme").value.trim() || "Entrepreneuriat",
    promotion: document.getElementById("prePromotion").value,
    date_inscription: new Date().toISOString().split("T")[0],
  };

  if (API_DISPONIBLE) {
    try {
      await PreInscriptionsAPI.create(payload);
      showToast("Pré-inscription enregistrée avec succès", "success");
      closeModal("preInscriptionModal");
      await chargerDonnees();
      renderPage(currentPage);
    } catch (err) {
      showToast("Erreur lors de l'enregistrement : " + (err.detail?.detail || err.message), "error");
    }
  } else {
    const fakeRef = "PRE-2026-" + String(Math.floor(1000 + Math.random() * 9000));
    etudiants.push({
      id: fakeRef,
      matricule: fakeRef,
      nom,
      prenom,
      sexe: payload.sexe,
      tel,
      email: payload.email,
      adresse: payload.adresse,
      commune: payload.commune,
      departement: payload.departement,
      dateNaissance: payload.date_naissance,
      parentNom: "",
      parentTel: "",
      parentProfession: "",
      parentAdresse: "",
      classe: payload.programme,
      filiere: "",
      promo: payload.promotion,
      statut: "Pré-inscrit",
      statutApi: "new",
      dateInscription: payload.date_inscription,
      plan: "Standard",
      montantPaye: 0,
      resteAPayer: 0,
      totalFormation: 0,
      is_pre_inscription: true,
    });
    closeModal("preInscriptionModal");
    renderPage(currentPage);
    showToast("Pré-inscription ajoutée (mode démo)", "success");
  }
}

function peuplerSelectFormation() {
  const select = document.getElementById("classeSelect");
  if (!select) return;
  select.innerHTML = classesDisponibles.map((c) =>
    `<option value="${c.id}">${c.name}${c.specialization_name ? " — " + c.specialization_name : ""}${c.tuition_fee ? " (" + Number(c.tuition_fee).toLocaleString("fr-FR") + " HTG)" : ""}</option>`
  ).join("");
}

function iconePaiement(pm) {
  const icons = {
    moncash: "📱", natcash: "📲", bank_transfer: "🏦", cash: "💵",
    mobile_money: "📶", stripe: "💳", paypal: "🅿️",
  };
  return icons[pm.code] || "💰";
}

async function peuplerSelectModePaiement() {
  const select = document.getElementById("modePaiement");
  if (!select) return;

  if (API_DISPONIBLE) {
    try {
      const methods = await FinanceAPI.listPaymentMethods();
      paymentMethodsCache = (methods || []).filter((pm) => pm.is_active && !pm.is_online);
      if (paymentMethodsCache.length === 0) showToast("Aucun moyen de paiement actif configuré", "error");
    } catch (err) {
      console.warn("Impossible de charger les moyens de paiement, repli sur la liste locale", err);
      paymentMethodsCache = MOCK_PAYMENT_METHODS;
    }
  } else {
    paymentMethodsCache = MOCK_PAYMENT_METHODS;
  }

  select.innerHTML = paymentMethodsCache.map((pm) =>
    `<option value="${pm.id}">${iconePaiement(pm)} ${pm.name}</option>`
  ).join("");
}

async function resoudreInvoicePourEtudiant(etudiant) {
  currentInvoiceForEncaissement = null;
  if (!API_DISPONIBLE) return;

  if (!etudiant.studentId) {
    showToast("Impossible de retrouver la facture (étudiant sans compte lié) : le paiement restera local", "error");
    return;
  }

  try {
    const invoices = await FinanceAPI.listInvoices(etudiant.studentId);
    if (!invoices || invoices.length === 0) {
      showToast(`Aucune facture trouvée pour ${etudiant.prenom} ${etudiant.nom} : le paiement restera local`, "error");
      return;
    }
    currentInvoiceForEncaissement = invoices.find((inv) => (inv.balance_due ?? 0) > 0) || invoices[0];
  } catch (err) {
    console.warn("Impossible de charger la facture de l'étudiant", err);
    showToast(`Impossible de charger la facture de ${etudiant.prenom} ${etudiant.nom} : le paiement restera local`, "error");
  }
}

function openEncaissementModal(etudiantId = null) {
  const select = document.getElementById("encEtudiant");
  const debiteurs = etudiants.filter((e) => e.resteAPayer > 0 && e.statutApi !== "pending");

  select.innerHTML = debiteurs.map((e) =>
    `<option value="${e.id}" ${etudiantId === e.id ? "selected" : ""}>${e.prenom} ${e.nom} (${e.id})</option>`
  ).join("");

  (async () => {
    await peuplerSelectModePaiement();
    if (etudiantId) await updateEncaissementForm(etudiantId);
    else if (debiteurs.length > 0) await updateEncaissementForm(debiteurs[0].id);
  })();

  select.onchange = () => updateEncaissementForm(select.value);
  openModal("encaissementModal");
}

async function updateEncaissementForm(etudiantId) {
  const e = etudiants.find((x) => String(x.id) === String(etudiantId));
  if (!e) return;

  let total = e.totalFormation;
  let paye = e.montantPaye;
  let reste = e.resteAPayer;

  await resoudreInvoicePourEtudiant(e);

  if (currentInvoiceForEncaissement) {
    total = Number(currentInvoiceForEncaissement.amount) || total;
    paye = currentInvoiceForEncaissement.amount_paid != null ? Number(currentInvoiceForEncaissement.amount_paid) : paye;
    reste = currentInvoiceForEncaissement.balance_due != null ? Number(currentInvoiceForEncaissement.balance_due) : reste;
    e.totalFormation = total;
    e.montantPaye = paye;
    e.resteAPayer = reste;
  }

  document.getElementById("encTotalFormation").value = formatPrix(total);
  document.getElementById("encDejaPaye").value = formatPrix(paye);
  document.getElementById("encSoldeRestant").value = formatPrix(reste);
  document.getElementById("montantVerse").value = Math.min(5000, reste);
  document.getElementById("datePaiement").value = new Date().toISOString().split("T")[0];
}

let inscriptionEnregistrementEnCours = false;

async function saveInscription() {
  if (inscriptionEnregistrementEnCours) return;
  inscriptionEnregistrementEnCours = true;
  const nom = document.getElementById("nom").value.trim();
  const prenom = document.getElementById("prenom").value.trim();
  if (!nom || !prenom) { showToast("Le nom et le prénom sont obligatoires", "error"); inscriptionEnregistrementEnCours = false; return; }

  const tel = document.getElementById("tel").value.trim();
  const classeSelect = document.getElementById("classeSelect");
  const classeId = classeSelect ? Number(classeSelect.value) || null : null;
  const classeChoisie = classesDisponibles.find((c) => Number(c.id) === classeId);

  if (!classeId) { showToast("Veuillez sélectionner une classe", "error"); inscriptionEnregistrementEnCours = false; return; }

  const dateInscription = document.getElementById("dateInscription").value;
  const requestedAt = dateInscription ? new Date(dateInscription).toISOString() : new Date().toISOString();

  if (!API_DISPONIBLE) {
    etudiants.push(construireEtudiantLocal());
    nextMatricule++;
    closeModal("inscriptionModal");
    renderPage("etudiants");
    showToast("Étudiant inscrit (mode démo, non synchronisé)", "success");
    inscriptionEnregistrementEnCours = false;
    return;
  }

  if (!navigator.onLine) {
    const localUuid = generateLocalUuid();
    OfflineQueue.push({
      local_uuid: localUuid, student: null, school_class: classeId,
      requested_at: requestedAt, created_offline: true,
      nomAffiche: `${prenom} ${nom}`, telAffiche: tel,
      first_name: prenom, last_name: nom, phone: tel,
      feesAmount: classeChoisie?.tuition_fee || 50000,
    });
    closeModal("inscriptionModal");
    showToast("Hors-ligne : inscription mise en file d'attente, sera synchronisée automatiquement", "info");
    await chargerDonnees();
    renderPage("etudiants");
    updateStatusBanner();
    inscriptionEnregistrementEnCours = false;
    return;
  }

  try {
    const userRes = await AuthAPI.registerStudent({
      first_name: prenom, last_name: nom, phone: tel,
      password: genererMotDePasseTemporaire(),
    });
    // 🔧 FIX #6 — extraction défensive au lieu de `userRes.user?.student_id`
    // qui échouait silencieusement si la forme réelle de la réponse était
    // différente (voir extractStudentId() dans api-client.js).
    const studentId = extractStudentId(userRes);

    if (!studentId) {
      showToast("Erreur: impossible de récupérer l'ID étudiant depuis le serveur (voir la console pour la réponse brute)", "error");
      inscriptionEnregistrementEnCours = false;
      return;
    }

    // Le compte est créé par /auth/users/register/. On sauvegarde ensuite
    // toutes les données saisies sur la fiche Student, avant l'inscription.
    await StudentsAPI.update(studentId, {
      date_of_birth: document.getElementById("dateNaissance").value || null,
      address: [
        document.getElementById("adresse").value.trim(),
        document.getElementById("commune").value.trim(),
        document.getElementById("departement").value.trim(),
      ].filter(Boolean).join(", "),
      emergency_contacts: document.getElementById("parentNom").value.trim() || document.getElementById("parentTel").value.trim()
        ? [{
            name: document.getElementById("parentNom").value.trim() || "Contact d'urgence",
            relationship: document.getElementById("parentProfession").value.trim(),
            phone: document.getElementById("parentTel").value.trim() || tel,
          }]
        : [],
    });
    // 🔧 FIX #1 appliqué automatiquement ici : InscriptionsAPI.create() ne
    // passe plus jamais local_uuid: null.
    await InscriptionsAPI.create({
      student: studentId,
      school_class: classeId,
      requested_at: requestedAt,
      created_offline: false,
    });

    nextMatricule++;
    closeModal("inscriptionModal");
    await chargerDonnees();
    renderPage("etudiants");
    showToast("Étudiant inscrit avec succès dans la classe " + (classeChoisie?.name || ""), "success");
    inscriptionEnregistrementEnCours = false;
  } catch (err) {
    if (err.message === "NETWORK_ERROR") {
      const localUuid = generateLocalUuid();
      OfflineQueue.push({
        local_uuid: localUuid, student: null, school_class: classeId,
        requested_at: requestedAt, created_offline: true,
        nomAffiche: `${prenom} ${nom}`, telAffiche: tel,
        first_name: prenom, last_name: nom, phone: tel,
        feesAmount: classeChoisie?.tuition_fee || 50000,
      });
      closeModal("inscriptionModal");
      showToast("Connexion perdue : inscription mise en file d'attente", "info");
      renderPage("etudiants");
      updateStatusBanner();
    } else {
      // 🔧 Le détail complet de l'erreur 400 est maintenant loggé dans
      // apiFetch() lui-même (voir api-client.js), donc plus besoin de
      // deviner : ouvrez la console pour voir exactement quel champ le
      // backend a refusé.
      showToast("Erreur API : " + (err.detail ? JSON.stringify(err.detail) : err.message), "error");
      inscriptionEnregistrementEnCours = false;
    }
  }

  function construireEtudiantLocal() {
    return {
      id: document.getElementById("matricule").value, nom, prenom,
      sexe: document.getElementById("sexe").value, tel,
      adresse: document.getElementById("adresse").value,
      commune: document.getElementById("commune").value,
      departement: document.getElementById("departement").value,
      dateNaissance: document.getElementById("dateNaissance").value,
      parentNom: document.getElementById("parentNom").value,
      parentTel: document.getElementById("parentTel").value,
      parentProfession: document.getElementById("parentProfession").value,
      parentAdresse: document.getElementById("parentAdresse").value,
      promo: document.getElementById("promotion").value,
      statut: document.getElementById("statut").value,
      classe: classeChoisie?.name || "", filiere: classeChoisie?.specialization_name || "",
      dateInscription, plan: "Standard", montantPaye: 0,
      resteAPayer: classeChoisie?.tuition_fee || 50000,
      totalFormation: classeChoisie?.tuition_fee || 50000,
    };
  }
}

async function validerPaiement() {
  const etudiantId = document.getElementById("encEtudiant").value;
  const montant = Number(document.getElementById("montantVerse").value) || 0;
  const modeSelect = document.getElementById("modePaiement");
  const modeId = modeSelect.value;
  const modeLabel = modeSelect.selectedOptions[0]?.textContent || modeId;
  const ref = document.getElementById("refTransaction").value;
  const date = document.getElementById("datePaiement").value;
  const observation = document.getElementById("observation").value;

  if (montant <= 0) { showToast("Veuillez entrer un montant valide", "error"); return; }

  const etudiant = etudiants.find((e) => String(e.id) === String(etudiantId));
  if (!etudiant) { console.error("Impossible de trouver l'étudiant avec l'ID", etudiantId); return; }

  if (montant > etudiant.resteAPayer) { showToast("Le montant dépasse le solde restant", "error"); return; }

  const paiementId = "PAY-" + String(paiements.length + 1).padStart(3, "0");
  const recuId = "RECU-2026-" + String(Math.floor(1000 + Math.random() * 9000));

  if (API_DISPONIBLE) {
    if (!currentInvoiceForEncaissement) {
      showToast(`Aucune facture liée à ${etudiant.prenom} ${etudiant.nom} : paiement enregistré localement seulement, non transmis au backend`, "error");
    } else {
      try {
        await FinanceAPI.addPayment({
          invoice: currentInvoiceForEncaissement.id,
          amount: montant,
          payment_method: modeId,
          reference: ref,
          payment_date: date,
        });
      } catch (err) {
        console.warn("Échec de l'enregistrement du paiement côté API, conservé localement uniquement", err);
        showToast("Échec de l'enregistrement côté serveur (" + (err.detail ? JSON.stringify(err.detail) : err.message) + ") : paiement gardé localement seulement", "error");
        return;
      }
    }
  }

  paiements.push({
    id: paiementId, date: date, etudiantId: etudiantId,
    etudiantNom: etudiant.prenom + " " + etudiant.nom, montant: montant,
    mode: modeLabel, ref: ref, agent: "Admin", statut: "Validé",
    recu: recuId, observation: observation,
  });

  etudiant.montantPaye = Math.min(etudiant.totalFormation, etudiant.montantPaye + montant);
  etudiant.resteAPayer = Math.max(0, etudiant.totalFormation - etudiant.montantPaye);

  currentRecuData = {
    recuId: recuId, paiementId: paiementId, date: date, etudiantId: etudiantId,
    etudiantNom: etudiant.prenom + " " + etudiant.nom, montant: montant,
    mode: modeLabel, ref: ref, observation: observation,
    soldeRestant: etudiant.resteAPayer, totalFormation: etudiant.totalFormation,
    montantPayeTotal: etudiant.montantPaye,
  };

  closeModal("encaissementModal");
  genererRecuContent();
  openModal("recuModal");
  renderPage(currentPage);
  showToast("Paiement validé avec succès", "success");
}

function genererRecu() {
  const etudiantId = document.getElementById("encEtudiant").value;
  const etudiant = etudiants.find((e) => String(e.id) === String(etudiantId));
  if (!etudiant) return;

  const modeSelect = document.getElementById("modePaiement");
  const modeLabel = modeSelect.selectedOptions[0]?.textContent || modeSelect.value;

  currentRecuData = {
    recuId: "RECU-2026-" + String(Math.floor(1000 + Math.random() * 9000)),
    paiementId: "PAY-PREVIEW", date: document.getElementById("datePaiement").value,
    etudiantId: etudiantId, etudiantNom: etudiant.prenom + " " + etudiant.nom,
    montant: parseInt(document.getElementById("montantVerse").value) || 0,
    mode: modeLabel, ref: document.getElementById("refTransaction").value,
    observation: document.getElementById("observation").value,
    soldeRestant: etudiant.resteAPayer, totalFormation: etudiant.totalFormation,
    montantPayeTotal: etudiant.montantPaye,
  };

  genererRecuContent();
  openModal("recuModal");
}

function genererRecuContent() {
  if (!currentRecuData) return;
  const d = currentRecuData;
  document.getElementById("recuContent").innerHTML = `
        <div class="payslip-header">
            <div style="text-align:center;margin-bottom:8px">
                <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--blue-dark));margin:0 auto;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:1.2rem">CE</div>
            </div>
            <div class="payslip-logo">CEJEC</div>
            <div style="font-size:.7rem;color:var(--muted)">Centre d'Études des Jeunes en Entrepreneuriat et Commerce</div>
            <div class="payslip-title">Reçu de Paiement</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">
            <div><div style="font-size:.65rem;color:var(--muted)">N° Reçu</div><div style="font-weight:700">${d.recuId}</div></div>
            <div><div style="font-size:.65rem;color:var(--muted)">Date</div><div style="font-weight:700">${d.date}</div></div>
            <div><div style="font-size:.65rem;color:var(--muted)">Étudiant</div><div style="font-weight:700">${d.etudiantNom}</div></div>
            <div><div style="font-size:.65rem;color:var(--muted)">Matricule</div><div style="font-weight:700">${d.etudiantId}</div></div>
        </div>
        <div class="payslip-row"><span>Montant versé</span><span style="font-weight:700;color:var(--success)">${formatPrix(d.montant)}</span></div>
        <div class="payslip-row"><span>Mode de paiement</span><span>${d.mode}</span></div>
        <div class="payslip-row"><span>Référence</span><span>${d.ref || "N/A"}</span></div>
        <div class="payslip-row"><span>Total payé</span><span style="font-weight:600">${formatPrix(d.montantPayeTotal)} / ${formatPrix(d.totalFormation)}</span></div>
        <div class="payslip-total">
            <div><div class="payslip-total-label">Solde restant</div></div>
            <div class="payslip-total-amount" style="color:${d.soldeRestant > 0 ? "var(--red)" : "var(--success)"}">${formatPrix(d.soldeRestant)}</div>
        </div>
    `;
}

function imprimerRecuThermique() {
  if (!currentRecuData) { showToast("Aucune donnée de reçu disponible", "error"); return; }
  const d = currentRecuData;
  const printArea = document.getElementById("pos-print-area");
  printArea.innerHTML = `
        <div style="font-family:'Courier New',monospace;font-size:10px;">
            <div class="pos-receipt-header">
                <div class="logo">C E J E C</div>
                <div style="font-size:8px;">Centre d'Études des Jeunes</div>
                <div style="font-size:8px;">en Entrepreneuriat et Commerce</div>
                <div style="font-size:7px;margin-top:2px;">Port-au-Prince, Haiti</div>
                <div style="font-size:7px;">contact@cejec.edu.ht</div>
            </div>
            <div class="pos-divider"></div>
            <div style="text-align:center;font-weight:bold;margin:4px 0;">REÇU DE PAIEMENT</div>
            <div class="pos-divider"></div>
            <div class="pos-receipt-row"><span>No Reçu:</span><span>${d.recuId}</span></div>
            <div class="pos-receipt-row"><span>Date:</span><span>${d.date}</span></div>
            <div class="pos-receipt-row"><span>Étudiant:</span><span>${d.etudiantNom}</span></div>
            <div class="pos-receipt-row"><span>Matricule:</span><span>${d.etudiantId}</span></div>
            <div class="pos-divider"></div>
            <div class="pos-receipt-row"><span>Montant versé:</span><span>${formatPrix(d.montant)}</span></div>
            <div class="pos-receipt-row"><span>Mode:</span><span>${d.mode}</span></div>
            <div class="pos-receipt-row"><span>Réf:</span><span>${d.ref || "N/A"}</span></div>
            <div class="pos-receipt-row"><span>Total payé:</span><span>${formatPrix(d.montantPayeTotal)} / ${formatPrix(d.totalFormation)}</span></div>
            <div class="pos-divider"></div>
            <div class="pos-total pos-receipt-row"><span>SOLDE RESTANT:</span><span>${formatPrix(d.soldeRestant)}</span></div>
            <div class="pos-divider"></div>
            <div style="text-align:center;font-size:8px;margin-top:6px;">Merci de votre confiance!</div>
            <div style="text-align:center;font-size:7px;">${d.observation ? "Note: " + d.observation : ""}</div>
            <div style="text-align:center;font-size:7px;margin-top:12px;">Signature / Cachet</div>
        </div>
    `;
  printArea.style.display = "block";
  window.print();
  printArea.style.display = "none";
  showToast("Impression envoyée à l'imprimante POS-80", "info");
}

function telechargerRecuPDF() {
  if (!currentRecuData) { showToast("Aucune donnée de reçu disponible", "error"); return; }

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
    const d = currentRecuData;
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    doc.setFillColor(10, 77, 140);
    doc.rect(0, 0, pageW, 25, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("CEJEC", 15, 15);
    doc.setFontSize(7);
    doc.text("Centre d'Études des Jeunes en Entrepreneuriat et Commerce", 15, 20);

    doc.setTextColor(31, 41, 55);
    doc.setFontSize(14);
    y = 35;
    doc.text("REÇU DE PAIEMENT", 15, y);
    y += 8;
    doc.setFontSize(9);
    doc.text(`No: ${d.recuId}`, 15, y);
    doc.text(`Date: ${d.date}`, pageW - 15, y, { align: "right" });
    y += 10;

    doc.setDrawColor(229, 231, 235);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("INFORMATIONS ÉTUDIANT", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Nom: ${d.etudiantNom}`, 15, y); y += 5;
    doc.text(`Matricule: ${d.etudiantId}`, 15, y); y += 8;

    doc.setDrawColor(229, 231, 235);
    doc.line(15, y, pageW - 15, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.text("DÉTAIL DU PAIEMENT", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    const details = [
      ["Montant versé:", formatPrix(d.montant)],
      ["Mode de paiement:", d.mode],
      ["Référence:", d.ref || "N/A"],
      ["Total payé:", `${formatPrix(d.montantPayeTotal)} / ${formatPrix(d.totalFormation)}`],
    ];
    details.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, 15, y);
      doc.setFont("helvetica", "normal");
      doc.text(value, pageW - 15, y, { align: "right" });
      y += 5;
    });

    y += 8;
    doc.setFillColor(10, 77, 140);
    doc.roundedRect(15, y, pageW - 30, 12, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`SOLDE RESTANT: ${formatPrix(d.soldeRestant)}`, pageW / 2, y + 8, { align: "center" });

    y += 20;
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(7);
    doc.text("Merci de votre confiance en CEJEC!", pageW / 2, y, { align: "center" });
    doc.text("contact@cejec.edu.ht | Port-au-Prince, Haiti", pageW / 2, y + 4, { align: "center" });

    doc.save(`CEJEC_${d.recuId}.pdf`);
    showToast("Reçu téléchargé en PDF", "success");
  } catch (e) {
    showToast("Erreur lors du téléchargement du PDF", "error");
    console.error(e);
  }
}

function exportListePDF() {
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Liste Étudiants - CEJEC", 14, 20);
    doc.autoTable({ html: "table", startY: 30 });
    doc.save("liste_etudiants_cejec.pdf");
    showToast("PDF exporté", "success");
  } catch (e) {
    showToast("Erreur export PDF", "error");
  }
}

// ==========================================
// RENDU DES PAGES
// ==========================================
function renderPage(page) {
  const mc = document.getElementById("mainContent");
  updateStatusBanner();
  switch (page) {
    case "etudiants": mc.innerHTML = renderEtudiants(); break;
    case "paiements": mc.innerHTML = renderPaiements(); break;
    case "dettes": mc.innerHTML = renderDettes(); break;
    case "recus": mc.innerHTML = renderRecus(); break;
    case "frais": mc.innerHTML = renderTuitionFeesPage(); renderTuitionFees(); break;
    default: mc.innerHTML = renderEtudiants();
  }
}

function renderTuitionFeesPage() { return `<div class="card"><div class="card-header"><h2><i class="fas fa-coins"></i> Frais de scolarité par classe</h2><button class="btn btn-primary" onclick="openTuitionFeesModal()"><i class="fas fa-edit"></i> Gérer les frais</button></div><div class="table-wrap"><table><thead><tr><th>Classe</th><th>Spécialisation</th><th>Frais (HTG)</th><th>Actions</th></tr></thead><tbody id="tuitionFeesRows"></tbody></table></div></div>`; }

function renderEtudiants() {
  let rows = etudiants.map((e) => {
    const statutPill =
      e.statut === "Inscrit" ? "pill-success" :
      e.statut === "Suspendu" ? "pill-warning" :
      e.statut === "Diplômé" ? "pill-info" : "pill-muted";
    return `<tr>
            <td><span class="pill pill-muted">${e.id}</span> ${e.offline ? '<i class="fas fa-cloud-upload-alt" style="color:var(--warning)" title="Non synchronisé"></i>' : ""}</td>
            <td style="font-weight:600">${e.prenom} ${e.nom}</td>
            <td>${e.tel}</td>
            <td>${e.promo}</td>
            <td><span class="pill ${statutPill}">${e.statut}</span></td>
            <td style="color:var(--success);font-weight:600">${formatPrix(e.montantPaye)}</td>
            <td style="color:var(--red);font-weight:600">${formatPrix(e.resteAPayer)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline btn-icon" title="Voir détails" onclick="voirDetailsEtudiant('${e.id}')"><i class="fas fa-eye"></i></button>
                    ${e.is_pre_inscription && e.statutApi !== "converted" ? `<button class="btn btn-sm btn-success btn-icon" title="Convertir en inscription" onclick="ouvrirModalConversion('${e.id}')"><i class="fas fa-user-check"></i></button>` : ""}
                    <button class="btn btn-sm btn-outline btn-icon" title="Modifier" onclick="ouvrirModifierEtudiant('${e.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline btn-icon" title="Imprimer fiche" onclick="currentDetailEtudiantId='${e.id}';imprimerFicheEtudiantPOS()"><i class="fas fa-print"></i></button>
                    ${e.resteAPayer > 0 && e.statutApi !== "pending" && !e.is_pre_inscription ? `<button class="btn btn-sm btn-success btn-icon" title="Encaisser" onclick="openEncaissementModal('${e.id}')"><i class="fas fa-money-bill-wave"></i></button>` : ""}
                </div>
            </td>
        </tr>`;
  }).join("");

  return `
    ${getSectionKpis("etudiants")}
    <div class="filters-row">
        <div class="search-box"><i class="fas fa-search"></i><input placeholder="Rechercher..." oninput="filterEtudiants(this.value)"></div>
        <select class="filter-select" onchange="filterByStatut(this.value)">
            <option value="tous">Tous les statuts</option>
            <option value="Inscrit">Actifs</option>
            <option value="Suspendu">Suspendus</option>
            <option value="Diplômé">Diplômés</option>
            <option value="Pré-inscrit">Pré-inscrits</option>
        </select>
        <select class="filter-select" onchange="filterByPromo(this.value)">
            <option value="tous">Toutes les promotions</option>
            <option>Promotion 2026</option>
            <option>Promotion 2025</option>
            <option>Promotion 2027</option>
        </select>
    </div>
    <div class="card">
        <div class="card-header">
            <h2><i class="fas fa-user-graduate"></i> Liste des Étudiants</h2>
            <span class="pill pill-info">${etudiants.length} étudiants</span>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Matricule</th>
                        <th>Nom complet</th>
                        <th>Téléphone</th>
                        <th>Promotion</th>
                        <th>Statut</th>
                        <th>Payé</th>
                        <th>Reste</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody id="etudiantTbody">${rows}</tbody>
            </table>
        </div>
    </div>`;
}

function filterEtudiants(val) {
  const tbody = document.getElementById("etudiantTbody");
  if (!tbody) return;
  tbody.querySelectorAll("tr").forEach((tr) => {
    tr.style.display = tr.innerText.toLowerCase().includes(val.toLowerCase()) ? "" : "none";
  });
}

function filterByStatut(val) {
  const tbody = document.getElementById("etudiantTbody");
  if (!tbody) return;
  tbody.querySelectorAll("tr").forEach((tr) => {
    const pills = tr.querySelectorAll(".pill");
    const statutPill = Array.from(pills).find((p) =>
      ["Inscrit", "Suspendu", "Diplômé", "Pré-inscrit"].some((s) => p.innerText.includes(s))
    );
    tr.style.display = val === "tous" || (statutPill && statutPill.innerText.includes(val)) ? "" : "none";
  });
}

function filterByPromo(val) {
  const tbody = document.getElementById("etudiantTbody");
  if (!tbody) return;
  tbody.querySelectorAll("tr").forEach((tr) => {
    tr.style.display = val === "tous" || tr.innerText.includes(val) ? "" : "none";
  });
}

function renderPaiements() {
  let rows = paiements.slice().reverse().map((p) => `
        <tr>
            <td>${p.date}</td>
            <td>${p.etudiantNom}</td>
            <td style="font-weight:600;color:var(--success)">${formatPrix(p.montant)}</td>
            <td><span class="pill pill-info">${p.mode}</span></td>
            <td>${p.ref}</td>
            <td>${p.agent}</td>
            <td><span class="pill pill-success">${p.statut}</span></td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline" onclick="voirRecuPaiement('${p.id}')" title="Voir reçu"><i class="fas fa-receipt"></i> Voir</button>
                    <button class="btn btn-sm btn-outline" onclick="imprimerRecuDepuisPaiement('${p.id}')" title="Imprimer POS-80"><i class="fas fa-print"></i> Pos-80</button>
                    <button class="btn btn-sm btn-outline" onclick="telechargerRecuDepuisPaiement('${p.id}')" title="PDF"><i class="fas fa-file-pdf"></i> PDF</button>
                </div>
            </td>
        </tr>
    `).join("");

  return `
    ${getSectionKpis("paiements")}
    <div class="card">
        <div class="card-header">
            <h2><i class="fas fa-history"></i> Historique des Paiements</h2>
            <span class="pill pill-info">${paiements.length} transactions</span>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Étudiant</th>
                        <th>Montant</th>
                        <th>Mode</th>
                        <th>Référence</th>
                        <th>Agent</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
}

function voirRecuPaiement(paiementId) {
  const p = paiements.find((x) => x.id === paiementId);
  if (!p) return;
  const e = etudiants.find((x) => String(x.id) === String(p.etudiantId));
  if (!e) return;

  currentRecuData = {
    recuId: p.recu, paiementId: p.id, date: p.date, etudiantId: p.etudiantId,
    etudiantNom: p.etudiantNom, montant: p.montant, mode: p.mode, ref: p.ref,
    observation: p.observation || "", soldeRestant: e.resteAPayer,
    totalFormation: e.totalFormation, montantPayeTotal: e.montantPaye,
  };

  genererRecuContent();
  openModal("recuModal");
}

function imprimerRecuDepuisPaiement(paiementId) {
  const p = paiements.find((x) => x.id === paiementId);
  if (!p) return;
  const e = etudiants.find((x) => String(x.id) === String(p.etudiantId));
  if (!e) return;

  currentRecuData = {
    recuId: p.recu, paiementId: p.id, date: p.date, etudiantId: p.etudiantId,
    etudiantNom: p.etudiantNom, montant: p.montant, mode: p.mode, ref: p.ref,
    observation: p.observation || "", soldeRestant: e.resteAPayer,
    totalFormation: e.totalFormation, montantPayeTotal: e.montantPaye,
  };

  imprimerRecuThermique();
}

function telechargerRecuDepuisPaiement(paiementId) {
  const p = paiements.find((x) => x.id === paiementId);
  if (!p) return;
  const e = etudiants.find((x) => String(x.id) === String(p.etudiantId));
  if (!e) return;

  currentRecuData = {
    recuId: p.recu, paiementId: p.id, date: p.date, etudiantId: p.etudiantId,
    etudiantNom: p.etudiantNom, montant: p.montant, mode: p.mode, ref: p.ref,
    observation: p.observation || "", soldeRestant: e.resteAPayer,
    totalFormation: e.totalFormation, montantPayeTotal: e.montantPaye,
  };

  telechargerRecuPDF();
}

function renderDettes() {
  const debiteurs = etudiants.filter((e) => e.resteAPayer > 0 && e.statutApi !== "pending");

  let rows = debiteurs.map((e) => {
    const pct = e.totalFormation ? Math.round((e.montantPaye / e.totalFormation) * 100) : 0;
    const color = pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--red)";
    const statutText = pct >= 80 ? "À jour" : pct >= 50 ? "Partiel" : "En retard";
    const statutClass = pct >= 80 ? "pill-success" : pct >= 50 ? "pill-warning" : "pill-danger";

    return `<tr>
            <td style="font-weight:600">${e.prenom} ${e.nom} ${e.plan === "VIP" ? '<span class="badge-vip">VIP</span>' : ""}</td>
            <td>${e.promo}</td>
            <td>${formatPrix(e.montantPaye)}</td>
            <td style="color:var(--red);font-weight:600">${formatPrix(e.resteAPayer)}</td>
            <td>
                <div style="display:flex;align-items:center;gap:8px;min-width:120px">
                    <span style="font-size:.7rem;font-weight:600">${pct}%</span>
                    <div style="flex:1;height:6px;background:#e5e7eb;border-radius:10px;overflow:hidden">
                        <div style="width:${pct}%;height:100%;background:${color};border-radius:10px"></div>
                    </div>
                </div>
            </td>
            <td><span class="pill ${statutClass}">${statutText}</span></td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline" onclick="showToast('Rappel WhatsApp envoyé','info')"><i class="fab fa-whatsapp"></i></button>
                    <button class="btn btn-sm btn-outline" onclick="showToast('Email envoyé','info')"><i class="fas fa-envelope"></i></button>
                    <button class="btn btn-sm btn-success" onclick="openEncaissementModal('${e.id}')"><i class="fas fa-money-bill-wave"></i> Encaisser</button>
                </div>
            </td>
        </tr>`;
  }).join("");

  return `
    ${getSectionKpis("dettes")}
    
    <div class="card">
        <div class="card-header">
            <h2><i class="fas fa-exclamation-triangle"></i> Gestion des Dettes</h2>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline" onclick="showToast('Rappels envoyés à tous les débiteurs','info')"><i class="fas fa-bell"></i> Relancer tous</button>
                <button class="btn btn-sm btn-outline" onclick="exportListePDF()"><i class="fas fa-file-pdf"></i> Exporter</button>
            </div>
        </div>
        
        <div class="debtor-grid" style="margin-bottom:16px">
            ${debiteurs.slice(0, 3).map((e) => {
              const pct = e.totalFormation ? Math.round((e.montantPaye / e.totalFormation) * 100) : 0;
              return `
                <div class="debtor-card" onclick="openEncaissementModal('${e.id}')">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start">
                        <div>
                            <div class="card-name">${e.prenom} ${e.nom} ${e.plan === "VIP" ? '<span class="badge-vip">VIP</span>' : ""}</div>
                            <div class="card-sub">${e.id} · ${e.promo}</div>
                        </div>
                    </div>
                    <div class="card-amount">${formatPrix(e.resteAPayer)}</div>
                    <div class="card-sub">restant sur ${formatPrix(e.totalFormation)}</div>
                    <div style="margin-top:8px">
                        <div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--muted);margin-bottom:2px">
                            <span>Progression</span><span>${pct}%</span>
                        </div>
                        <div class="progress-bar-wrap">
                            <div class="progress-bar-fill" style="width:${pct}%;background:${pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--red)"}"></div>
                        </div>
                    </div>
                </div>`;
            }).join("")}
        </div>
        
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Promotion</th>
                        <th>Payé</th>
                        <th>Dû</th>
                        <th>Progression</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    </div>`;
}

function renderRecus() {
  let rows = paiements.slice().reverse().map((p) => `
        <tr>
            <td><strong>${p.recu}</strong></td>
            <td>${p.date}</td>
            <td>${p.etudiantNom}</td>
            <td style="color:var(--success);font-weight:600">${formatPrix(p.montant)}</td>
            <td><span class="pill pill-info">${p.mode}</span></td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline" onclick="voirRecuPaiement('${p.id}')"><i class="fas fa-eye"></i> Voir</button>
                    <button class="btn btn-sm btn-outline" onclick="imprimerRecuDepuisPaiement('${p.id}')"><i class="fas fa-print"></i> Pos-80</button>
                    <button class="btn btn-sm btn-outline" onclick="telechargerRecuDepuisPaiement('${p.id}')"><i class="fas fa-download"></i></button>
                </div>
            </td>
        </tr>
    `).join("");

  return `
    ${getSectionKpis("recus")}
    <div class="card">
        <div class="card-header">
            <h2><i class="fas fa-receipt"></i> Reçus et Factures</h2>
            <button class="btn btn-primary btn-sm" onclick="openEncaissementModal()"><i class="fas fa-plus"></i> Générer reçu</button>
        </div>
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>N° Reçu</th>
                        <th>Date</th>
                        <th>Étudiant</th>
                        <th>Montant</th>
                        <th>Mode</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:20px">Aucun reçu disponible</td></tr>'}</tbody>
            </table>
        </div>
        
        <div style="margin-top:20px;display:grid;grid-template-columns:repeat(4,1fr);gap:10px">
            <button class="btn btn-outline btn-sm" onclick="showToast('Fiche inscription imprimée','info')"><i class="fas fa-print"></i> Fiche inscription</button>
            <button class="btn btn-outline btn-sm" onclick="showToast('Liste débiteurs imprimée','info')"><i class="fas fa-list"></i> Liste débiteurs</button>
            <button class="btn btn-outline btn-sm" onclick="exportListePDF()"><i class="fas fa-chart-bar"></i> Rapport financier</button>
        </div>
    </div>`;
}

// ==========================================
function renderTuitionFees() {
  const rows = document.getElementById("tuitionFeesRows"); if (!rows) return;
  rows.innerHTML = classesDisponibles.map(c => `<tr><td>${c.name || "Classe"}</td><td>${c.specialization_name || "—"}</td><td>${Number(c.tuition_fee || 0).toLocaleString("fr-FR")} HTG</td><td><button class="btn btn-sm btn-outline" onclick="editTuitionFee(${c.id})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-outline" onclick="deleteTuitionFee(${c.id})"><i class="fas fa-trash"></i></button></td></tr>`).join("");
}
function openTuitionFeesModal() { const s=document.getElementById("tuitionFeeClass"); s.innerHTML=classesDisponibles.map(c=>`<option value="${c.id}">${c.name || "Classe"}</option>`).join(""); selectTuitionFeeClass(); renderTuitionFees(); openModal("tuitionFeesModal"); }
function selectTuitionFeeClass() { const id=Number(document.getElementById("tuitionFeeClass").value); const c=classesDisponibles.find(x=>Number(x.id)===id); document.getElementById("tuitionFeeAmount").value=c?.tuition_fee ?? 0; }
function editTuitionFee(id) { document.getElementById("tuitionFeeClass").value=id; selectTuitionFeeClass(); }
async function saveTuitionFee(e) { e.preventDefault(); if(!API_DISPONIBLE) return showToast("Action indisponible en mode démo","error"); const id=Number(document.getElementById("tuitionFeeClass").value), amount=Number(document.getElementById("tuitionFeeAmount").value); try { const updated=await ClassesAPI.update(id,{tuition_fee:amount}); classesDisponibles=classesDisponibles.map(c=>Number(c.id)===id?{...c,...updated}:c); renderTuitionFees(); showToast("Frais de scolarité enregistrés","success"); } catch(err) { showToast(`Erreur : ${err.detail || err.message}`,"error"); } }
async function deleteTuitionFee(id) { if(!API_DISPONIBLE) return showToast("Action indisponible en mode démo","error"); if(!confirm("Supprimer ce montant ? La classe sera conservée avec des frais à 0 HTG.")) return; try { const updated=await ClassesAPI.update(id,{tuition_fee:0}); classesDisponibles=classesDisponibles.map(c=>Number(c.id)===id?{...c,...updated,tuition_fee:0}:c); renderTuitionFees(); selectTuitionFeeClass(); showToast("Frais supprimés","success"); } catch(err) { showToast(`Erreur : ${err.detail || err.message}`,"error"); } }
// INITIALISATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  const mc = document.getElementById("mainContent");
  if (mc) mc.innerHTML = '<div style="text-align:center;padding:60px"><i class="fas fa-spinner fa-spin" style="font-size:2rem"></i><p style="margin-top:10px;color:var(--muted)">Chargement des inscriptions...</p></div>';
  await chargerDonnees();
  await OfflineQueue.sync();
  renderPage("etudiants");
  if (!API_DISPONIBLE) {
    showToast("Backend non joignable : mode démo activé", "info");
  }
});





