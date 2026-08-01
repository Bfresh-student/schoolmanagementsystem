const coursCEJEC=['Entrepreneuriat','Plan d\'Affaires','Sociologie de la pratique des affaires','Éducation à la technologie','Développement personnel','Marketing','Droit des affaires','Les lois du succès','Gestion des ressources humaines','Leadership','Correspondance administrative','Art oratoire'];

const profsCEJEC=['Dr. Jacques Mentor','Prof. Jean Baptiste','Prof. Rose Michel','Dr. Marc Arthur','Prof. Marie Louis','Prof. Carline Étienne','Prof. Pierre Antoine','Prof. Nathalie Pierre','Prof. André Simon','Prof. Isabelle Martin','Prof. David Roche','Prof. Claire Fontaine'];

let classesData=[{
    id:1,level:'Formation Professionnelle',name:'Entrepreneuriat',students:45,room:'Salle A-101',
    coursProfesseurs:[
        {cours:'Entrepreneuriat',professeur:'Dr. Jacques Mentor'},
        {cours:'Plan d\'Affaires',professeur:'Prof. Jean Baptiste'},
        {cours:'Sociologie de la pratique des affaires',professeur:'Prof. Rose Michel'},
        {cours:'Éducation à la technologie',professeur:'Dr. Marc Arthur'},
        {cours:'Développement personnel',professeur:'Prof. Marie Louis'},
        {cours:'Marketing',professeur:'Prof. Carline Étienne'},
        {cours:'Droit des affaires',professeur:'Prof. Pierre Antoine'},
        {cours:'Les lois du succès',professeur:'Prof. Nathalie Pierre'},
        {cours:'Gestion des ressources humaines',professeur:'Prof. André Simon'},
        {cours:'Leadership',professeur:'Prof. Isabelle Martin'},
        {cours:'Correspondance administrative',professeur:'Prof. David Roche'},
        {cours:'Art oratoire',professeur:'Prof. Claire Fontaine'}
    ]
}];
let nextId=2;
let newlyCreatedClassId=null;

function showToast(msg,type='success'){const icons={success:'fa-check-circle',error:'fa-times-circle',info:'fa-info-circle'};const el=document.createElement('div');el.className=`toast toast-${type}`;el.innerHTML=`<i class="fas ${icons[type]}"></i> ${msg}`;document.getElementById('toastContainer').appendChild(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(100px)';el.style.transition='all .3s';setTimeout(()=>el.remove(),300)},3000)}

function getAllProfs(){const allProfs=new Set();classesData.forEach(c=>{if(c.coursProfesseurs)c.coursProfesseurs.forEach(cp=>allProfs.add(cp.professeur))});return allProfs.size}

function renderDashboard(){
    const dc=document.getElementById('dashboard-content');dc.innerHTML='';
    document.getElementById('total-classes-text').textContent=`${classesData.length} classe(s) au total`;
    document.getElementById('statClasses').textContent=classesData.length;
    document.getElementById('statCours').textContent=classesData.reduce((s,c)=>s+(c.coursProfesseurs?c.coursProfesseurs.length:0),0);
    document.getElementById('statEleves').textContent=classesData.reduce((s,c)=>s+(c.students||0),0);
    document.getElementById('statProfs').textContent=getAllProfs();

    // Tout klas sou menm liy - nouvo an premye
    const allClasses=classesData.slice().reverse();
    
    // Kreye seksyon klas
    const section=document.createElement('div');
    section.className='classes-section';
    
    // Header seksyon
    section.innerHTML=`
        <div class="classes-section-header">
            <h2><i class="fas fa-layer-group"></i> Toutes les Classes</h2>
            <span class="classes-count-badge">${allClasses.length} classe(s)</span>
        </div>
    `;
    
    // Scroll wrapper
    const scrollWrapper=document.createElement('div');
    scrollWrapper.className='classes-scroll-wrapper';
    
    // Row ki gen tout kat yo
    const row=document.createElement('div');
    row.className='classes-row';
    
    allClasses.forEach(cls=>{
        const card=document.createElement('div');
        
        let cardClass='class-card';
        if(cls.name==='Entrepreneuriat')cardClass+=' primary-class';
        if(cls.id===newlyCreatedClassId)cardClass+=' new-class';
        card.className=cardClass;
        
        const isNew=cls.id===newlyCreatedClassId;
        
        const cpRows=(cls.coursProfesseurs||[]).map(cp=>`
            <div class="cours-prof-row">
                <span class="matiere-tag">${cp.cours}</span>
                <span class="prof-tag"><i class="fas fa-chalkboard-teacher"></i> ${cp.professeur}</span>
            </div>`).join('');

        card.innerHTML=`
            <div class="card-header">
                <div class="card-title-box">
                    <div class="icon-book"><i class="fas fa-book-open"></i></div>
                    <div>
                        <div class="class-name">${cls.name} ${isNew?'<span class="badge-new">NOUVEAU</span>':''}</div>
                        <div class="class-subtitle">${cls.level||'Formation'} <span class="dot"></span> ${cls.room||'Salle N/A'}</div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-action btn-edit" onclick="editClass(${cls.id})" title="Modifier"><i class="fas fa-edit"></i></button>
                    <button class="btn-action btn-delete" onclick="deleteClass(${cls.id})" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
            <div class="card-body">
                <div class="info-badges">
                    <span class="info-badge"><i class="fas fa-user-graduate"></i> ${cls.students} élèves</span>
                    <span class="info-badge"><i class="fas fa-door-open"></i> ${cls.room||'N/A'}</span>
                </div>
                <div class="divider"></div>
                <div class="cours-prof-list">
                    <div class="cours-prof-title">Cours & Professeurs (${(cls.coursProfesseurs||[]).length})</div>
                    ${cpRows}
                </div>
            </div>`;
        row.appendChild(card);
    });
    
    scrollWrapper.appendChild(row);
    section.appendChild(scrollWrapper);
    dc.appendChild(section);
    
    // Endikatè defileman si gen plis pase 2 klas
    if(allClasses.length>2){
        const indicator=document.createElement('div');
        indicator.className='scroll-indicator';
        indicator.innerHTML='<i class="fas fa-chevron-left"></i> Faites défiler pour voir toutes les classes <i class="fas fa-chevron-right"></i>';
        dc.appendChild(indicator);
        setTimeout(()=>{if(indicator)indicator.style.display='none'},8000);
    }
    
    // Reyajiste apre animasyon
    if(newlyCreatedClassId){
        setTimeout(()=>{
            newlyCreatedClassId=null;
            renderDashboard();
        },3000);
    }
}

function deleteClass(id){
    const cls=classesData.find(c=>c.id===id);if(!cls)return;
    if(confirm(`Confirmer la suppression de la classe "${cls.name}" ?`)){classesData=classesData.filter(c=>c.id!==id);renderDashboard();showToast(`Classe "${cls.name}" supprimée`,'error')}
}

function addCoursProfRow(cours='',professeur=''){
    const editor=document.getElementById('coursProfEditor');
    const row=document.createElement('div');row.className='cours-prof-editor-row';
    row.innerHTML=`
        <input type="text" class="cours-input" placeholder="Nom du cours" value="${cours}" list="coursList" style="flex:1">
        <input type="text" class="prof-input" placeholder="Nom du professeur" value="${professeur}" list="profsList" style="flex:1">
        <button type="button" class="btn-remove-prof-row" onclick="this.closest('.cours-prof-editor-row').remove()"><i class="fas fa-times"></i></button>`;
    editor.appendChild(row);
}

function populateCoursProfEditor(coursProfesseurs){
    const editor=document.getElementById('coursProfEditor');editor.innerHTML='';
    if(coursProfesseurs&&coursProfesseurs.length>0){coursProfesseurs.forEach(cp=>addCoursProfRow(cp.cours,cp.professeur))}
    else{addCoursProfRow();addCoursProfRow()}
}

function getCoursProfFromEditor(){
    const rows=document.querySelectorAll('#coursProfEditor .cours-prof-editor-row');const result=[];
    rows.forEach(row=>{const cours=row.querySelector('.cours-input')?.value?.trim();const prof=row.querySelector('.prof-input')?.value?.trim();if(cours&&prof)result.push({cours,professeur:prof})});
    return result;
}

function editClass(id){
    const cls=classesData.find(c=>c.id===id);if(!cls)return;
    document.getElementById('modalTitle').innerHTML='<i class="fas fa-edit"></i> Modifier la Classe';
    document.getElementById('editClassId').value=cls.id;
    document.getElementById('modalClassName').value=cls.name;
    document.getElementById('modalLevel').value=cls.level||'';
    document.getElementById('modalStudents').value=cls.students;
    document.getElementById('modalRoom').value=cls.room||'';
    populateCoursProfEditor(cls.coursProfesseurs||[]);
    document.getElementById('addClassModal').classList.add('open');
}

function openModal(){
    document.getElementById('modalTitle').innerHTML='<i class="fas fa-plus"></i> Ajouter une Classe';
    document.getElementById('editClassId').value='';
    document.getElementById('modalClassName').value='';
    document.getElementById('modalLevel').value='';
    document.getElementById('modalStudents').value='25';
    document.getElementById('modalRoom').value='';
    populateCoursProfEditor([]);
    document.getElementById('addClassModal').classList.add('open');
}

function closeModal(){document.getElementById('addClassModal').classList.remove('open')}
document.getElementById('addClassModal').addEventListener('click',function(e){if(e.target===this)closeModal()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});
document.getElementById('btn-add-class').addEventListener('click',openModal);

function saveClass(){
    const editId=document.getElementById('editClassId').value;
    const name=document.getElementById('modalClassName').value.trim();
    const level=document.getElementById('modalLevel').value.trim();
    const students=parseInt(document.getElementById('modalStudents').value)||0;
    const room=document.getElementById('modalRoom').value.trim();
    const coursProfesseurs=getCoursProfFromEditor();
    if(!name){showToast('Le nom de la classe est obligatoire','error');return}
    if(coursProfesseurs.length===0){showToast('Ajoutez au moins un cours avec son professeur','error');return}
    const data={name,level:level||'Formation',students,room,coursProfesseurs};
    if(editId){
        const cls=classesData.find(c=>c.id===parseInt(editId));
        if(cls){Object.assign(cls,data);showToast(`Classe "${name}" modifiée`,'success')}
    }else{
        const newId=nextId++;
        classesData.unshift({id:newId,...data});
        newlyCreatedClassId=newId;
        showToast(`Classe "${name}" ajoutée avec succès!`,'success');
    }
    closeModal();renderDashboard();
}

document.addEventListener('DOMContentLoaded',()=>{
    const datalistCours=document.createElement('datalist');datalistCours.id='coursList';
    coursCEJEC.forEach(c=>{const opt=document.createElement('option');opt.value=c;datalistCours.appendChild(opt)});
    const datalistProfs=document.createElement('datalist');datalistProfs.id='profsList';
    profsCEJEC.forEach(p=>{const opt=document.createElement('option');opt.value=p;datalistProfs.appendChild(opt)});
    document.body.appendChild(datalistCours);document.body.appendChild(datalistProfs);
    renderDashboard();
});