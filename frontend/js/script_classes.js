const API_BASE = 'https://gestion-scolaire-backend.onrender.com/api/v1';

let coursCEJEC=[];
let profsCEJEC=[];         // gardé pour compat (liste de noms), plus utilisé pour l'éditeur
let classesData=[];        // Liste des SchoolClass (une carte = une classe/niveau)
let specializationsData=[]; // Liste des filières (pour le select + aperçu du nom)
let coursesRaw=[];         // Liste brute des cours (rattachés à une filière) — page chargée
let teachersRaw=[];        // Liste brute des professeurs, source de vérité pour les selects

// Vrai nombre total de cours en base (depuis le champ "count" de la pagination
// DRF), distinct de coursesRaw.length qui ne reflète que la page chargée.
let totalCoursesInDb = 0;

let newlyCreatedClassId=null;

// Garde les IDs des cours d'origine de la filière en cours d'édition,
// pour pouvoir détecter/supprimer ceux qui ont été retirés de l'éditeur.
let originalCourseIds=[];

async function apiFetch(path, options = {}) {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { ...headers, ...(options.headers || {}) } });
    if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const firstMsg = errData.detail || Object.values(errData)[0] || `HTTP ${res.status}`;
        throw new Error(Array.isArray(firstMsg) ? firstMsg[0] : firstMsg);
    }
    if (res.status === 204) return null;
    return res.json();
}

function showToast(msg,type='success'){const icons={success:'fa-check-circle',error:'fa-times-circle',info:'fa-info-circle'};const el=document.createElement('div');el.className=`toast toast-${type}`;el.innerHTML=`<i class="fas ${icons[type]}"></i> ${msg}`;document.getElementById('toastContainer').appendChild(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(100px)';el.style.transition='all .3s';setTimeout(()=>el.remove(),300)},3000)}

// TeacherListSerializer expose full_name/email À PLAT (pas de "user_details"
// imbriqué) : c'est le seul endroit qui décide comment afficher le nom d'un
// professeur, pour éviter de retomber sur l'étiquette générique "Prof {id}".
function getTeacherDisplayName(t){
    if (!t) return null;
    return t.full_name || t.email || `Prof ${t.id}`;
}

// ==================== CHARGEMENT ====================

async function loadDataFromApi() {
    try {
        // page_size élevé : on veut la liste COMPLÈTE (pas juste la 1ère page)
        // pour construire correctement les cartes de classes et les selects.
        const [specsRes, classesRes, coursesRes, teachersRes] = await Promise.all([
            apiFetch('/students/specializations/?page_size=1000'),
            apiFetch('/students/classes/?page_size=1000'),
            apiFetch('/courses/courses/?page_size=1000'),
            apiFetch('/teachers/?page_size=1000')
        ]);

        specializationsData = specsRes?.results || specsRes || [];
        const classes = classesRes?.results || classesRes || [];
        coursesRaw = coursesRes?.results || coursesRes || [];
        teachersRaw = teachersRes?.results || teachersRes || [];

        // Le vrai total en base : si l'API est paginée, "count" est le nombre
        // réel de lignes en base (même si results n'en contient qu'une partie).
        // Sinon (liste brute non paginée), on retombe sur la longueur du tableau.
        totalCoursesInDb = typeof coursesRes?.count === 'number'
            ? coursesRes.count
            : coursesRaw.length;

        profsCEJEC = teachersRaw.map(t => getTeacherDisplayName(t));

        // Datalist des cours (auto-complétion en texte libre : le nom du cours
        // reste un champ texte, seul le professeur devient un vrai select).
        const datalistCours = document.getElementById('coursList');
        if (datalistCours) {
            datalistCours.innerHTML = '';
            coursCEJEC = [...new Set(coursesRaw.map(c => c.name))];
            coursCEJEC.forEach(c => { const opt = document.createElement('option'); opt.value = c; datalistCours.appendChild(opt); });
        }

        // Select Filière dans la modale
        populateSpecializationSelect();

        // Construction des classes affichées (cartes)
        classesData = classes.map(cls => {
            const specId = typeof cls.specialization === 'object' ? cls.specialization.id : cls.specialization;
            const specName = cls.specialization_name || (specializationsData.find(s => s.id === specId)?.name) || 'Filière inconnue';

            const specCourses = coursesRaw.filter(c => {
                // CourseListSerializer (utilisée par GET /courses/courses/) ne renvoie
                // PAS l'id "specialization", seulement "specialization_name" : on
                // matche par id quand il est présent (détail), sinon par nom (liste).
                const cid = typeof c.specialization === 'object' ? c.specialization?.id : c.specialization;
                if (cid != null) return cid === specId;
                return (c.specialization_name || '').trim().toLowerCase() === (specName || '').trim().toLowerCase();
            });

            const coursProfesseurs = specCourses.map(c => {
                // Idem pour le professeur : la liste renvoie "teacher_name" (texte)
                // mais pas forcément l'id "teacher". On priorise le nom fourni
                // directement par l'API — c'est la source la plus fiable.
                const teacherIdFromApi = typeof c.teacher === 'object' ? c.teacher?.id : c.teacher;
                let profName = c.teacher_name || null;
                if (!profName && teacherIdFromApi) {
                    const t = teachersRaw.find(tchr => tchr.id === teacherIdFromApi);
                    if (t) profName = getTeacherDisplayName(t);
                }
                if (!profName) profName = "Non assigné";

                // Id du professeur nécessaire pour pré-sélectionner le bon <option>
                // dans l'éditeur : si l'API ne l'a pas fourni, on le retrouve par nom.
                let teacherId = teacherIdFromApi ?? null;
                if (teacherId == null && profName !== "Non assigné") {
                    const t = teachersRaw.find(tchr => getTeacherDisplayName(tchr) === profName);
                    teacherId = t ? t.id : null;
                }

                return { cours: c.name, professeur: profName, teacherId, courseId: c.id };
            });
            return {
                id: cls.id,
                name: cls.name,
                specializationId: specId,
                specializationName: specName,
                level: cls.level,
                room: cls.room || 'N/A',
                capacity: cls.capacity || 0,
                tuition_fee: cls.tuition_fee ?? 0,
                studentCount: cls.student_count ?? 0,
                coursProfesseurs
            };
        });

        renderDashboard();
    } catch (err) {
        console.error("Error loading data from API", err);
        showToast("Erreur de chargement des données depuis l'API : " + err.message, "error");
    }
}

function populateSpecializationSelect(selectedId) {
    const select = document.getElementById('modalSpecialization');
    if (!select) return;
    const previous = selectedId ?? select.value;
    select.innerHTML = '<option value="">— Sélectionner une filière —</option>' +
        specializationsData.map(s => `<option value="${s.id}">${escapeHtmlLocal(s.name)}</option>`).join('');
    if (previous) select.value = previous;
}

function escapeHtmlLocal(str){ if (str === undefined || str === null) return ''; const div=document.createElement('div'); div.textContent=String(str); return div.innerHTML; }

// ==================== STATS / DASHBOARD ====================

// Ne compte pas "Non assigné" comme un professeur, et se base sur les
// cours bruts (pas par carte) pour éviter les doublons entre niveaux
// d'une même filière qui partagent le même programme.
// Utilise teacher_name (toujours fourni par CourseListSerializer) plutôt que
// l'id "teacher" qui n'est pas exposé par l'endpoint liste.
function getAllProfs(){
    const allProfs = new Set();
    coursesRaw.forEach(c => {
        if (c.teacher_name) {
            allProfs.add(c.teacher_name);
            return;
        }
        if (!c.teacher) return;
        const t = teachersRaw.find(tchr => tchr.id === (typeof c.teacher === 'object' ? c.teacher.id : c.teacher));
        const name = t ? getTeacherDisplayName(t) : null;
        if (name) allProfs.add(name);
    });
    return allProfs.size;
}

function renderDashboard(){
    const dc=document.getElementById('dashboard-content');dc.innerHTML='';
    document.getElementById('total-classes-text').textContent=`${classesData.length} classe(s) au total`;
    document.getElementById('statClasses').textContent=classesData.length;
    document.getElementById('statCours').textContent=totalCoursesInDb; // vrai total en base, pas juste la page chargée
    document.getElementById('statEleves').textContent=classesData.reduce((s,c)=>s+(c.studentCount||0),0);
    document.getElementById('statProfs').textContent=getAllProfs();

    const allClasses=classesData.slice().reverse();

    const section=document.createElement('div');
    section.className='classes-section';
    section.innerHTML=`
        <div class="classes-section-header">
            <h2><i class="fas fa-layer-group"></i> Toutes les Classes</h2>
            <span class="classes-count-badge">${allClasses.length} classe(s)</span>
        </div>
    `;

    const scrollWrapper=document.createElement('div');
    scrollWrapper.className='classes-scroll-wrapper';

    const row=document.createElement('div');
    row.className='classes-row';

    if (allClasses.length === 0) {
        row.innerHTML = `<div class="empty-state" style="padding:30px"><i class="fas fa-school"></i><h3>Aucune classe</h3><p>Cliquez sur "Ajouter une Classe" pour commencer.</p></div>`;
    }

    allClasses.forEach(cls=>{
        const card=document.createElement('div');

        let cardClass='class-card';
        if(cls.id===newlyCreatedClassId)cardClass+=' new-class';
        card.className=cardClass;

        const isNew=cls.id===newlyCreatedClassId;

        const cpRows=(cls.coursProfesseurs||[]).map(cp=>`
            <div class="cours-prof-row">
                <span class="matiere-tag">${escapeHtmlLocal(cp.cours)}</span>
                <span class="prof-tag"><i class="fas fa-chalkboard-teacher"></i> ${escapeHtmlLocal(cp.professeur)}</span>
            </div>`).join('');

        card.innerHTML=`
            <div class="card-header">
                <div class="card-title-box">
                    <div class="icon-book"><i class="fas fa-book-open"></i></div>
                    <div>
                        <div class="class-name">${escapeHtmlLocal(cls.name)} ${isNew?'<span class="badge-new">NOUVEAU</span>':''}</div>
                        <div class="class-subtitle"><i class="fas fa-graduation-cap"></i> ${escapeHtmlLocal(cls.specializationName)} <span class="dot"></span> ${escapeHtmlLocal(cls.room||'Salle N/A')}</div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-action btn-edit" onclick="editClass(${cls.id})" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-delete" onclick="deleteClass(${cls.id})" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
            <div class="card-body">
                <div class="info-badges">
                    <span class="info-badge"><i class="fas fa-user-graduate"></i> ${cls.studentCount}/${cls.capacity} élèves</span>
                    <span class="info-badge"><i class="fas fa-door-open"></i> ${escapeHtmlLocal(cls.room||'N/A')}</span>
                </div>
                <div class="divider"></div>
                <div class="cours-prof-list">
                    <div class="cours-prof-title">Cours & Professeurs — ${escapeHtmlLocal(cls.specializationName)} (${(cls.coursProfesseurs||[]).length})</div>
                    ${cpRows || '<span style="font-size:.75rem;color:var(--muted)">Aucun cours pour cette filière</span>'}
                </div>
            </div>`;
        row.appendChild(card);
    });

    scrollWrapper.appendChild(row);
    section.appendChild(scrollWrapper);
    dc.appendChild(section);

    if(allClasses.length>2){
        const indicator=document.createElement('div');
        indicator.className='scroll-indicator';
        indicator.innerHTML='<i class="fas fa-chevron-left"></i> Faites défiler pour voir toutes les classes <i class="fas fa-chevron-right"></i>';
        dc.appendChild(indicator);
        setTimeout(()=>{if(indicator)indicator.style.display='none'},8000);
    }

    if(newlyCreatedClassId){
        setTimeout(()=>{
            newlyCreatedClassId=null;
            renderDashboard();
        },3000);
    }
}

// ==================== SUPPRESSION D'UNE CLASSE ====================

async function deleteClass(id){
    const cls=classesData.find(c=>c.id===id);if(!cls)return;
    if(confirm(`Confirmer la suppression de la classe "${cls.name}" ?\n\n(Les cours de la filière "${cls.specializationName}" ne seront PAS supprimés, seule la classe/niveau disparaît.)`)){
        try {
            await apiFetch(`/students/classes/${id}/`, { method: 'DELETE' });
            showToast(`Classe "${cls.name}" supprimée`,'error');
            loadDataFromApi();
        } catch (err) {
            showToast(`Erreur lors de la suppression: ${err.message}`, 'error');
        }
    }
}

// ==================== ÉDITEUR COURS/PROFS ====================

// Construit les <option> du select professeur à partir des profs réellement
// chargés depuis la base (teachersRaw). "" = Non assigné.
function buildProfSelectOptions(selectedTeacherId){
    const selId = selectedTeacherId != null ? String(selectedTeacherId) : '';
    let html = `<option value="">— Non assigné —</option>`;
    teachersRaw.forEach(t => {
        const name = getTeacherDisplayName(t);
        const val = String(t.id);
        html += `<option value="${val}" ${val === selId ? 'selected' : ''}>${escapeHtmlLocal(name)}</option>`;
    });
    return html;
}

function addCoursProfRow(cours='', teacherId=null, courseId=''){
    const editor=document.getElementById('coursProfEditor');
    const row=document.createElement('div');row.className='cours-prof-editor-row';
    row.dataset.courseId = courseId || '';
    row.innerHTML=`
        <input type="text" class="cours-input" placeholder="Nom du cours" value="${escapeHtmlLocal(cours)}" list="coursList" style="flex:1">
        <select class="prof-select" style="flex:1">${buildProfSelectOptions(teacherId)}</select>
        <button type="button" class="btn-remove-prof-row" onclick="this.closest('.cours-prof-editor-row').remove()"><i class="fas fa-times"></i></button>`;
    editor.appendChild(row);
}

function populateCoursProfEditor(coursProfesseurs){
    const editor=document.getElementById('coursProfEditor');editor.innerHTML='';
    if(coursProfesseurs&&coursProfesseurs.length>0){coursProfesseurs.forEach(cp=>addCoursProfRow(cp.cours,cp.teacherId,cp.courseId))}
    else{addCoursProfRow();addCoursProfRow()}
}

function getCoursProfFromEditor(){
    const rows=document.querySelectorAll('#coursProfEditor .cours-prof-editor-row');const result=[];
    rows.forEach(row=>{
        const cours=row.querySelector('.cours-input')?.value?.trim();
        const teacherIdRaw=row.querySelector('.prof-select')?.value;
        const teacherId = teacherIdRaw ? parseInt(teacherIdRaw, 10) : null;
        const courseId=row.dataset.courseId || null;
        if(cours)result.push({cours,teacherId,courseId});
    });
    return result;
}

// ==================== FILIÈRE RAPIDE ====================

async function promptNewSpecialization(){
    const name = prompt('Nom de la nouvelle filière (ex: "Informatique") :');
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (specializationsData.some(s => s.name.toLowerCase() === trimmed.toLowerCase())) {
        showToast('Cette filière existe déjà', 'error');
        return;
    }
    try {
        const spec = await apiFetch('/students/specializations/', {
            method: 'POST',
            body: JSON.stringify({ name: trimmed, description: '', is_active: true })
        });
        specializationsData.push(spec);
        populateSpecializationSelect(spec.id);
        updateNamePreview();
        showToast(`Filière "${trimmed}" créée`, 'success');
    } catch (err) {
        showToast(`Erreur lors de la création de la filière : ${err.message}`, 'error');
    }
}

// ==================== APERÇU DU NOM ====================

function updateNamePreview(){
    const select = document.getElementById('modalSpecialization');
    const niveau = document.getElementById('modalNiveau')?.value;
    const preview = document.getElementById('modalNamePreview');
    if (!select || !preview) return;
    const specName = select.options[select.selectedIndex]?.textContent;
    if (select.value && niveau) {
        preview.value = `${specName} ${niveau}`;
        preview.style.color = '';
    } else {
        preview.value = '';
        preview.placeholder = '— sélectionnez une filière et un niveau —';
    }
}

// ==================== MODALE ====================

function editClass(id){
    const cls=classesData.find(c=>c.id===id);if(!cls)return;
    document.getElementById('modalTitle').innerHTML='<i class="fas fa-edit"></i> Modifier la Classe';
    document.getElementById('editClassId').value=cls.id;
    populateSpecializationSelect(cls.specializationId);
    document.getElementById('modalNiveau').value=cls.level;
    document.getElementById('modalStudents').value=cls.capacity;
    document.getElementById('modalRoom').value=cls.room||'';
    document.getElementById('modalTuitionFee').value = cls.tuition_fee ?? 0;
    updateNamePreview();

    const countRow = document.getElementById('currentCountRow');
    if (countRow) {
        countRow.style.display='block';
        document.getElementById('modalCurrentCount').textContent = cls.studentCount;
    }

    populateCoursProfEditor(cls.coursProfesseurs||[]);
    originalCourseIds = (cls.coursProfesseurs||[]).map(cp=>cp.courseId).filter(Boolean);
    document.getElementById('addClassModal').classList.add('open');
}

function openModal(){
    document.getElementById('modalTitle').innerHTML='<i class="fas fa-plus"></i> Ajouter une Classe';
    document.getElementById('editClassId').value='';
    populateSpecializationSelect('');
    document.getElementById('modalNiveau').value='1';
    document.getElementById('modalStudents').value='25';
    document.getElementById('modalRoom').value='';
    document.getElementById('modalTuitionFee').value = 0;
    updateNamePreview();

    const countRow = document.getElementById('currentCountRow');
    if (countRow) countRow.style.display='none';

    populateCoursProfEditor([]);
    originalCourseIds = [];
    document.getElementById('addClassModal').classList.add('open');
}

function closeModal(){document.getElementById('addClassModal').classList.remove('open')}
document.getElementById('addClassModal').addEventListener('click',function(e){if(e.target===this)closeModal()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});
document.getElementById('btn-add-class').addEventListener('click',openModal);

// ==================== ENREGISTREMENT ====================

async function saveClass(){
    const editId=document.getElementById('editClassId').value;
    const specializationId=document.getElementById('modalSpecialization').value;
    const level=document.getElementById('modalNiveau').value;
    const capacity=document.getElementById('modalStudents').value;
    const room=document.getElementById('modalRoom').value.trim();
    const tuitionFeeInput = document.getElementById('modalTuitionFee').value.trim();
    const tuitionFee = Number(tuitionFeeInput);
    const coursProfesseurs=getCoursProfFromEditor();

    if(!specializationId){showToast('Veuillez sélectionner une filière','error');return}
    if(!level || parseInt(level) < 1){showToast('Le niveau doit être un nombre supérieur ou égal à 1','error');return}
    if(tuitionFeeInput === '' || !Number.isFinite(tuitionFee) || tuitionFee < 0){showToast('Les frais de scolarité doivent être un montant positif ou nul','error');return}
    if(coursProfesseurs.length===0){showToast('Ajoutez au moins un cours','error');return}

    const btnSave = document.querySelector('#addClassModal .btn-primary');

    try {
        let classId = editId;
        if (btnSave) btnSave.disabled = true;

        const classPayload = {
            specialization: parseInt(specializationId),
            level: parseInt(level),
            room: room,
            capacity: parseInt(capacity) || 25,
            tuition_fee: tuitionFee,
        };

        if(editId){
            await apiFetch(`/students/classes/${editId}/`, { method: 'PATCH', body: JSON.stringify(classPayload) });
            showToast(`Classe modifiée`,'success');
        } else {
            const clsRes = await apiFetch(`/students/classes/`, { method: 'POST', body: JSON.stringify(classPayload) });
            classId = clsRes.id;
            newlyCreatedClassId = classId;
            showToast(`Classe ajoutée avec succès!`,'success');
        }

        // Les cours sont rattachés à la FILIÈRE (specializationId), pas à la classe.
        // Le professeur vient directement de l'id sélectionné dans le <select>
        // (plus de correspondance approximative par nom).
        let courseErrors = 0;
        const keptCourseIds = [];

        for (const cp of coursProfesseurs) {
            const payload = {
                name: cp.cours,
                specialization: parseInt(specializationId),
                teacher: cp.teacherId, // id réel du professeur, ou null si "Non assigné"
                duration_weeks: 12,
                capacity_max: 30,
                fees_amount: "100.00",
                status: 'active'
            };

            try {
                if (cp.courseId) {
                    await apiFetch(`/courses/courses/${cp.courseId}/`, { method: 'PATCH', body: JSON.stringify(payload) });
                    keptCourseIds.push(String(cp.courseId));
                } else {
                    payload.code = `CEJEC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                    const created = await apiFetch('/courses/courses/', { method: 'POST', body: JSON.stringify(payload) });
                    if (created && created.id) keptCourseIds.push(String(created.id));
                }
            } catch (e) {
                courseErrors++;
                console.warn("Échec sur le cours", cp.cours, e);
            }
        }

        // Les cours sont partagés par toute la filière : les retirer de cette
        // classe ne doit jamais les supprimer de la base, car cela
        // modifierait les autres classes de la même filière.
        const removedCourseIds = originalCourseIds
            .map(String)
            .filter(id => !keptCourseIds.includes(id));

        if (removedCourseIds.length > 0) {
            showToast("Les cours retirés restent disponibles pour les autres classes de la filière", "info");
            // La suppression est volontairement interdite ici.
        }

        if (courseErrors > 0) {
            showToast(`Classe enregistrée, mais ${courseErrors} cours n'ont pas pu être synchronisés`, 'error');
        }

        if (btnSave) btnSave.disabled = false;
        closeModal();
        loadDataFromApi(); // recharge : totalCoursesInDb reflète alors le vrai total en base
    } catch(err) {
        showToast(err.message, 'error');
        if (btnSave) btnSave.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded',()=>{
    const datalistCours=document.createElement('datalist');datalistCours.id='coursList';
    document.body.appendChild(datalistCours);

    loadDataFromApi();
});


