// ==================== DONNÉES INITIALES ====================
const projets = [
    {id:1,nom:'AgriTech Connect',porteur:'Pierre Antoine',promo:'Promotion 2026',cat:'Agriculture',budget:75000,statut:'Incubation',progression:65,dateDebut:'2026-03-01',desc:'Plateforme connectant agriculteurs et acheteurs'},
    {id:2,nom:'EduMobile',porteur:'Marie Joseph',promo:'Promotion 2026',cat:'Éducation',budget:45000,statut:'Étude',progression:30,dateDebut:'2026-04-15',desc:'Application mobile éducative'},
    {id:3,nom:'Artisanat Plus',porteur:'Jameson Pierre',promo:'Promotion 2026',cat:'Artisanat',budget:30000,statut:'Idée',progression:10,dateDebut:'2026-05-20',desc:'Marketplace pour artisans locaux'},
    {id:4,nom:'HealthFirst',porteur:'Mireille Dumont',promo:'Promotion 2026',cat:'Santé',budget:120000,statut:'Recherche financement',progression:80,dateDebut:'2026-01-10',desc:'Solution télémédecine rurale'},
    {id:5,nom:'FinTech Junior',porteur:'Frantz Louis',promo:'Promotion 2025',cat:'Technologie',budget:200000,statut:'Lancement',progression:95,dateDebut:'2025-09-01',desc:'Application financière pour jeunes'},
    {id:6,nom:'Green Services',porteur:'Sophie Laurent',promo:'Promotion 2026',cat:'Services',budget:55000,statut:'Incubation',progression:50,dateDebut:'2026-02-20',desc:'Services écologiques urbains'},
    {id:7,nom:'MarketHub',porteur:'Jean Baptiste',promo:'Promotion 2025',cat:'Commerce',budget:90000,statut:'Terminé',progression:100,dateDebut:'2025-06-01',desc:'Plateforme de commerce local'}
];

const stages = [
    {id:1,etudiant:'Marie Dupont',promo:'Promotion 2026',entreprise:'Digicel Haiti',secteur:'Technologie',poste:'Stagiaire Marketing',superviseur:'Jean Ricardo',dateDebut:'2026-06-01',dateFin:'2026-08-31',duree:3,statut:'En cours',evaluation:'—'},
    {id:2,etudiant:'Sophie Bernard',promo:'Promotion 2026',entreprise:'Banque Nationale',secteur:'Finance',poste:'Stagiaire Comptabilité',superviseur:'Mme. François',dateDebut:'2026-07-01',dateFin:'2026-09-30',duree:3,statut:'En attente',evaluation:'—'},
    {id:3,etudiant:'Jean Baptiste',promo:'Promotion 2025',entreprise:'Sogebank',secteur:'Finance',poste:'Analyste Junior',superviseur:'Dr. Louis',dateDebut:'2026-01-15',dateFin:'2026-04-15',duree:3,statut:'Terminé',evaluation:'A'},
    {id:4,etudiant:'Rose Michel',promo:'Promotion 2026',entreprise:'Fondation Connais.',secteur:'Éducation',poste:'Assistante Projet',superviseur:'M. Charles',dateDebut:'2026-05-01',dateFin:'2026-08-01',duree:3,statut:'En cours',evaluation:'B+'}
];

const mentors = [
    {id:1,nom:'Dr. Jacques Mentor',profession:'Entrepreneur',entreprise:'Mentor Consulting',tel:'+509 38 00 11 22',email:'jacques@cejec.edu.ht',specialite:'Entrepreneuriat',projetsSuivis:3,disponible:'Oui'},
    {id:2,nom:'Prof. Rose Michel',profession:'Consultante',entreprise:'Rose Consulting',tel:'+509 39 88 77 66',email:'rose@cejec.edu.ht',specialite:'Marketing',projetsSuivis:2,disponible:'Oui'},
    {id:3,nom:'Dr. Marc Arthur',profession:'Directeur',entreprise:'CEJEC',tel:'+509 40 11 22 33',email:'marc@cejec.edu.ht',specialite:'Leadership',projetsSuivis:4,disponible:'Partiel'}
];

const businessPlans = [
    {id:1,titre:'Business Plan AgriTech Connect',porteur:'Pierre Antoine',statut:'Validé',date:'2026-04-10',montant:150000},
    {id:2,titre:'Business Plan EduMobile',porteur:'Marie Joseph',statut:'En analyse',date:'2026-05-20',montant:80000},
    {id:3,titre:'Business Plan HealthFirst',porteur:'Mireille Dumont',statut:'Validé',date:'2026-02-15',montant:200000}
];

const events = [
    {id:1,titre:'Conférence Entrepreneuriat',cat:'Conférence',dateDebut:'2026-06-15',dateFin:'2026-06-15',heureDebut:'09:00',heureFin:'12:00',lieu:'Salle A-101',resp:'Dr. Jacques Mentor',couleur:'blue',statut:'Confirmé',priorite:'Importante',alarme:null},
    {id:2,titre:'Hackathon Innovation 2026',cat:'Hackathon',dateDebut:'2026-06-20',dateFin:'2026-06-22',heureDebut:'08:00',heureFin:'18:00',lieu:'Grande Salle',resp:'Prof. Rose Michel',couleur:'purple',statut:'Programmé',priorite:'Importante',alarme:null},
    {id:3,titre:'Soutenance Projets',cat:'Soutenance',dateDebut:'2026-06-25',dateFin:'2026-06-25',heureDebut:'10:00',heureFin:'16:00',lieu:'Salle B-201',resp:'Dr. Marc Arthur',couleur:'green',statut:'Programmé',priorite:'Urgente',alarme:null},
    {id:4,titre:'Réunion Mentorat',cat:'Mentorat',dateDebut:'2026-06-14',dateFin:'2026-06-14',heureDebut:'14:00',heureFin:'15:30',lieu:'Bureau Direction',resp:'Dr. Jacques Mentor',couleur:'orange',statut:'Confirmé',priorite:'Normale',alarme:null},
    {id:5,titre:'Cours Leadership',cat:'Cours',dateDebut:'2026-06-13',dateFin:'2026-06-13',heureDebut:'08:00',heureFin:'10:00',lieu:'Salle A-101',resp:'Prof. Marie Louis',couleur:'blue',statut:'Confirmé',priorite:'Normale',alarme:null}
];

let nextProjId = 8;
let nextStageId = 5;
let nextMentorId = 4;
let nextBPId = 4;
let nextEvtId = 6;
let currentPage = 'projets';
let chartInstances = {};
let currentDetailEventId = null;
let activeAlarms = [];
let alarmTimers = [];
let alarmAudioContext = null;

// ==================== FONCTIONS DE BASE ====================
function showToast(msg, type) {
    type = type || 'success';
    const icons = {success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle'};
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.innerHTML = '<i class="fas ' + icons[type] + '"></i> ' + msg;
    document.getElementById('toastContainer').appendChild(el);
    setTimeout(function() {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100px)';
        el.style.transition = 'all .3s';
        setTimeout(function() { el.remove(); }, 300);
    }, 3500);
}

function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.querySelectorAll('.modal-overlay').forEach(function(m) {
    m.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); });
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(function(m) { m.classList.remove('open'); });
});

function navigateTo(page) {
    document.querySelectorAll('#navTabs button').forEach(function(b) { b.classList.remove('active'); });
    const btn = document.querySelector('#navTabs button[data-page="' + page + '"]');
    if (btn) btn.classList.add('active');
    currentPage = page;
    document.getElementById('breadcrumbCurrent').textContent = 
        page === 'projets' ? 'Projets' :
        page === 'stages' ? 'Stages' :
        page === 'mentorat' ? 'Mentorat' :
        page === 'incubation' ? 'Incubation' :
        page === 'businessplan' ? 'Business Plans' :
        page === 'calendrier' ? 'Calendrier' : 'Incubateur Projets';
    renderPage(page);
}

document.querySelectorAll('#navTabs button').forEach(function(btn) {
    btn.addEventListener('click', function() { navigateTo(this.dataset.page); });
});

function destroyCharts() {
    Object.keys(chartInstances).forEach(function(k) {
        if (chartInstances[k]) { chartInstances[k].destroy(); delete chartInstances[k]; }
    });
}

function filterTable(val, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const term = val.toLowerCase();
    tbody.querySelectorAll('tr').forEach(function(row) {
        row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
}

function filterByStatus(val, tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(function(row) {
        row.style.display = (val === 'tous' || row.innerText.includes(val)) ? '' : 'none';
    });
}

// ==================== ALARME SYSTEM ====================
function playAlarmSound(type, volume) {
    try {
        if (!alarmAudioContext) alarmAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        const ctx = alarmAudioContext;
        const vol = (volume || 7) / 10;
        
        switch(type) {
            case 'classic':
                playBeep(ctx, 800, 0.3, vol);
                setTimeout(() => playBeep(ctx, 1000, 0.3, vol), 300);
                break;
            case 'digital':
                playBeep(ctx, 1200, 0.15, vol);
                setTimeout(() => playBeep(ctx, 1200, 0.15, vol), 200);
                setTimeout(() => playBeep(ctx, 1200, 0.15, vol), 400);
                break;
            case 'urgent':
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => playBeep(ctx, 600 + (i * 200), 0.1, vol), i * 150);
                }
                break;
            case 'gentle':
                playBeep(ctx, 500, 0.5, vol * 0.5);
                setTimeout(() => playBeep(ctx, 600, 0.5, vol * 0.5), 500);
                setTimeout(() => playBeep(ctx, 700, 0.5, vol * 0.5), 1000);
                break;
        }
    } catch(e) {
        console.log('Audio pas disponible');
    }
}

function playBeep(ctx, freq, duration, volume) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
}

function scheduleAlarm(event, alarmConfig) {
    const now = new Date();
    const [hours, minutes] = alarmConfig.time.split(':');
    const alarmDate = new Date(alarmConfig.date + 'T' + alarmConfig.time + ':00');
    
    // Soustraire minutes d'avance
    alarmDate.setMinutes(alarmDate.getMinutes() - alarmConfig.avance);
    
    const timeUntilAlarm = alarmDate.getTime() - now.getTime();
    
    if (timeUntilAlarm <= 0) {
        console.log('Alarme déjà passée:', event.titre);
        return;
    }
    
    // Planifier l'alarme
    const timerId = setTimeout(() => {
        triggerAlarm(event, alarmConfig);
    }, timeUntilAlarm);
    
    const alarmEntry = {
        eventId: event.id,
        timerId: timerId,
        config: alarmConfig,
        event: event
    };
    
    activeAlarms.push(alarmEntry);
    
    console.log('🔔 Alarme programmée pour:', event.titre, 'dans', Math.round(timeUntilAlarm / 60000), 'minutes');
}

function triggerAlarm(event, config) {
    // Retirer de la liste active
    activeAlarms = activeAlarms.filter(a => a.eventId !== event.id || a.config.time !== config.time);
    
    let repetitionCount = 0;
    const maxRepetitions = config.repetition || 3;
    const intervalle = (config.intervalle || 5) * 60 * 1000;
    
    function showAlarmPopup() {
        document.getElementById('alarmPopupIcon').textContent = config.icone || '🔔';
        document.getElementById('alarmPopupTitle').textContent = event.titre;
        document.getElementById('alarmPopupInfo').innerHTML = 
            '<strong>' + event.cat + '</strong><br>' +
            '📅 ' + event.dateDebut + ' | 🕐 ' + event.heureDebut + '<br>' +
            '📍 ' + event.lieu + '<br>' +
            '👤 ' + event.resp;
        
        document.getElementById('alarmPopup').classList.add('open');
        
        // Jouer son
        playAlarmSound(config.son, config.volume);
        
        // Countdown
        let countdown = config.duree || 10;
        const countdownEl = document.getElementById('alarmPopupCountdown');
        countdownEl.textContent = '⏱️ ' + countdown + 's';
        
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                countdownEl.textContent = '⏱️ ' + countdown + 's';
            } else {
                clearInterval(countdownInterval);
                if (config.repetition === 0 || repetitionCount < maxRepetitions - 1) {
                    stopAlarm();
                    repetitionCount++;
                    setTimeout(showAlarmPopup, intervalle);
                } else {
                    stopAlarm();
                }
            }
        }, 1000);
        
        // Stocker l'intervalle pour pouvoir l'arrêter
        window._currentAlarmInterval = countdownInterval;
    }
    
    showAlarmPopup();
}

function stopAlarm() {
    document.getElementById('alarmPopup').classList.remove('open');
    if (window._currentAlarmInterval) {
        clearInterval(window._currentAlarmInterval);
        window._currentAlarmInterval = null;
    }
    showToast('🔕 Alarme arrêtée', 'info');
}

function snoozeAlarm() {
    stopAlarm();
    showToast('⏰ Rappel dans 5 minutes', 'info');
    
    // Replanifier dans 5 minutes
    setTimeout(() => {
        const lastAlarm = activeAlarms[activeAlarms.length - 1];
        if (lastAlarm) {
            triggerAlarm(lastAlarm.event, lastAlarm.config);
        }
    }, 5 * 60 * 1000);
}

function toggleAlarmConfig() {
    const checkbox = document.getElementById('evtAlarme');
    const section = document.getElementById('alarmConfigSection');
    section.style.display = checkbox.checked ? 'block' : 'none';
}

// Volume slider
document.addEventListener('DOMContentLoaded', function() {
    const volSlider = document.getElementById('alarmVolume');
    const volValue = document.getElementById('volumeValue');
    if (volSlider && volValue) {
        volSlider.addEventListener('input', function() {
            volValue.textContent = this.value;
        });
    }
});

// ==================== OUVERTURE MODALS ====================
function openProjectModal() {
    document.getElementById('projModalTitle').textContent = 'Nouveau Projet';
    document.getElementById('projNom').value = '';
    document.getElementById('projPorteur').value = '';
    document.getElementById('projDesc').value = '';
    document.getElementById('projBudget').value = '50000';
    document.getElementById('projDebut').value = new Date().toISOString().split('T')[0];
    document.getElementById('projLancement').value = '';
    document.getElementById('projStatut').value = 'Idée';
    openModal('projectModal');
}

function openStageModal(stageId) {
    if (stageId) {
        const stage = stages.find(function(s) { return s.id === stageId; });
        if (!stage) return;
        document.getElementById('stageEtudiant').value = stage.etudiant;
        document.getElementById('stagePromo').value = stage.promo;
        document.getElementById('stageEntreprise').value = stage.entreprise;
        document.getElementById('stageSecteur').value = stage.secteur;
        document.getElementById('stagePoste').value = stage.poste;
        document.getElementById('stageSuperviseur').value = stage.superviseur;
        document.getElementById('stageDateDebut').value = stage.dateDebut;
        document.getElementById('stageDateFin').value = stage.dateFin;
        document.getElementById('stageStatut').value = stage.statut;
        document.getElementById('stageEval').value = stage.evaluation;
        document.getElementById('stageModal').dataset.editId = stageId;
        document.querySelector('#stageModal .modal-header h3').innerHTML = '<i class="fas fa-edit"></i> Modifier Stage';
        document.querySelector('#stageModal .btn-primary').innerHTML = '<i class="fas fa-save"></i> Mettre à jour';
    } else {
        document.getElementById('stageEtudiant').value = '';
        document.getElementById('stagePromo').value = '';
        document.getElementById('stageEntreprise').value = '';
        document.getElementById('stageSecteur').value = '';     
        document.getElementById('stagePoste').value = '';
        document.getElementById('stageSuperviseur').value = '';
        document.getElementById('stageDateDebut').value = new Date().toISOString().split('T')[0];
        document.getElementById('stageDateFin').value = '';
        document.getElementById('stageStatut').value = 'En attente';
        document.getElementById('stageEval').value = '—';
        delete document.getElementById('stageModal').dataset.editId;
        document.querySelector('#stageModal .modal-header h3').innerHTML = '<i class="fas fa-briefcase"></i> Nouveau Stage';
        document.querySelector('#stageModal .btn-primary').innerHTML = '<i class="fas fa-save"></i> Enregistrer';
    }
    openModal('stageModal');
}

function openEventModal(eventId) {
    document.getElementById('evtModalTitle').textContent = 'Ajouter Événement';
    document.getElementById('evtAlarme').checked = false;
    document.getElementById('alarmConfigSection').style.display = 'none';
    
    if (eventId) {
        const evt = events.find(function(e) { return e.id === eventId; });
        if (!evt) return;
        document.getElementById('evtTitre').value = evt.titre;
        document.getElementById('evtCat').value = evt.cat;
        document.getElementById('evtPriorite').value = evt.priorite;
        document.getElementById('evtDateDebut').value = evt.dateDebut;
        document.getElementById('evtDateFin').value = evt.dateFin;
        document.getElementById('evtHeureDebut').value = evt.heureDebut;
        document.getElementById('evtHeureFin').value = evt.heureFin;
        document.getElementById('evtLieu').value = evt.lieu;
        document.getElementById('evtResp').value = evt.resp;
        document.getElementById('evtCouleur').value = evt.couleur;
        document.getElementById('evtStatut').value = evt.statut;
        
        if (evt.alarme) {
            document.getElementById('evtAlarme').checked = true;
            document.getElementById('alarmConfigSection').style.display = 'block';
            document.getElementById('alarmAvance').value = evt.alarme.avance;
            document.getElementById('alarmSon').value = evt.alarme.son;
            document.getElementById('alarmDuree').value = evt.alarme.duree;
            document.getElementById('alarmRepetition').value = evt.alarme.repetition;
            document.getElementById('alarmIntervalle').value = evt.alarme.intervalle;
            document.getElementById('alarmVolume').value = evt.alarme.volume;
            document.getElementById('volumeValue').textContent = evt.alarme.volume;
        }
        
        document.getElementById('evtModalTitle').textContent = 'Modifier Événement';
        document.getElementById('eventModal').dataset.editId = eventId;
    } else {
        document.getElementById('evtTitre').value = '';
        document.getElementById('evtDateDebut').value = new Date().toISOString().split('T')[0];
        document.getElementById('evtDateFin').value = new Date().toISOString().split('T')[0];
        document.getElementById('evtLieu').value = '';
        document.getElementById('evtResp').value = '';
        delete document.getElementById('eventModal').dataset.editId;
    }
    openModal('eventModal');
}

function openMentorModal() {
    document.getElementById('mentorNom').value = '';
    document.getElementById('mentorProfession').value = '';
    document.getElementById('mentorEntreprise').value = '';
    document.getElementById('mentorTel').value = '';
    document.getElementById('mentorEmail').value = '';
    openModal('mentorModal');
}

function openBPModal() {
    document.getElementById('bpTitre').value = '';
    document.getElementById('bpPorteur').value = '';
    document.getElementById('bpMontant').value = '100000';
    document.getElementById('bpDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('bpStatut').value = 'Brouillon';
    document.getElementById('bpResume').value = '';
    openModal('bpModal');
}

// ==================== FONCTIONS VOIR DÉTAILS ====================
function viewProjectDetail(id) {
    const p = projets.find(function(x) { return x.id === id; });
    if (!p) return;
    document.getElementById('detailBody').innerHTML =
        '<div style="display:grid;gap:10px;font-size:.85rem">' +
        '<div><strong>ID:</strong> #' + p.id + '</div>' +
        '<div><strong>Nom:</strong> ' + p.nom + '</div>' +
        '<div><strong>Porteur:</strong> ' + p.porteur + '</div>' +
        '<div><strong>Promotion:</strong> ' + p.promo + '</div>' +
        '<div><strong>Catégorie:</strong> ' + p.cat + '</div>' +
        '<div><strong>Budget:</strong> ' + p.budget.toLocaleString() + ' HTG</div>' +
        '<div><strong>Statut:</strong> ' + p.statut + '</div>' +
        '<div><strong>Progression:</strong> ' + p.progression + '%</div>' +
        '<div><strong>Date début:</strong> ' + p.dateDebut + '</div>' +
        '<div><strong>Description:</strong> ' + p.desc + '</div>' +
        '</div>';
    openModal('detailModal');
}

function viewStageDetail(id) {
    const s = stages.find(function(x) { return x.id === id; });
    if (!s) return;
    document.getElementById('detailBody').innerHTML =
        '<div style="display:grid;gap:10px;font-size:.85rem">' +
        '<div><strong>Étudiant:</strong> ' + s.etudiant + '</div>' +
        '<div><strong>Entreprise:</strong> ' + s.entreprise + '</div>' +
        '<div><strong>Secteur:</strong> ' + s.secteur + '</div>' +
        '<div><strong>Poste:</strong> ' + s.poste + '</div>' +
        '<div><strong>Superviseur:</strong> ' + s.superviseur + '</div>' +
        '<div><strong>Période:</strong> ' + s.dateDebut + ' → ' + s.dateFin + '</div>' +
        '<div><strong>Durée:</strong> ' + s.duree + ' mois</div>' +
        '<div><strong>Statut:</strong> ' + s.statut + '</div>' +
        '<div><strong>Évaluation:</strong> ' + s.evaluation + '</div>' +
        '</div>';
    openModal('detailModal');
}

function viewMentorDetail(id) {
    const m = mentors.find(function(x) { return x.id === id; });
    if (!m) return;
    document.getElementById('detailBody').innerHTML =
        '<div style="display:grid;gap:10px;font-size:.85rem">' +
        '<div><strong>Nom:</strong> ' + m.nom + '</div>' +
        '<div><strong>Profession:</strong> ' + m.profession + '</div>' +
        '<div><strong>Entreprise:</strong> ' + m.entreprise + '</div>' +
        '<div><strong>Téléphone:</strong> ' + m.tel + '</div>' +
        '<div><strong>Email:</strong> ' + m.email + '</div>' +
        '<div><strong>Spécialité:</strong> ' + m.specialite + '</div>' +
        '<div><strong>Projets suivis:</strong> ' + m.projetsSuivis + '</div>' +
        '<div><strong>Disponibilité:</strong> ' + m.disponible + '</div>' +
        '</div>';
    openModal('detailModal');
}

function viewBPDetail(id) {
    const bp = businessPlans.find(function(x) { return x.id === id; });
    if (!bp) return;
    document.getElementById('detailBody').innerHTML =
        '<div style="display:grid;gap:10px;font-size:.85rem">' +
        '<div><strong>Titre:</strong> ' + bp.titre + '</div>' +
        '<div><strong>Porteur:</strong> ' + bp.porteur + '</div>' +
        '<div><strong>Statut:</strong> ' + bp.statut + '</div>' +
        '<div><strong>Date:</strong> ' + bp.date + '</div>' +
        '<div><strong>Montant:</strong> ' + bp.montant.toLocaleString() + ' HTG</div>' +
        '</div>';
    openModal('detailModal');
}

// ==================== NOUVEAU: VOIR DÉTAILS ÉVÉNEMENT ====================
function viewEventDetail(id) {
    const evt = events.find(function(e) { return e.id === id; });
    if (!evt) return;
    
    currentDetailEventId = id;
    
    const statutClass = evt.statut === 'Confirmé' ? 'pill-success' : evt.statut === 'Programmé' ? 'pill-warning' : 'pill-muted';
    const prioClass = evt.priorite === 'Urgente' ? 'pill-danger' : evt.priorite === 'Importante' ? 'pill-warning' : 'pill-info';
    const couleurHex = evt.couleur === 'blue' ? '#0A4D8C' : evt.couleur === 'red' ? '#D62828' : evt.couleur === 'green' ? '#10b981' : evt.couleur === 'orange' ? '#f97316' : '#8b5cf6';
    const hasAlarm = evt.alarme ? true : false;
    
    document.getElementById('eventDetailBody').innerHTML = 
        '<div style="text-align:center;margin-bottom:16px">' +
        '<div style="width:50px;height:50px;border-radius:50%;background:' + couleurHex + ';margin:0 auto;display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem">' +
        '<i class="fas fa-' + (evt.cat === 'Cours' ? 'book' : evt.cat === 'Réunion' ? 'handshake' : evt.cat === 'Mentorat' ? 'user-tie' : evt.cat === 'Hackathon' ? 'laptop-code' : evt.cat === 'Conférence' ? 'microphone' : evt.cat === 'Soutenance' ? 'graduation-cap' : 'calendar-check') + '"></i>' +
        '</div>' +
        '<h3 style="margin-top:10px;font-weight:700;color:var(--ink)">' + evt.titre + '</h3>' +
        '<span class="pill ' + statutClass + '">' + evt.statut + '</span> ' +
        '<span class="pill ' + prioClass + '">' + evt.priorite + '</span>' +
        (hasAlarm ? ' <span class="pill pill-danger" style="animation:pulse 1.5s infinite"><i class="fas fa-bell"></i> Alarme active</span>' : '') +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:.8rem">' +
        '<div class="detail-item"><label>Catégorie</label><span>' + evt.cat + '</span></div>' +
        '<div class="detail-item"><label>Date</label><span>' + evt.dateDebut + (evt.dateDebut !== evt.dateFin ? ' → ' + evt.dateFin : '') + '</span></div>' +
        '<div class="detail-item"><label>Heure</label><span>' + evt.heureDebut + ' - ' + evt.heureFin + '</span></div>' +
        '<div class="detail-item"><label>Lieu</label><span>' + evt.lieu + '</span></div>' +
        '<div class="detail-item"><label>Responsable</label><span>' + evt.resp + '</span></div>' +
        '<div class="detail-item"><label>Priorité</label><span>' + evt.priorite + '</span></div>' +
        '</div>' +
        (hasAlarm ? 
        '<div style="margin-top:16px;padding:12px;background:var(--red-light);border-radius:var(--radius-sm);border:1px solid var(--red-soft)">' +
        '<strong><i class="fas fa-bell"></i> Configuration Alarme:</strong><br>' +
        '<span style="font-size:.75rem">' +
        'Sonnerie: ' + evt.alarme.son + ' | Volume: ' + evt.alarme.volume + '/10<br>' +
        'Avance: ' + evt.alarme.avance + ' min | Durée: ' + evt.alarme.duree + 's<br>' +
        'Répétition: ' + evt.alarme.repetition + 'x | Intervalle: ' + evt.alarme.intervalle + ' min' +
        '</span></div>' : '') +
        '<div style="margin-top:12px;font-size:.7rem;color:var(--muted)">' +
        '<i class="fas fa-clock"></i> Créé le: ' + evt.dateDebut + 
        '</div>';
    
    // Update alarm button
    document.getElementById('alarmBtnText').textContent = hasAlarm ? 'Désactiver Alarme' : 'Activer Alarme';
    
    openModal('eventDetailModal');
}

function editEventFromDetail() {
    const id = currentDetailEventId;
    closeModal('eventDetailModal');
    openEventModal(id);
}

function toggleAlarmFromDetail() {
    const evt = events.find(function(e) { return e.id === currentDetailEventId; });
    if (!evt) return;
    
    if (evt.alarme) {
        // Désactiver l'alarme
        evt.alarme = null;
        // Annuler les timers
        activeAlarms = activeAlarms.filter(function(a) { return a.eventId !== evt.id; });
        showToast('🔕 Alarme désactivée pour: ' + evt.titre, 'info');
    } else {
        // Activer l'alarme avec config par défaut
        evt.alarme = {
            avance: 15,
            son: 'classic',
            duree: 10,
            repetition: 3,
            intervalle: 5,
            volume: 7,
            time: evt.heureDebut,
            date: evt.dateDebut,
            icone: '🔔'
        };
        scheduleAlarm(evt, evt.alarme);
        showToast('🔔 Alarme activée pour: ' + evt.titre, 'success');
    }
    
    closeModal('eventDetailModal');
    viewEventDetail(currentDetailEventId);
}

// Style pour detail-item dans le modal
const detailItemStyle = document.createElement('style');
detailItemStyle.textContent = '.detail-item{padding:10px;background:var(--blue-lighter);border-radius:var(--radius-xs)}.detail-item label{font-size:.6rem;color:var(--muted);text-transform:uppercase;letter-spacing:.03em;font-weight:600;display:block}.detail-item span{font-size:.8rem;font-weight:600;color:var(--ink);display:block;margin-top:2px}';
document.head.appendChild(detailItemStyle);

// ==================== FONCTIONS SAUVEGARDE ====================
function saveProject() {
    const nom = document.getElementById('projNom').value;
    if (!nom) { showToast('❌ Le nom du projet est obligatoire', 'error'); return; }
    projets.push({
        id: nextProjId++,
        nom: nom,
        porteur: document.getElementById('projPorteur').value || 'Non assigné',
        promo: document.getElementById('projPromo').value,
        cat: document.getElementById('projCat').value,
        budget: parseInt(document.getElementById('projBudget').value) || 0,
        statut: document.getElementById('projStatut').value,
        progression: Math.floor(Math.random() * 30) + 5,
        dateDebut: document.getElementById('projDebut').value,
        lancement: document.getElementById('projLancement').value,
        desc: document.getElementById('projDesc').value
    });
    closeModal('projectModal');
    renderPage(currentPage);
    showToast('✅ Projet "' + nom + '" ajouté avec succès', 'success');
}

function saveStage() {
    const etudiant = document.getElementById('stageEtudiant').value;
    const entreprise = document.getElementById('stageEntreprise').value;
    if (!etudiant || !entreprise) { showToast('❌ Étudiant et entreprise sont obligatoires', 'error'); return; }
    
    const d1 = new Date(document.getElementById('stageDateDebut').value);
    const d2 = new Date(document.getElementById('stageDateFin').value);
    const duree = Math.round((d2 - d1) / (1000 * 60 * 60 * 24 * 30) * 10) / 10;
    
    const editId = document.getElementById('stageModal').dataset.editId;
    
    if (editId) {
        const stage = stages.find(function(s) { return s.id === parseInt(editId); });
        if (stage) {
            stage.etudiant = etudiant;
            stage.promo = document.getElementById('stagePromo').value;
            stage.entreprise = entreprise;
            stage.secteur = document.getElementById('stageSecteur').value;
            stage.poste = document.getElementById('stagePoste').value;
            stage.superviseur = document.getElementById('stageSuperviseur').value;
            stage.dateDebut = document.getElementById('stageDateDebut').value;
            stage.dateFin = document.getElementById('stageDateFin').value;
            stage.duree = duree > 0 ? duree : 3;
            stage.statut = document.getElementById('stageStatut').value;
            stage.evaluation = document.getElementById('stageEval').value;
            showToast('✅ Stage de ' + etudiant + ' modifié avec succès', 'success');
        }
    } else {
        stages.push({
            id: nextStageId++,
            etudiant: etudiant,
            promo: document.getElementById('stagePromo').value,
            entreprise: entreprise,
            secteur: document.getElementById('stageSecteur').value,
            poste: document.getElementById('stagePoste').value,
            superviseur: document.getElementById('stageSuperviseur').value,
            dateDebut: document.getElementById('stageDateDebut').value,
            dateFin: document.getElementById('stageDateFin').value,
            duree: duree > 0 ? duree : 3,
            statut: document.getElementById('stageStatut').value,
            evaluation: document.getElementById('stageEval').value
        });
        showToast('✅ Stage de ' + etudiant + ' ajouté avec succès', 'success');
    }
    
    closeModal('stageModal');
    delete document.getElementById('stageModal').dataset.editId;
    renderPage('stages');
}

function saveMentor() {
    const nom = document.getElementById('mentorNom').value;
    if (!nom) { showToast('❌ Le nom du mentor est obligatoire', 'error'); return; }
    mentors.push({
        id: nextMentorId++,
        nom: nom,
        profession: document.getElementById('mentorProfession').value || 'Non spécifié',
        entreprise: document.getElementById('mentorEntreprise').value || 'Indépendant',
        tel: document.getElementById('mentorTel').value,
        email: document.getElementById('mentorEmail').value,
        specialite: document.getElementById('mentorSpecialite').value,
        projetsSuivis: Math.floor(Math.random() * 5) + 1,
        disponible: document.getElementById('mentorDispo').value
    });
    closeModal('mentorModal');
    renderPage('mentorat');
    showToast('✅ Mentor "' + nom + '" ajouté avec succès', 'success');
}

function saveBP() {
    const titre = document.getElementById('bpTitre').value;
    if (!titre) { showToast('❌ Le titre est obligatoire', 'error'); return; }
    businessPlans.push({
        id: nextBPId++,
        titre: titre,
        porteur: document.getElementById('bpPorteur').value || 'Non assigné',
        statut: document.getElementById('bpStatut').value,
        date: document.getElementById('bpDate').value,
        montant: parseInt(document.getElementById('bpMontant').value) || 0,
        resume: document.getElementById('bpResume').value
    });
    closeModal('bpModal');
    renderPage('businessplan');
    showToast('✅ Business Plan "' + titre + '" ajouté avec succès', 'success');
}

function saveEvent() {
    const titre = document.getElementById('evtTitre').value;
    if (!titre) { showToast('❌ Le titre est obligatoire', 'error'); return; }
    
    const hasAlarm = document.getElementById('evtAlarme').checked;
    let alarmConfig = null;
    
    if (hasAlarm) {
        alarmConfig = {
            avance: parseInt(document.getElementById('alarmAvance').value),
            son: document.getElementById('alarmSon').value,
            duree: parseInt(document.getElementById('alarmDuree').value),
            repetition: parseInt(document.getElementById('alarmRepetition').value),
            intervalle: parseInt(document.getElementById('alarmIntervalle').value),
            volume: parseInt(document.getElementById('alarmVolume').value),
            time: document.getElementById('evtHeureDebut').value,
            date: document.getElementById('evtDateDebut').value,
            icone: document.getElementById('alarmSon').value === 'urgent' ? '🚨' : document.getElementById('alarmSon').value === 'digital' ? '📱' : document.getElementById('alarmSon').value === 'gentle' ? '🎵' : '🔔'
        };
    }
    
    const editId = document.getElementById('eventModal').dataset.editId;
    
    if (editId) {
        const evt = events.find(function(e) { return e.id === parseInt(editId); });
        if (evt) {
            evt.titre = titre;
            evt.cat = document.getElementById('evtCat').value;
            evt.priorite = document.getElementById('evtPriorite').value;
            evt.dateDebut = document.getElementById('evtDateDebut').value;
            evt.dateFin = document.getElementById('evtDateFin').value;
            evt.heureDebut = document.getElementById('evtHeureDebut').value;
            evt.heureFin = document.getElementById('evtHeureFin').value;
            evt.lieu = document.getElementById('evtLieu').value;
            evt.resp = document.getElementById('evtResp').value;
            evt.couleur = document.getElementById('evtCouleur').value;
            evt.statut = document.getElementById('evtStatut').value;
            evt.alarme = alarmConfig;
            
            if (alarmConfig) {
                scheduleAlarm(evt, alarmConfig);
            }
            
            showToast('✅ Événement "' + titre + '" modifié avec succès', 'success');
        }
    } else {
        const newEvent = {
            id: nextEvtId++,
            titre: titre,
            cat: document.getElementById('evtCat').value,
            priorite: document.getElementById('evtPriorite').value,
            dateDebut: document.getElementById('evtDateDebut').value,
            dateFin: document.getElementById('evtDateFin').value,
            heureDebut: document.getElementById('evtHeureDebut').value,
            heureFin: document.getElementById('evtHeureFin').value,
            lieu: document.getElementById('evtLieu').value,
            resp: document.getElementById('evtResp').value,
            couleur: document.getElementById('evtCouleur').value,
            statut: document.getElementById('evtStatut').value,
            alarme: alarmConfig
        };
        events.push(newEvent);
        
        if (alarmConfig) {
            scheduleAlarm(newEvent, alarmConfig);
        }
        
        showToast('✅ Événement "' + titre + '" ajouté avec succès', 'success');
        if (alarmConfig) {
            showToast('🔔 Alarme programmée pour ' + titre, 'info');
        }
    }
    
    closeModal('eventModal');
    delete document.getElementById('eventModal').dataset.editId;
    renderPage('calendrier');
}

function exportPDF() {
    showToast('📄 Fonctionnalité PDF en cours...', 'info');
}

// ==================== KPIs PAR SECTION ====================
function getSectionKpis(section) {
    switch(section) {
        case 'projets':
            const totalBudget = projets.reduce(function(s, p) { return s + p.budget; }, 0);
            const enIncubation = projets.filter(function(p) { return p.statut === 'Incubation'; }).length;
            const termines = projets.filter(function(p) { return p.statut === 'Terminé'; }).length;
            const progressionMoy = projets.length > 0 ? Math.round(projets.reduce(function(s, p) { return s + p.progression; }, 0) / projets.length) : 0;
            const categories = new Set(projets.map(function(p) { return p.cat; })).size;
            return '<div class="stats-grid">' +
                '<div class="stat-card"><div class="stat-info"><span>Total Projets</span><h3>' + projets.length + '</h3></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-rocket"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>En Incubation</span><h3>' + enIncubation + '</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-building"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Terminés</span><h3>' + termines + '</h3></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-check-circle"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Budget Total</span><h3>' + totalBudget.toLocaleString() + ' HTG</h3></div><div class="stat-icon" style="color:var(--orange)"><i class="fas fa-coins"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Progression Moy.</span><h3>' + progressionMoy + '%</h3></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-chart-line"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Catégories</span><h3>' + categories + '</h3></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-tags"></i></div></div>' +
            '</div>';
            
        case 'stages':
            const enCours = stages.filter(function(s) { return s.statut === 'En cours'; }).length;
            const stagesTermines = stages.filter(function(s) { return s.statut === 'Terminé'; }).length;
            const nbEntreprises = new Set(stages.map(function(s) { return s.entreprise; })).size;
            const dureeTotale = stages.reduce(function(s, st) { return s + st.duree; }, 0);
            return '<div class="stats-grid">' +
                '<div class="stat-card"><div class="stat-info"><span>Total Stages</span><h3>' + stages.length + '</h3></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-briefcase"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>En Cours</span><h3>' + enCours + '</h3></div><div class="stat-icon" style="color:var(--teal)"><i class="fas fa-spinner"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Terminés</span><h3>' + stagesTermines + '</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Entreprises</span><h3>' + nbEntreprises + '</h3></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-building"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Durée Totale</span><h3>' + dureeTotale + ' mois</h3></div><div class="stat-icon" style="color:var(--orange)"><i class="fas fa-clock"></i></div></div>' +
            '</div>';
            
        case 'mentorat':
            const dispos = mentors.filter(function(m) { return m.disponible === 'Oui'; }).length;
            const totalSuivis = mentors.reduce(function(s, m) { return s + m.projetsSuivis; }, 0);
            return '<div class="stats-grid">' +
                '<div class="stat-card"><div class="stat-info"><span>Total Mentors</span><h3>' + mentors.length + '</h3></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-user-tie"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Disponibles</span><h3>' + dispos + '</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Projets Suivis</span><h3>' + totalSuivis + '</h3></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-rocket"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Moy/Projets</span><h3>' + (totalSuivis / mentors.length).toFixed(1) + '</h3></div><div class="stat-icon" style="color:var(--orange)"><i class="fas fa-chart-bar"></i></div></div>' +
            '</div>';
            
        case 'businessplan':
            const valides = businessPlans.filter(function(b) { return b.statut === 'Validé'; }).length;
            const enAnalyse = businessPlans.filter(function(b) { return b.statut === 'En analyse'; }).length;
            const montantTotal = businessPlans.reduce(function(s, b) { return s + b.montant; }, 0);
            return '<div class="stats-grid">' +
                '<div class="stat-card"><div class="stat-info"><span>Total BP</span><h3>' + businessPlans.length + '</h3></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-file-contract"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Validés</span><h3>' + valides + '</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>En Analyse</span><h3>' + enAnalyse + '</h3></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-search"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Montant Total</span><h3>' + montantTotal.toLocaleString() + ' HTG</h3></div><div class="stat-icon" style="color:var(--orange)"><i class="fas fa-coins"></i></div></div>' +
            '</div>';
            
        case 'calendrier':
            const confirmees = events.filter(function(e) { return e.statut === 'Confirmé'; }).length;
            const programmes = events.filter(function(e) { return e.statut === 'Programmé'; }).length;
            const urgentes = events.filter(function(e) { return e.priorite === 'Urgente'; }).length;
            const alarmesActives = events.filter(function(e) { return e.alarme !== null; }).length;
            return '<div class="stats-grid">' +
                '<div class="stat-card"><div class="stat-info"><span>Événements</span><h3>' + events.length + '</h3></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-calendar-alt"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Confirmés</span><h3>' + confirmees + '</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Programmés</span><h3>' + programmes + '</h3></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-clock"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Urgentes</span><h3>' + urgentes + '</h3></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-exclamation-circle"></i></div></div>' +
                '<div class="stat-card"><div class="stat-info"><span>Alarmes Actives</span><h3>' + alarmesActives + '</h3></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-bell"></i></div></div>' +
            '</div>';
            
        default:
            return '';
    }
}

// ==================== RENDER PAGES ====================
function renderPage(page) {
    destroyCharts();
    const mc = document.getElementById('mainContent');
    if (!mc) return;
    
    switch(page) {
        case 'projets': mc.innerHTML = renderProjets(); break;
        case 'stages': mc.innerHTML = renderStages(); break;
        case 'mentorat': mc.innerHTML = renderMentorat(); break;
        case 'incubation': mc.innerHTML = renderIncubation(); setTimeout(setupKanbanDrag, 300); break;
        case 'businessplan': mc.innerHTML = renderBusinessPlan(); break;
        case 'calendrier': mc.innerHTML = renderCalendrier(); break;
        default: mc.innerHTML = renderProjets();
    }
}

function renderProjets() {
    const rows = projets.map(function(p) {
        const statutClass = p.statut === 'Incubation' ? 'pill-success' : p.statut === 'Terminé' ? 'pill-purple' : p.statut === 'Lancement' ? 'pill-orange' : 'pill-muted';
        const progColor = p.progression >= 80 ? 'var(--success)' : p.progression >= 40 ? 'var(--warning)' : 'var(--blue)';
        return '<tr><td><span class="pill pill-muted">#' + p.id + '</span></td><td style="font-weight:600">' + p.nom + '</td><td>' + p.porteur + '</td><td><span class="pill pill-info">' + p.cat + '</span></td><td>' + p.budget.toLocaleString() + ' HTG</td><td><span class="pill ' + statutClass + '">' + p.statut + '</span></td><td><div style="display:flex;align-items:center;gap:8px">' + p.progression + '%<div style="flex:1;height:5px;background:#e5e7eb;border-radius:5px;overflow:hidden"><div style="width:' + p.progression + '%;height:100%;background:' + progColor + ';border-radius:5px"></div></div></div></td><td>' + p.dateDebut + '</td><td><div class="btn-group"><button class="btn btn-sm btn-outline btn-icon" title="Voir détails" onclick="viewProjectDetail(' + p.id + ')"><i class="fas fa-eye"></i></button><button class="btn btn-sm btn-outline btn-icon" title="Business Plan" onclick="openBPModal()"><i class="fas fa-file-contract"></i></button></div></td></tr>';
    }).join('');
    
    return getSectionKpis('projets') +
    '<div class="filters-row"><div class="search-box"><i class="fas fa-search"></i><input placeholder="Rechercher projet..." oninput="filterTable(this.value,\'projTbody\')"></div><select class="filter-select" onchange="filterByStatus(this.value,\'projTbody\')"><option value="tous">Tous statuts</option><option>Idée</option><option>Étude</option><option>Incubation</option><option>Recherche financement</option><option>Lancement</option><option>Terminé</option></select></div><div class="card"><div class="card-header"><h2><i class="fas fa-rocket"></i> Projets Entrepreneuriaux</h2><button class="btn btn-primary btn-sm" onclick="openProjectModal()"><i class="fas fa-plus"></i> Nouveau projet</button></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Nom</th><th>Porteur</th><th>Catégorie</th><th>Budget</th><th>Statut</th><th>Progression</th><th>Date</th><th>Actions</th></tr></thead><tbody id="projTbody">' + rows + '</tbody></table></div></div>';
}

function renderStages() {
    const rows = stages.map(function(s) {
        const evalClass = s.evaluation.includes('A') ? 'pill-success' : s.evaluation.includes('B') ? 'pill-info' : s.evaluation === '—' ? 'pill-muted' : 'pill-warning';
        return '<tr><td><span class="pill pill-muted">#' + s.id + '</span></td><td style="font-weight:600">' + s.etudiant + '</td><td>' + s.promo + '</td><td>' + s.entreprise + '</td><td><span class="pill pill-info">' + s.secteur + '</span></td><td>' + s.poste + '</td><td>' + s.superviseur + '</td><td>' + s.dateDebut + ' → ' + s.dateFin + '</td><td>' + s.duree + ' mois</td><td><span class="pill ' + (s.statut === 'En cours' ? 'pill-teal' : s.statut === 'Terminé' ? 'pill-purple' : 'pill-warning') + '">' + s.statut + '</span></td><td><span class="pill ' + evalClass + '">' + s.evaluation + '</span></td><td><div class="btn-group"><button class="btn btn-sm btn-outline btn-icon" title="Voir détails" onclick="viewStageDetail(' + s.id + ')"><i class="fas fa-eye"></i></button><button class="btn btn-sm btn-warning btn-icon" title="Modifier stage" onclick="openStageModal(' + s.id + ')" style="background:linear-gradient(135deg,var(--warning),#d97706);color:white;border:none"><i class="fas fa-edit"></i></button></div></td></tr>';
    }).join('');
    
    return getSectionKpis('stages') +
    '<div class="filters-row"><div class="search-box"><i class="fas fa-search"></i><input placeholder="Rechercher..." oninput="filterTable(this.value,\'stageTbody\')"></div><select class="filter-select" onchange="filterByStatus(this.value,\'stageTbody\')"><option value="tous">Tous statuts</option><option>En attente</option><option>En cours</option><option>Terminé</option></select></div><div class="card"><div class="card-header"><h2><i class="fas fa-briefcase"></i> Stages & Insertion Professionnelle</h2><button class="btn btn-warning btn-sm" onclick="openStageModal()"><i class="fas fa-plus"></i> Nouveau stage</button></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Étudiant</th><th>Promo</th><th>Entreprise</th><th>Secteur</th><th>Poste</th><th>Superviseur</th><th>Période</th><th>Durée</th><th>Statut</th><th>Éval.</th><th>Actions</th></tr></thead><tbody id="stageTbody">' + rows + '</tbody></table></div></div>';
}

function renderMentorat() {
    const rows = mentors.map(function(m) {
        return '<tr><td><span class="pill pill-muted">#' + m.id + '</span></td><td style="font-weight:600">' + m.nom + '</td><td>' + m.profession + '</td><td>' + m.entreprise + '</td><td>' + m.tel + '</td><td>' + m.email + '</td><td><span class="pill pill-info">' + m.specialite + '</span></td><td>' + m.projetsSuivis + '</td><td><span class="pill ' + (m.disponible === 'Oui' ? 'pill-success' : 'pill-warning') + '">' + m.disponible + '</span></td><td><div class="btn-group"><button class="btn btn-sm btn-outline btn-icon" title="Voir détails" onclick="viewMentorDetail(' + m.id + ')"><i class="fas fa-eye"></i></button></div></td></tr>';
    }).join('');
    
    return getSectionKpis('mentorat') +
    '<div class="filters-row"><div class="search-box"><i class="fas fa-search"></i><input placeholder="Rechercher mentor..." oninput="filterTable(this.value,\'mentorTbody\')"></div></div><div class="card"><div class="card-header"><h2><i class="fas fa-user-tie"></i> Mentorat</h2><button class="btn btn-primary btn-sm" onclick="openMentorModal()"><i class="fas fa-plus"></i> Nouveau mentor</button></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Nom</th><th>Profession</th><th>Entreprise</th><th>Tél</th><th>Email</th><th>Spécialité</th><th>Projets</th><th>Dispo</th><th>Actions</th></tr></thead><tbody id="mentorTbody">' + rows + '</tbody></table></div></div>';
}

function renderIncubation() {
    const colonnes = ['Idée', 'Étude', 'Incubation', 'Recherche financement', 'Lancement', 'Terminé'];
    const icons = {Idée: 'fa-lightbulb', Étude: 'fa-search', Incubation: 'fa-building', 'Recherche financement': 'fa-coins', Lancement: 'fa-rocket', Terminé: 'fa-check-circle'};
    const colors = {Idée: 'var(--muted)', Étude: 'var(--info)', Incubation: 'var(--success)', 'Recherche financement': 'var(--orange)', Lancement: 'var(--purple)', Terminé: 'var(--blue)'};
    
    let html = '<div class="alert-box alert-info"><i class="fas fa-info-circle"></i> <strong>Glissez-déposez</strong> les cartes entre les colonnes pour changer le statut des projets.</div>';
    html += '<div class="card"><div class="card-header"><h2><i class="fas fa-building"></i> Pipeline Incubation (Kanban)</h2><span class="pill pill-info">' + projets.length + ' projets</span></div>';
    html += '<div class="kanban-wrapper"><div class="kanban-board">';
    
    colonnes.forEach(function(col) {
        const projs = projets.filter(function(p) { return p.statut === col; });
        html += '<div class="kanban-column" data-statut="' + col + '"><h4 style="color:' + colors[col] + '"><i class="fas ' + icons[col] + '"></i> ' + col + ' <span class="pill pill-muted" style="font-size:.6rem">' + projs.length + '</span></h4>';
        html += '<div class="kanban-cards">';
        projs.forEach(function(p) {
            html += '<div class="kanban-card" draggable="true" data-proj-id="' + p.id + '"><div class="kc-title">' + p.nom + '</div><div class="kc-meta">👤 ' + p.porteur + ' · 📂 ' + p.cat + '</div><div class="progress-bar-sm"><div class="progress-bar-sm-fill" style="width:' + p.progression + '%;background:' + colors[col] + '"></div></div><div class="kc-footer"><span>' + p.progression + '%</span><span>💰 ' + p.budget.toLocaleString() + ' HTG</span></div><div class="kc-actions"><button onclick="event.stopPropagation();viewProjectDetail(' + p.id + ')" title="Voir détails"><i class="fas fa-eye"></i></button></div></div>';
        });
        if (projs.length === 0) html += '<div style="text-align:center;padding:20px 10px;color:var(--muted-light);font-size:.65rem"><i class="fas fa-inbox" style="font-size:1.5rem;display:block;margin-bottom:6px"></i> Vide</div>';
        html += '</div></div>';
    });
    
    html += '</div></div></div>';
    return html;
}

function renderBusinessPlan() {
    const rows = businessPlans.map(function(bp) {
        const statutClass = bp.statut === 'Validé' ? 'pill-success' : bp.statut === 'Rejeté' ? 'pill-danger' : bp.statut === 'En analyse' ? 'pill-warning' : 'pill-muted';
        return '<tr><td><span class="pill pill-muted">#' + bp.id + '</span></td><td style="font-weight:600">' + bp.titre + '</td><td>' + bp.porteur + '</td><td>' + bp.montant.toLocaleString() + ' HTG</td><td><span class="pill ' + statutClass + '">' + bp.statut + '</span></td><td>' + bp.date + '</td><td><div class="btn-group"><button class="btn btn-sm btn-outline btn-icon" title="Voir détails" onclick="viewBPDetail(' + bp.id + ')"><i class="fas fa-eye"></i></button></div></td></tr>';
    }).join('');
    
    return getSectionKpis('businessplan') +
    '<div class="card"><div class="card-header"><h2><i class="fas fa-file-contract"></i> Plans d\'Affaires</h2><button class="btn btn-primary btn-sm" onclick="openBPModal()"><i class="fas fa-plus"></i> Nouveau Business Plan</button></div><div class="table-wrap"><table><thead><tr><th>ID</th><th>Titre</th><th>Porteur</th><th>Montant</th><th>Statut</th><th>Date</th><th>Actions</th></tr></thead><tbody id="bpTbody">' + rows + '</tbody></table></div></div>';
}

function renderCalendrier() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    
    let calHTML = '<div class="cal-grid">';
    dayNames.forEach(function(d) { calHTML += '<div class="cal-header">' + d + '</div>'; });
    for (let i = 0; i < firstDay; i++) calHTML += '<div></div>';
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        const dayEvents = events.filter(function(e) { return e.dateDebut <= dateStr && e.dateFin >= dateStr; });
        const isToday = (d === now.getDate() && month === now.getMonth());
        const hasAlarm = dayEvents.some(function(e) { return e.alarme !== null; });
        calHTML += '<div class="cal-day' + (isToday ? ' today' : '') + (dayEvents.length > 0 ? ' has-events' : '') + '" onclick="showDayEvents(\'' + dateStr + '\')">';
        calHTML += '<div class="day-num' + (isToday ? ' today-num' : '') + '">' + d + '</div>';
        if (hasAlarm) calHTML += '<span class="alarm-badge" title="Alarme(s) programmée(s)">🔔</span>';
        dayEvents.forEach(function(e) { calHTML += '<span class="event-dot event-' + e.couleur + '" title="' + e.titre + '"></span>'; });
        if (dayEvents.length > 0) calHTML += '<div style="font-size:.55rem;color:var(--muted);margin-top:2px">' + dayEvents.length + ' évts</div>';
        calHTML += '</div>';
    }
    calHTML += '</div>';

    const evtRows = events.sort(function(a, b) { return a.dateDebut.localeCompare(b.dateDebut); }).map(function(e) {
        const prioClass = e.priorite === 'Urgente' ? 'pill-danger' : e.priorite === 'Importante' ? 'pill-warning' : 'pill-info';
        const statutClass = e.statut === 'Confirmé' ? 'pill-success' : e.statut === 'Programmé' ? 'pill-warning' : 'pill-muted';
        const hasAlarm = e.alarme ? ' <i class="fas fa-bell" style="color:var(--red);animation:pulse 1.5s infinite" title="Alarme active"></i>' : '';
        return '<tr style="cursor:pointer" onclick="viewEventDetail(' + e.id + ')"><td style="font-weight:600">' + e.titre + hasAlarm + '</td><td><span class="pill pill-info">' + e.cat + '</span></td><td>' + e.dateDebut + '</td><td>' + e.heureDebut + '-' + e.heureFin + '</td><td>' + e.lieu + '</td><td>' + e.resp + '</td><td><span class="pill ' + prioClass + '">' + e.priorite + '</span></td><td><span class="pill ' + statutClass + '">' + e.statut + '</span></td><td><div class="btn-group" onclick="event.stopPropagation()"><button class="btn btn-sm btn-outline btn-icon" title="Voir détails" onclick="viewEventDetail(' + e.id + ')"><i class="fas fa-eye"></i></button><button class="btn btn-sm btn-outline btn-icon" title="Modifier" onclick="openEventModal(' + e.id + ')"><i class="fas fa-edit"></i></button></div></td></tr>';
    }).join('');

    return getSectionKpis('calendrier') +
    '<div class="card"><div class="card-header"><h2><i class="fas fa-calendar-alt"></i> Calendrier — ' + now.toLocaleDateString('fr-FR', {month: 'long', year: 'numeric'}) + '</h2><button class="btn btn-success btn-sm" onclick="openEventModal()"><i class="fas fa-plus"></i> Événement</button></div>' + calHTML + '</div>' +
    '<div class="card"><div class="card-header"><h2><i class="fas fa-list"></i> Liste des Événements <small style="font-weight:400;color:var(--muted)">(Cliquez pour voir détails)</small></h2></div><div class="table-wrap"><table><thead><tr><th>Titre</th><th>Type</th><th>Date</th><th>Heure</th><th>Lieu</th><th>Resp.</th><th>Priorité</th><th>Statut</th><th>Actions</th></tr></thead><tbody>' + evtRows + '</tbody></table></div></div>';
}

function showDayEvents(dateStr) {
    const dayEvents = events.filter(function(e) { return e.dateDebut <= dateStr && e.dateFin >= dateStr; });
    if (dayEvents.length === 0) {
        showToast('Aucun événement le ' + dateStr, 'info');
        return;
    }
    if (dayEvents.length === 1) {
        viewEventDetail(dayEvents[0].id);
    } else {
        // Afficher liste des événements du jour
        const listHTML = dayEvents.map(function(e) {
            return '<div style="padding:8px;cursor:pointer;border-bottom:1px solid var(--border-light)" onclick="closeModal(\'detailModal\');viewEventDetail(' + e.id + ')"><strong>' + e.titre + '</strong><br><span style="font-size:.7rem;color:var(--muted)">' + e.heureDebut + '-' + e.heureFin + ' | ' + e.lieu + '</span></div>';
        }).join('');
        document.getElementById('detailBody').innerHTML = '<h3 style="margin-bottom:10px">📅 Événements du ' + dateStr + '</h3>' + listHTML;
        openModal('detailModal');
    }
}

// ==================== KANBAN DRAG & DROP ====================
function setupKanbanDrag() {
    document.querySelectorAll('.kanban-card').forEach(function(card) {
        card.setAttribute('draggable', 'true');
        card.addEventListener('dragstart', function(e) {
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', this.dataset.projId);
        });
        card.addEventListener('dragend', function(e) {
            this.classList.remove('dragging');
            document.querySelectorAll('.kanban-column').forEach(function(col) { col.classList.remove('drag-over'); });
        });
    });
    
    document.querySelectorAll('.kanban-column').forEach(function(col) {
        col.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('drag-over');
        });
        col.addEventListener('dragleave', function(e) { this.classList.remove('drag-over'); });
        col.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            const projId = parseInt(e.dataTransfer.getData('text/plain'));
            const newStatut = this.dataset.statut;
            const proj = projets.find(function(p) { return p.id === projId; });
            if (proj && proj.statut !== newStatut) {
                proj.statut = newStatut;
                proj.progression = Math.min(100, proj.progression + Math.floor(Math.random() * 15) + 5);
                renderPage('incubation');
                showToast('✅ Projet "' + proj.nom + '" déplacé vers "' + newStatut + '"', 'success');
            }
        });
    });
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
    renderPage('projets');
    console.log('✅ Incubateur Projets & Calendrier CEJEC - Prêt!');
    console.log('🔔 Système d\'alarme activé - Les événements avec alarme sonneront à l\'heure programmée');
});