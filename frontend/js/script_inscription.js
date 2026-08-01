// ==========================================
// BASE DE DONNÉES CEJEC
// ==========================================
const etudiants = [
    { id:'ETU-2026-001', nom:'Pierre Antoine', prenom:'Pierre', sexe:'Homme', tel:'+509 41 22 33 44', email:'pierre@email.com', adresse:'Rue des Miracles, Delmas', commune:'Delmas', departement:'Ouest', dateNaissance:'1998-05-15', parentNom:'Jean Antoine', parentTel:'+509 40 11 22 33', parentProfession:'Commerçant', parentAdresse:'Delmas 75', promo:'Promotion 2026', statut:'Inscrit', dateInscription:'2026-01-15', plan:'VIP', montantPaye:25000, resteAPayer:25000, totalFormation:50000 },
    { id:'ETU-2026-002', nom:'Marie Joseph', prenom:'Marie', sexe:'Femme', tel:'+509 42 33 44 55', email:'marie@email.com', adresse:'Avenue du Centre, Pétion-Ville', commune:'Pétion-Ville', departement:'Ouest', dateNaissance:'1999-08-22', parentNom:'Paul Joseph', parentTel:'+509 41 22 44 55', parentProfession:'Enseignante', parentAdresse:'Pétion-Ville 45', promo:'Promotion 2026', statut:'Inscrit', dateInscription:'2026-02-01', plan:'Standard', montantPaye:50000, resteAPayer:0, totalFormation:50000 },
    { id:'ETU-2026-003', nom:'Jameson Pierre', prenom:'Jameson', sexe:'Homme', tel:'+509 43 55 66 77', email:'jameson@email.com', adresse:'Boulevard 15 Octobre, Tabarre', commune:'Tabarre', departement:'Ouest', dateNaissance:'2000-01-10', parentNom:'Rose Pierre', parentTel:'+509 40 33 66 77', parentProfession:'Avocat', parentAdresse:'Tabarre 12', promo:'Promotion 2026', statut:'Suspendu', dateInscription:'2026-03-10', plan:'VIP', montantPaye:10000, resteAPayer:40000, totalFormation:50000 },
    { id:'ETU-2026-004', nom:'Mireille Dumont', prenom:'Mireille', sexe:'Femme', tel:'+509 44 66 77 88', email:'mireille@email.com', adresse:'Rue Lamarre, Cap-Haïtien', commune:'Cap-Haïtien', departement:'Nord', dateNaissance:'1997-12-03', parentNom:'André Dumont', parentTel:'+509 42 77 88 99', parentProfession:'Médecin', parentAdresse:'Cap-Haïtien 78', promo:'Promotion 2026', statut:'Inscrit', dateInscription:'2026-04-05', plan:'Standard', montantPaye:50000, resteAPayer:0, totalFormation:50000 },
    { id:'ETU-2026-005', nom:'Frantz Louis', prenom:'Frantz', sexe:'Homme', tel:'+509 45 77 88 99', email:'frantz@email.com', adresse:'Rue des Fleurs, Jacmel', commune:'Jacmel', departement:'Sud', dateNaissance:'1996-06-28', parentNom:'Marie Louis', parentTel:'+509 43 88 99 00', parentProfession:'Ingénieur', parentAdresse:'Jacmel 34', promo:'Promotion 2025', statut:'Diplômé', dateInscription:'2025-09-01', plan:'VIP', montantPaye:50000, resteAPayer:0, totalFormation:50000 },
    { id:'ETU-2026-006', nom:'Marc Antoine Pierre', prenom:'Marc', sexe:'Homme', tel:'+509 46 99 00 11', email:'marc@email.com', adresse:'Avenue des Palmiers, Gonaïves', commune:'Gonaïves', departement:'Artibonite', dateNaissance:'1999-03-14', parentNom:'Lucie Pierre', parentTel:'+509 44 00 11 22', parentProfession:'Entrepreneur', parentAdresse:'Gonaïves 56', promo:'Promotion 2026', statut:'Inscrit', dateInscription:'2026-05-20', plan:'Standard', montantPaye:18000, resteAPayer:32000, totalFormation:50000 }
];

const paiements = [
    { id:'PAY-001', date:'2026-06-01', etudiantId:'ETU-2026-001', etudiantNom:'Pierre Antoine', montant:5000, mode:'MonCash', ref:'REF-12345', agent:'Admin', statut:'Validé', recu:'RECU-2026-0001' },
    { id:'PAY-002', date:'2026-05-15', etudiantId:'ETU-2026-002', etudiantNom:'Marie Joseph', montant:25000, mode:'Virement bancaire', ref:'VIR-67890', agent:'Admin', statut:'Validé', recu:'RECU-2026-0002' },
    { id:'PAY-003', date:'2026-04-20', etudiantId:'ETU-2026-003', etudiantNom:'Jameson Pierre', montant:5000, mode:'Espèces', ref:'ESP-11111', agent:'Admin', statut:'Validé', recu:'RECU-2026-0003' },
    { id:'PAY-004', date:'2026-03-10', etudiantId:'ETU-2026-004', etudiantNom:'Mireille Dumont', montant:25000, mode:'MonCash', ref:'REF-22222', agent:'Admin', statut:'Validé', recu:'RECU-2026-0004' },
    { id:'PAY-005', date:'2026-06-05', etudiantId:'ETU-2026-006', etudiantNom:'Marc Antoine Pierre', montant:18000, mode:'NatCash', ref:'REF-33333', agent:'Admin', statut:'Validé', recu:'RECU-2026-0005' }
];

let currentPage = 'etudiants';
let nextMatricule = 13;
let currentRecuData = null;
let currentDetailEtudiantId = null;
let currentModifEtudiantId = null;

// ==========================================
// UTILITAIRES
// ==========================================
function formatPrix(m) { return (m || 0).toLocaleString('fr-FR') + ' HTG'; }

function showToast(msg, type='success') {
    const icons = { success:'fa-check-circle', error:'fa-times-circle', info:'fa-info-circle' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<i class="fas ${icons[type]}"></i> ${msg}`;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100px)';
        el.style.transition = 'all .3s';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); });
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
});

function navigateTo(page) {
    document.querySelectorAll('#navTabs button').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`#navTabs button[data-page="${page}"]`);
    if (btn) btn.classList.add('active');
    currentPage = page;
    document.getElementById('breadcrumbCurrent').textContent = 
        page === 'etudiants' ? 'Étudiants' :
        page === 'paiements' ? 'Paiements' :
        page === 'dettes' ? 'Dettes' :
        page === 'recus' ? 'Reçus' : 'Inscription & Encaissement';
    renderPage(page);
}

document.querySelectorAll('#navTabs button').forEach(btn => {
    btn.addEventListener('click', function() { navigateTo(this.dataset.page); });
});

// ==========================================
// FONCTIONS KPIs PAR SECTION
// ==========================================
function getSectionKpis(section) {
    const totalEtudiants = etudiants.length;
    const actifs = etudiants.filter(e => e.statut === 'Inscrit').length;
    const suspendus = etudiants.filter(e => e.statut === 'Suspendu').length;
    const diplomes = etudiants.filter(e => e.statut === 'Diplômé').length;
    const totalEncaisse = etudiants.reduce((s, e) => s + e.montantPaye, 0);
    const resteAPayer = etudiants.reduce((s, e) => s + e.resteAPayer, 0);
    const debiteurs = etudiants.filter(e => e.resteAPayer > 0).length;
    const totalPaiements = paiements.length;
    const paiementsCeMois = paiements.filter(p => p.date >= '2026-06-01').length;
    const moyenneTransaction = totalPaiements > 0 ? Math.round(totalEncaisse / totalPaiements) : 0;

    switch(section) {
        case 'etudiants':
            return `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Total Étudiants</span><h3>${totalEtudiants}</h3></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-user-graduate"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Actifs</span><h3>${actifs}</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Suspendus</span><h3>${suspendus}</h3></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-pause-circle"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Diplômés</span><h3>${diplomes}</h3></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-graduation-cap"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Payé Total</span><h3>${formatPrix(totalEncaisse)}</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-coins"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Reste à Payer</span><h3>${formatPrix(resteAPayer)}</h3></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-hand-holding-usd"></i></div></div>
            </div>`;
        
        case 'paiements':
            return `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Total Encaissé</span><h3>${formatPrix(totalEncaisse)}</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-coins"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Transactions</span><h3>${totalPaiements}</h3></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-exchange-alt"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Ce Mois</span><h3>${paiementsCeMois}</h3></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-calendar-check"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Moy/Transaction</span><h3>${formatPrix(moyenneTransaction)}</h3></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-chart-bar"></i></div></div>
            </div>`;
            
        case 'dettes':
            const critiques = etudiants.filter(e => e.resteAPayer > 0 && e.montantPaye < e.totalFormation * 0.3).length;
            const tauxRecouvrement = (totalEncaisse + resteAPayer) > 0 ? Math.round((totalEncaisse / (totalEncaisse + resteAPayer)) * 100) : 100;
            return `
            <div class="stats-grid">
                <div class="stat-card" style="border-left:4px solid var(--red)"><div class="stat-info"><span>Débiteurs</span><h3>${debiteurs}</h3></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-users-slash"></i></div></div>
                <div class="stat-card" style="border-left:4px solid var(--red)"><div class="stat-info"><span>Total Impayés</span><h3>${formatPrix(resteAPayer)}</h3></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-hand-holding-usd"></i></div></div>
                <div class="stat-card" style="border-left:4px solid var(--orange)"><div class="stat-info"><span>Critiques</span><h3>${critiques}</h3></div><div class="stat-icon" style="color:var(--orange)"><i class="fas fa-exclamation-triangle"></i></div></div>
                <div class="stat-card" style="border-left:4px solid var(--success)"><div class="stat-info"><span>Taux Recouvrement</span><h3>${tauxRecouvrement}%</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-percentage"></i></div></div>
            </div>`;
            
        case 'recus':
            const recusCeMois = paiements.filter(p => p.date >= '2026-06-01').length;
            const monCash = paiements.filter(p => p.mode === 'MonCash').length;
            const especes = paiements.filter(p => p.mode === 'Espèces').length;
            return `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Total Reçus</span><h3>${totalPaiements}</h3></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-receipt"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Reçus/Mois</span><h3>${recusCeMois}</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-calendar-alt"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>MonCash</span><h3>${monCash}</h3></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-mobile-alt"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Espèces</span><h3>${especes}</h3></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-money-bill"></i></div></div>
            </div>`;
            
        default:
            return '';
    }
}

// ==========================================
// FONCTIONS ACTIONS ÉTUDIANTS
// ==========================================
function voirDetailsEtudiant(id) {
    const e = etudiants.find(x => x.id === id);
    if (!e) {
        showToast('Étudiant non trouvé', 'error');
        return;
    }
    currentDetailEtudiantId = id;
    const paiementsEtudiant = paiements.filter(p => p.etudiantId === id);
    const pct = Math.round((e.montantPaye / e.totalFormation) * 100);
    const statutColor = e.statut === 'Inscrit' ? 'var(--success)' : e.statut === 'Suspendu' ? 'var(--warning)' : e.statut === 'Diplômé' ? 'var(--info)' : 'var(--muted)';

    document.getElementById('detailsEtudiantContent').innerHTML = `
        <div style="text-align:center;margin-bottom:16px;">
            <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,var(--blue),var(--blue-dark));margin:0 auto;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:1.5rem">${e.prenom.charAt(0)}${e.nom.charAt(0)}</div>
            <h3 style="margin-top:8px;font-weight:700;">${e.prenom} ${e.nom}</h3>
            <span class="pill" style="background:${statutColor};color:white;">${e.statut}</span>
            ${e.plan === 'VIP' ? '<span class="badge-vip">VIP</span>' : ''}
        </div>
        <div class="detail-grid">
            <div class="detail-item"><label>Matricule</label><span>${e.id}</span></div>
            <div class="detail-item"><label>Date inscription</label><span>${e.dateInscription}</span></div>
            <div class="detail-item"><label>Sexe</label><span>${e.sexe}</span></div>
            <div class="detail-item"><label>Date naissance</label><span>${e.dateNaissance || 'N/A'}</span></div>
            <div class="detail-item"><label>Téléphone</label><span>${e.tel}</span></div>
            <div class="detail-item"><label>Email</label><span>${e.email || 'N/A'}</span></div>
            <div class="detail-item" style="grid-column:1/-1"><label>Adresse</label><span>${e.adresse}, ${e.commune}, ${e.departement}</span></div>
            <div class="detail-item"><label>Responsable</label><span>${e.parentNom || 'N/A'}</span></div>
            <div class="detail-item"><label>Tél. Responsable</label><span>${e.parentTel || 'N/A'}</span></div>
            <div class="detail-item"><label>Profession</label><span>${e.parentProfession || 'N/A'}</span></div>
            <div class="detail-item"><label>Adresse resp.</label><span>${e.parentAdresse || 'N/A'}</span></div>
            <div class="detail-item"><label>Promotion</label><span>${e.promo}</span></div>
            <div class="detail-item"><label>Plan</label><span>${e.plan}</span></div>
            <div class="detail-item"><label>Total formation</label><span>${formatPrix(e.totalFormation)}</span></div>
            <div class="detail-item"><label>Déjà payé</label><span style="color:var(--success)">${formatPrix(e.montantPaye)}</span></div>
            <div class="detail-item"><label>Reste à payer</label><span style="color:var(--red)">${formatPrix(e.resteAPayer)}</span></div>
            <div class="detail-item" style="grid-column:1/-1">
                <label>Progression paiement</label>
                <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                    <div style="flex:1;height:8px;background:#e5e7eb;border-radius:10px;overflow:hidden">
                        <div style="width:${pct}%;height:100%;background:${pct>=80?'var(--success)':pct>=50?'var(--warning)':'var(--red)'};border-radius:10px;"></div>
                    </div>
                    <span style="font-weight:700;font-size:.8rem;">${pct}%</span>
                </div>
            </div>
            ${paiementsEtudiant.length > 0 ? `
            <div class="detail-item" style="grid-column:1/-1">
                <label>Derniers paiements</label>
                <div style="margin-top:4px;">
                    ${paiementsEtudiant.slice(-3).reverse().map(p => `
                        <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--border-light);font-size:.75rem;">
                            <span>${p.date}</span>
                            <span>${p.mode}</span>
                            <span style="color:var(--success);font-weight:600;">${formatPrix(p.montant)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>` : ''}
        </div>
    `;
    openModal('detailsEtudiantModal');
}

function ouvrirModifierEtudiant(id) {
    const e = etudiants.find(x => x.id === id);
    if (!e) {
        showToast('Étudiant non trouvé', 'error');
        return;
    }
    currentModifEtudiantId = id;
    
    document.getElementById('modMatricule').value = e.id;
    document.getElementById('modNom').value = e.nom;
    document.getElementById('modPrenom').value = e.prenom;
    document.getElementById('modSexe').value = e.sexe;
    document.getElementById('modDateNaissance').value = e.dateNaissance || '';
    document.getElementById('modTel').value = e.tel;
    document.getElementById('modEmail').value = e.email || '';
    document.getElementById('modAdresse').value = e.adresse || '';
    document.getElementById('modCommune').value = e.commune || '';
    document.getElementById('modDepartement').value = e.departement || 'Ouest';
    document.getElementById('modParentNom').value = e.parentNom || '';
    document.getElementById('modParentTel').value = e.parentTel || '';
    document.getElementById('modParentProfession').value = e.parentProfession || '';
    document.getElementById('modParentAdresse').value = e.parentAdresse || '';
    document.getElementById('modPromotion').value = e.promo;
    document.getElementById('modStatut').value = e.statut;
    document.getElementById('modPlan').value = e.plan;
    document.getElementById('modTotalFormation').value = e.totalFormation;
    document.getElementById('modMontantPaye').value = e.montantPaye;
    
    openModal('modifierEtudiantModal');
}

function sauvegarderModifications() {
    const id = currentModifEtudiantId;
    const e = etudiants.find(x => x.id === id);
    if (!e) return;

    const nom = document.getElementById('modNom').value;
    const prenom = document.getElementById('modPrenom').value;
    if (!nom || !prenom) {
        showToast('Le nom et le prénom sont obligatoires', 'error');
        return;
    }

    e.nom = nom;
    e.prenom = prenom;
    e.sexe = document.getElementById('modSexe').value;
    e.dateNaissance = document.getElementById('modDateNaissance').value;
    e.tel = document.getElementById('modTel').value;
    e.email = document.getElementById('modEmail').value;
    e.adresse = document.getElementById('modAdresse').value;
    e.commune = document.getElementById('modCommune').value;
    e.departement = document.getElementById('modDepartement').value;
    e.parentNom = document.getElementById('modParentNom').value;
    e.parentTel = document.getElementById('modParentTel').value;
    e.parentProfession = document.getElementById('modParentProfession').value;
    e.parentAdresse = document.getElementById('modParentAdresse').value;
    e.promo = document.getElementById('modPromotion').value;
    e.statut = document.getElementById('modStatut').value;
    e.plan = document.getElementById('modPlan').value;
    e.totalFormation = parseInt(document.getElementById('modTotalFormation').value) || 50000;
    e.montantPaye = parseInt(document.getElementById('modMontantPaye').value) || 0;
    e.resteAPayer = e.totalFormation - e.montantPaye;

    paiements.forEach(p => {
        if (p.etudiantId === id) {
            p.etudiantNom = e.prenom + ' ' + e.nom;
        }
    });

    closeModal('modifierEtudiantModal');
    renderPage('etudiants');
    showToast('Étudiant modifié avec succès', 'success');
}

function supprimerEtudiant() {
    const id = currentModifEtudiantId;
    if (!confirm(`Voulez-vous vraiment supprimer l'étudiant ${id} ? Cette action est irréversible.`)) return;
    
    const index = etudiants.findIndex(x => x.id === id);
    if (index >= 0) etudiants.splice(index, 1);

    for (let i = paiements.length - 1; i >= 0; i--) {
        if (paiements[i].etudiantId === id) paiements.splice(i, 1);
    }

    closeModal('modifierEtudiantModal');
    renderPage('etudiants');
    showToast('Étudiant supprimé', 'info');
}

function imprimerFicheEtudiantPOS() {
    const id = currentDetailEtudiantId;
    const e = etudiants.find(x => x.id === id);
    if (!e) return;

    const printArea = document.getElementById('pos-print-area');
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
            <div class="pos-receipt-row"><span>Né(e) le:</span><span>${e.dateNaissance || 'N/A'}</span></div>
            <div class="pos-receipt-row"><span>Tél:</span><span>${e.tel}</span></div>
            <div class="pos-receipt-row"><span>Email:</span><span>${e.email || 'N/A'}</span></div>
            <div class="pos-receipt-row"><span>Adresse:</span><span>${e.adresse || 'N/A'}</span></div>
            <div class="pos-receipt-row"><span>Commune:</span><span>${e.commune || 'N/A'}</span></div>
            <div class="pos-divider"></div>
            <div class="pos-receipt-row"><span>Responsable:</span><span>${e.parentNom || 'N/A'}</span></div>
            <div class="pos-receipt-row"><span>Tél resp.:</span><span>${e.parentTel || 'N/A'}</span></div>
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
            <div style="text-align:center;font-size:8px;margin-top:8px;">Date: ${new Date().toLocaleDateString('fr-FR')}</div>
            <div style="text-align:center;font-size:8px;margin-top:12px;">Signature / Cachet</div>
        </div>
    `;
    printArea.style.display = 'block';
    window.print();
    printArea.style.display = 'none';
    showToast('Fiche envoyée à l\'imprimante POS-80', 'info');
}

// ==========================================
// MODALS
// ==========================================
function openInscriptionModal() {
    document.getElementById('matricule').value = 'ETU-2026-' + String(nextMatricule).padStart(3, '0');
    document.getElementById('dateInscription').value = new Date().toISOString().split('T')[0];
    openModal('inscriptionModal');
}

function openEncaissementModal(etudiantId = null) {
    const select = document.getElementById('encEtudiant');
    const debiteurs = etudiants.filter(e => e.resteAPayer > 0);
    
    select.innerHTML = debiteurs.map(e => 
        `<option value="${e.id}" ${etudiantId === e.id ? 'selected' : ''}>${e.prenom} ${e.nom} (${e.id})</option>`
    ).join('');
    
    if (etudiantId) updateEncaissementForm(etudiantId);
    else if (debiteurs.length > 0) updateEncaissementForm(debiteurs[0].id);
    
    select.onchange = () => updateEncaissementForm(select.value);
    openModal('encaissementModal');
}

function updateEncaissementForm(etudiantId) {
    const e = etudiants.find(x => x.id === etudiantId);
    if (!e) return;
    document.getElementById('encTotalFormation').value = formatPrix(e.totalFormation);
    document.getElementById('encDejaPaye').value = formatPrix(e.montantPaye);
    document.getElementById('encSoldeRestant').value = formatPrix(e.resteAPayer);
    document.getElementById('montantVerse').value = Math.min(5000, e.resteAPayer);
    document.getElementById('datePaiement').value = new Date().toISOString().split('T')[0];
}

function saveInscription() {
    const nom = document.getElementById('nom').value;
    const prenom = document.getElementById('prenom').value;
    if (!nom || !prenom) {
        showToast('Le nom et le prénom sont obligatoires', 'error');
        return;
    }
    
    const newEtudiant = {
        id: document.getElementById('matricule').value,
        nom: nom,
        prenom: prenom,
        sexe: document.getElementById('sexe').value,
        tel: document.getElementById('tel').value,
        email: document.getElementById('email').value,
        adresse: document.getElementById('adresse').value,
        commune: document.getElementById('commune').value,
        departement: document.getElementById('departement').value,
        dateNaissance: document.getElementById('dateNaissance').value,
        parentNom: document.getElementById('parentNom').value,
        parentTel: document.getElementById('parentTel').value,
        parentProfession: document.getElementById('parentProfession').value,
        parentAdresse: document.getElementById('parentAdresse').value,
        promo: document.getElementById('promotion').value,
        statut: document.getElementById('statut').value,
        dateInscription: document.getElementById('dateInscription').value,
        plan: 'Standard',
        montantPaye: 0,
        resteAPayer: 50000,
        totalFormation: 50000
    };
    
    etudiants.push(newEtudiant);
    nextMatricule++;
    closeModal('inscriptionModal');
    renderPage('etudiants');
    showToast('Étudiant inscrit avec succès', 'success');
}

function validerPaiement() {
    const etudiantId = document.getElementById('encEtudiant').value;
    const montant = parseInt(document.getElementById('montantVerse').value) || 0;
    const mode = document.getElementById('modePaiement').value;
    const ref = document.getElementById('refTransaction').value;
    const date = document.getElementById('datePaiement').value;
    const observation = document.getElementById('observation').value;
    
    if (montant <= 0) {
        showToast('Veuillez entrer un montant valide', 'error');
        return;
    }
    
    const etudiant = etudiants.find(e => e.id === etudiantId);
    if (!etudiant) return;
    
    if (montant > etudiant.resteAPayer) {
        showToast('Le montant dépasse le solde restant', 'error');
        return;
    }
    
    const paiementId = 'PAY-' + String(paiements.length + 1).padStart(3, '0');
    const recuId = 'RECU-2026-' + String(Math.floor(1000 + Math.random() * 9000));
    
    paiements.push({
        id: paiementId,
        date: date,
        etudiantId: etudiantId,
        etudiantNom: etudiant.prenom + ' ' + etudiant.nom,
        montant: montant,
        mode: mode,
        ref: ref,
        agent: 'Admin',
        statut: 'Validé',
        recu: recuId,
        observation: observation
    });
    
    etudiant.montantPaye += montant;
    etudiant.resteAPayer = etudiant.totalFormation - etudiant.montantPaye;
    
    currentRecuData = {
        recuId: recuId,
        paiementId: paiementId,
        date: date,
        etudiantId: etudiantId,
        etudiantNom: etudiant.prenom + ' ' + etudiant.nom,
        montant: montant,
        mode: mode,
        ref: ref,
        observation: observation,
        soldeRestant: etudiant.resteAPayer,
        totalFormation: etudiant.totalFormation,
        montantPayeTotal: etudiant.montantPaye
    };
    
    closeModal('encaissementModal');
    genererRecuContent();
    openModal('recuModal');
    renderPage(currentPage);
    showToast('Paiement validé avec succès', 'success');
}

function genererRecu() {
    const etudiantId = document.getElementById('encEtudiant').value;
    const etudiant = etudiants.find(e => e.id === etudiantId);
    if (!etudiant) return;
    
    currentRecuData = {
        recuId: 'RECU-2026-' + String(Math.floor(1000 + Math.random() * 9000)),
        paiementId: 'PAY-PREVIEW',
        date: document.getElementById('datePaiement').value,
        etudiantId: etudiantId,
        etudiantNom: etudiant.prenom + ' ' + etudiant.nom,
        montant: parseInt(document.getElementById('montantVerse').value) || 0,
        mode: document.getElementById('modePaiement').value,
        ref: document.getElementById('refTransaction').value,
        observation: document.getElementById('observation').value,
        soldeRestant: etudiant.resteAPayer,
        totalFormation: etudiant.totalFormation,
        montantPayeTotal: etudiant.montantPaye
    };
    
    genererRecuContent();
    openModal('recuModal');
}

function genererRecuContent() {
    if (!currentRecuData) return;
    const d = currentRecuData;
    document.getElementById('recuContent').innerHTML = `
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
        <div class="payslip-row"><span>Référence</span><span>${d.ref || 'N/A'}</span></div>
        <div class="payslip-row"><span>Total payé</span><span style="font-weight:600">${formatPrix(d.montantPayeTotal)} / ${formatPrix(d.totalFormation)}</span></div>
        <div class="payslip-total">
            <div><div class="payslip-total-label">Solde restant</div></div>
            <div class="payslip-total-amount" style="color:${d.soldeRestant > 0 ? 'var(--red)' : 'var(--success)'}">${formatPrix(d.soldeRestant)}</div>
        </div>
    `;
}

function imprimerRecuThermique() {
    if (!currentRecuData) {
        showToast('Aucune donnée de reçu disponible', 'error');
        return;
    }
    const d = currentRecuData;
    const printArea = document.getElementById('pos-print-area');
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
            <div class="pos-receipt-row"><span>Réf:</span><span>${d.ref || 'N/A'}</span></div>
            <div class="pos-receipt-row"><span>Total payé:</span><span>${formatPrix(d.montantPayeTotal)} / ${formatPrix(d.totalFormation)}</span></div>
            <div class="pos-divider"></div>
            <div class="pos-total pos-receipt-row"><span>SOLDE RESTANT:</span><span>${formatPrix(d.soldeRestant)}</span></div>
            <div class="pos-divider"></div>
            <div style="text-align:center;font-size:8px;margin-top:6px;">Merci de votre confiance!</div>
            <div style="text-align:center;font-size:7px;">${d.observation ? 'Note: ' + d.observation : ''}</div>
            <div style="text-align:center;font-size:7px;margin-top:12px;">Signature / Cachet</div>
        </div>
    `;
    printArea.style.display = 'block';
    window.print();
    printArea.style.display = 'none';
    showToast('Impression envoyée à l\'imprimante POS-80', 'info');
}

function telechargerRecuPDF() {
    if (!currentRecuData) {
        showToast('Aucune donnée de reçu disponible', 'error');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        const d = currentRecuData;
        const pageW = doc.internal.pageSize.getWidth();
        let y = 15;
        
        doc.setFillColor(10, 77, 140);
        doc.rect(0, 0, pageW, 25, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('CEJEC', 15, 15);
        doc.setFontSize(7);
        doc.text('Centre d\'Études des Jeunes en Entrepreneuriat et Commerce', 15, 20);
        
        doc.setTextColor(31, 41, 55);
        doc.setFontSize(14);
        y = 35;
        doc.text('REÇU DE PAIEMENT', 15, y);
        y += 8;
        doc.setFontSize(9);
        doc.text(`No: ${d.recuId}`, 15, y);
        doc.text(`Date: ${d.date}`, pageW - 15, y, { align: 'right' });
        y += 10;
        
        doc.setDrawColor(229, 231, 235);
        doc.line(15, y, pageW - 15, y);
        y += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('INFORMATIONS ÉTUDIANT', 15, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Nom: ${d.etudiantNom}`, 15, y); y += 5;
        doc.text(`Matricule: ${d.etudiantId}`, 15, y); y += 8;
        
        doc.setDrawColor(229, 231, 235);
        doc.line(15, y, pageW - 15, y);
        y += 8;
        
        doc.setFont('helvetica', 'bold');
        doc.text('DÉTAIL DU PAIEMENT', 15, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        const details = [
            ['Montant versé:', formatPrix(d.montant)],
            ['Mode de paiement:', d.mode],
            ['Référence:', d.ref || 'N/A'],
            ['Total payé:', `${formatPrix(d.montantPayeTotal)} / ${formatPrix(d.totalFormation)}`]
        ];
        details.forEach(([label, value]) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label, 15, y);
            doc.setFont('helvetica', 'normal');
            doc.text(value, pageW - 15, y, { align: 'right' });
            y += 5;
        });
        
        y += 8;
        doc.setFillColor(10, 77, 140);
        doc.roundedRect(15, y, pageW - 30, 12, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`SOLDE RESTANT: ${formatPrix(d.soldeRestant)}`, pageW / 2, y + 8, { align: 'center' });
        
        y += 20;
        doc.setTextColor(107, 114, 128);
        doc.setFontSize(7);
        doc.text('Merci de votre confiance en CEJEC!', pageW / 2, y, { align: 'center' });
        doc.text('contact@cejec.edu.ht | Port-au-Prince, Haiti', pageW / 2, y + 4, { align: 'center' });
        
        doc.save(`CEJEC_${d.recuId}.pdf`);
        showToast('Reçu téléchargé en PDF', 'success');
    } catch(e) {
        showToast('Erreur lors du téléchargement du PDF', 'error');
        console.error(e);
    }
}

function exportListePDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Liste Étudiants - CEJEC', 14, 20);
        doc.autoTable({ html: 'table', startY: 30 });
        doc.save('liste_etudiants_cejec.pdf');
        showToast('PDF exporté', 'success');
    } catch(e) {
        showToast('Erreur export PDF', 'error');
    }
}

// ==========================================
// RENDU DES PAGES
// ==========================================
function renderPage(page) {
    const mc = document.getElementById('mainContent');
    switch(page) {
        case 'etudiants': mc.innerHTML = renderEtudiants(); break;
        case 'paiements': mc.innerHTML = renderPaiements(); break;
        case 'dettes': mc.innerHTML = renderDettes(); break;
        case 'recus': mc.innerHTML = renderRecus(); break;
        default: mc.innerHTML = renderEtudiants();
    }
}

function renderEtudiants() {
    let rows = etudiants.map(e => {
        const statutPill = e.statut === 'Inscrit' ? 'pill-success' : e.statut === 'Suspendu' ? 'pill-warning' : e.statut === 'Diplômé' ? 'pill-info' : 'pill-muted';
        return `<tr>
            <td><span class="pill pill-muted">${e.id}</span></td>
            <td style="font-weight:600">${e.prenom} ${e.nom}</td>
            <td>${e.tel}</td>
            <td>${e.promo}</td>
            <td><span class="pill ${statutPill}">${e.statut}</span></td>
            <td style="color:var(--success);font-weight:600">${formatPrix(e.montantPaye)}</td>
            <td style="color:var(--red);font-weight:600">${formatPrix(e.resteAPayer)}</td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline btn-icon" title="Voir détails" onclick="voirDetailsEtudiant('${e.id}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline btn-icon" title="Modifier" onclick="ouvrirModifierEtudiant('${e.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline btn-icon" title="Imprimer fiche" onclick="currentDetailEtudiantId='${e.id}';imprimerFicheEtudiantPOS()"><i class="fas fa-print"></i></button>
                    ${e.resteAPayer > 0 ? `<button class="btn btn-sm btn-success btn-icon" title="Encaisser" onclick="openEncaissementModal('${e.id}')"><i class="fas fa-money-bill-wave"></i></button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');
    
    return `
    ${getSectionKpis('etudiants')}
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
    const tbody = document.getElementById('etudiantTbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(val.toLowerCase()) ? '' : 'none';
    });
}

function filterByStatut(val) {
    const tbody = document.getElementById('etudiantTbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(tr => {
        const pills = tr.querySelectorAll('.pill');
        const statutPill = Array.from(pills).find(p => 
            ['Inscrit','Suspendu','Diplômé','Pré-inscrit'].some(s => p.innerText.includes(s))
        );
        tr.style.display = val === 'tous' || (statutPill && statutPill.innerText.includes(val)) ? '' : 'none';
    });
}

function filterByPromo(val) {
    const tbody = document.getElementById('etudiantTbody');
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(tr => {
        tr.style.display = val === 'tous' || tr.innerText.includes(val) ? '' : 'none';
    });
}

function renderPaiements() {
    let rows = paiements.slice().reverse().map(p => `
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
    `).join('');
    
    return `
    ${getSectionKpis('paiements')}
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
    const p = paiements.find(x => x.id === paiementId);
    if (!p) return;
    const e = etudiants.find(x => x.id === p.etudiantId);
    if (!e) return;
    
    currentRecuData = {
        recuId: p.recu,
        paiementId: p.id,
        date: p.date,
        etudiantId: p.etudiantId,
        etudiantNom: p.etudiantNom,
        montant: p.montant,
        mode: p.mode,
        ref: p.ref,
        observation: p.observation || '',
        soldeRestant: e.resteAPayer,
        totalFormation: e.totalFormation,
        montantPayeTotal: e.montantPaye
    };
    
    genererRecuContent();
    openModal('recuModal');
}

function imprimerRecuDepuisPaiement(paiementId) {
    const p = paiements.find(x => x.id === paiementId);
    if (!p) return;
    const e = etudiants.find(x => x.id === p.etudiantId);
    if (!e) return;
    
    currentRecuData = {
        recuId: p.recu,
        paiementId: p.id,
        date: p.date,
        etudiantId: p.etudiantId,
        etudiantNom: p.etudiantNom,
        montant: p.montant,
        mode: p.mode,
        ref: p.ref,
        observation: p.observation || '',
        soldeRestant: e.resteAPayer,
        totalFormation: e.totalFormation,
        montantPayeTotal: e.montantPaye
    };
    
    imprimerRecuThermique();
}

function telechargerRecuDepuisPaiement(paiementId) {
    const p = paiements.find(x => x.id === paiementId);
    if (!p) return;
    const e = etudiants.find(x => x.id === p.etudiantId);
    if (!e) return;
    
    currentRecuData = {
        recuId: p.recu,
        paiementId: p.id,
        date: p.date,
        etudiantId: p.etudiantId,
        etudiantNom: p.etudiantNom,
        montant: p.montant,
        mode: p.mode,
        ref: p.ref,
        observation: p.observation || '',
        soldeRestant: e.resteAPayer,
        totalFormation: e.totalFormation,
        montantPayeTotal: e.montantPaye
    };
    
    telechargerRecuPDF();
}

function renderDettes() {
    const debiteurs = etudiants.filter(e => e.resteAPayer > 0);
    const totalImpayes = debiteurs.reduce((s, e) => s + e.resteAPayer, 0);
    
    let rows = debiteurs.map(e => {
        const pct = Math.round((e.montantPaye / e.totalFormation) * 100);
        const color = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--red)';
        const statutText = pct >= 80 ? 'À jour' : pct >= 50 ? 'Partiel' : 'En retard';
        const statutClass = pct >= 80 ? 'pill-success' : pct >= 50 ? 'pill-warning' : 'pill-danger';
        
        return `<tr>
            <td style="font-weight:600">${e.prenom} ${e.nom} ${e.plan === 'VIP' ? '<span class="badge-vip">VIP</span>' : ''}</td>
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
    }).join('');
    
    return `
    ${getSectionKpis('dettes')}
    
    <div class="card">
        <div class="card-header">
            <h2><i class="fas fa-exclamation-triangle"></i> Gestion des Dettes</h2>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline" onclick="showToast('Rappels envoyés à tous les débiteurs','info')"><i class="fas fa-bell"></i> Relancer tous</button>
                <button class="btn btn-sm btn-outline" onclick="exportListePDF()"><i class="fas fa-file-pdf"></i> Exporter</button>
            </div>
        </div>
        
        <div class="debtor-grid" style="margin-bottom:16px">
            ${debiteurs.slice(0, 3).map(e => {
                const pct = Math.round((e.montantPaye / e.totalFormation) * 100);
                return `
                <div class="debtor-card" onclick="openEncaissementModal('${e.id}')">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start">
                        <div>
                            <div class="card-name">${e.prenom} ${e.nom} ${e.plan === 'VIP' ? '<span class="badge-vip">VIP</span>' : ''}</div>
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
                            <div class="progress-bar-fill" style="width:${pct}%;background:${pct>=80?'var(--success)':pct>=50?'var(--warning)':'var(--red)'}"></div>
                        </div>
                    </div>
                </div>`;
            }).join('')}
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
    let rows = paiements.slice().reverse().map(p => `
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
    `).join('');
    
    return `
    ${getSectionKpis('recus')}
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
// INITIALISATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderPage('etudiants');
});