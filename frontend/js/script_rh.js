// Ensure global API objects are referenced

// const getAccessToken removed (already declared globally)
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // ==================== DONNÉES STATIQUES LOCALES ====================
        // Les employees locaux couvrent admin/secrétaire/comptable/etc.
        // Les Teachers (professeurs) sont chargés depuis l'API.
        let defaultEmployees=[{id:'EMP-2024-001',prenom:'Jean-Marc',nom:'Dubois',sexe:'Homme',tel:'+509 44 55 66 77',email:'jeanmarc@cejec.edu.ht',fonction:'Administrateur',dept:'Direction Générale',embauche:'2020-01-15',statut:'Actif',adresse:'Port-au-Prince',salaire:95000,prime:15000,cours:[],diplomes:['Licence en Gestion','Master en Administration']},{id:'EMP-2024-002',prenom:'Marie',nom:'Louis',sexe:'Femme',tel:'+509 33 22 11 00',email:'marie@cejec.edu.ht',fonction:'Secrétaire',dept:'Administration',embauche:'2021-03-10',statut:'Actif',adresse:'Pétion-Ville',salaire:65000,prime:8000,cours:[],diplomes:['BTS Secrétariat']},{id:'EMP-2024-003',prenom:'Carline',nom:'Étienne',sexe:'Femme',tel:'+509 22 33 44 55',email:'carline@cejec.edu.ht',fonction:'Comptable',dept:'Comptabilité',embauche:'2021-06-01',statut:'Actif',adresse:'Delmas',salaire:70000,prime:10000,cours:[],diplomes:['Licence Comptabilité']},{id:'EMP-2024-007',prenom:'Marc',nom:'Arthur',sexe:'Homme',tel:'+509 40 11 22 33',email:'marc.arthur@cejec.edu.ht',fonction:'Directeur',dept:'Direction Générale',embauche:'2018-01-01',statut:'Actif',adresse:'Port-au-Prince',salaire:120000,prime:25000,cours:[],diplomes:['Doctorat en Éducation']},{id:'EMP-2024-008',prenom:'Sophie',nom:'Laurent',sexe:'Femme',tel:'+509 41 22 33 44',email:'sophie@cejec.edu.ht',fonction:'Coordinatrice',dept:'Coordination Générale',embauche:'2022-01-15',statut:'Actif',adresse:'Port-au-Prince',salaire:80000,prime:12000,cours:[],diplomes:['Master Coordination']},{id:'EMP-2024-009',prenom:'Pierre',nom:'Antoine',sexe:'Homme',tel:'+509 42 33 44 55',email:'pierre@cejec.edu.ht',fonction:'Bibliothécaire',dept:'Bibliothèque',embauche:'2022-06-01',statut:'Actif',adresse:'Port-au-Prince',salaire:55000,prime:5000,cours:[],diplomes:['Licence Bibliothéconomie']},{id:'EMP-2024-010',prenom:'Nathalie',nom:'Pierre',sexe:'Femme',tel:'+509 43 44 55 66',email:'nathalie@cejec.edu.ht',fonction:'Agent Communication',dept:'Communication',embauche:'2023-01-10',statut:'Actif',adresse:'Pétion-Ville',salaire:60000,prime:7000,cours:[],diplomes:['Licence Communication']},{id:'EMP-2024-011',prenom:'André',nom:'Simon',sexe:'Homme',tel:'+509 44 55 66 88',email:'andre@cejec.edu.ht',fonction:'Agent',dept:'Administration',embauche:'2023-06-15',statut:'Suspendu',adresse:'Delmas',salaire:45000,prime:3000,cours:[],diplomes:['BTS Administration']}];
        
        // Initialiser avec localStorage ou les données par défaut (sans les professeurs hardcodés)
        let localEmployees = JSON.parse(localStorage.getItem('cejec_employees_rh'));
        if (!localEmployees) {
            localEmployees = defaultEmployees;
            localStorage.setItem('cejec_employees_rh', JSON.stringify(localEmployees));
        }
        
        let employees = [...localEmployees];

        // ==================== ÉTAT API (rempli au chargement) ====================
        let teachersFromAPI = [];        // Teachers chargés depuis /api/v1/teachers/
        let congesData = [];             // Congés depuis /api/v1/hr/leaves/
        let salaireFromAPI = [];         // Salaires depuis /api/v1/hr/salaries/
        let evaluationsData = [];        // Évaluations depuis /api/v1/hr/evaluations/
        let documentsFromAPI = [];       // Documents depuis /api/v1/hr/documents/
        let leaveTypesFromAPI = [];      // Types de congés
        let _apiReady = false;           // true après le premier chargement API
        let _apiErrorMessage = '';

        // Données locales de secours (candidats, présences, documents locaux)
        let candidatsData=[{prenom:'Pierre',nom:'Dubois',tel:'+509 44 11 22 33',email:'pierre@email.com',poste:'Professeur Marketing',cv:'Reçu',statut:'Entretien',dateCandidature:'01/06/2026',dateEntretien:'',heureEntretien:'',interviewer:'',notes:'Bon profil, à suivre',cvFileName:'CV_Pierre_Dubois.pdf'},{prenom:'Mireille',nom:'Dumont',tel:'+509 33 22 11 00',email:'mireille@email.com',poste:'Secrétaire',cv:'Reçu',statut:'En attente',dateCandidature:'05/06/2026',dateEntretien:'',heureEntretien:'',interviewer:'',notes:'',cvFileName:'CV_Mireille_Dumont.pdf'}];
        // documentsData est désormais un alias vers documentsFromAPI (rempli par l'API ou fallback)
        let documentsData = [];
        let presencesData=[];
        let editingId=null,currentPage='employes',selectedFicheEmp=null,selectedCoursProfId=null,editingCandidatIndex=null; let editingEvalIndex = null; let selectedProfilIndex = null;
        let pdfDoc=null,pdfCurrentPage=1,pdfTotalPages=0;
        const matriculePrefix='EMP-'+new Date().getFullYear()+'-';


        // ==================== FONKSYON ITILITÈ ====================
        // Auto‑login fallback for development (admin credentials)
        async function ensureAuth() {
            // Use global AuthAPI if available
            const api = window.AuthAPI;
            if (!api) {
                console.error('AuthAPI not available');
                return;
            }
            // Check for token in localStorage using the configured key
            const token = window.localStorage.getItem('authToken');
            if (!token) {
                try {
                    // Replace with valid admin credentials in your environment
                    await api.login('admin@cejec.edu.ht', 'admin123');
                    console.log('🔐 Auto‑login successful');
                } catch (e) {
                    console.error('❌ Auto‑login failed', e);
                }
            }
        }

        function getProfs(){return employees.filter(e=>e.fonction==='Professeur')}
        function getInitials(e){return(e.prenom[0]+e.nom[0]).toUpperCase()}
        function getAvatarColor(i){const c=['#0A4D8C','#D62828','#10b981','#f59e0b','#8b5cf6','#ec4899','#6366f1','#14b8a6','#e11d48','#0891b2','#7c3aed','#059669'];return c[i%c.length]}
        function getColorFromString(s){let h=0;for(let i=0;i<s.length;i++)h=s.charCodeAt(i)+((h<<5)-h);const c=['#0A4D8C','#D62828','#10b981','#f59e0b','#8b5cf6','#ec4899','#6366f1','#14b8a6'];return c[Math.abs(h)%c.length]}
        function showToast(msg,type='success'){const icons={success:'fa-check-circle',error:'fa-times-circle',info:'fa-info-circle'};const el=document.createElement('div');el.className=`toast toast-${type}`;el.innerHTML=`<i class="fas ${icons[type]}"></i> ${msg}`;document.getElementById('toastContainer').appendChild(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(100px)';el.style.transition='all .3s';setTimeout(()=>el.remove(),300)},3000)}
        function getDocIcon(nom){const ext=nom.split('.').pop().toLowerCase();if(ext==='pdf')return'fa-file-pdf';if(ext==='doc'||ext==='docx')return'fa-file-word';if(ext==='jpg'||ext==='jpeg'||ext==='png')return'fa-file-image';if(ext==='xls'||ext==='xlsx')return'fa-file-excel';return'fa-file-alt'}
        function getDocColor(nom){const ext=nom.split('.').pop().toLowerCase();if(ext==='pdf')return'var(--red)';if(ext==='doc'||ext==='docx')return'#3b82f6';if(ext==='jpg'||ext==='jpeg'||ext==='png')return'var(--purple)';if(ext==='xls'||ext==='xlsx')return'var(--success)';return'var(--muted)'}
        function getDocTypeClass(type){if(type==='CV')return'pill-success';if(type==='Contrat')return'pill-info';if(type==='Diplôme')return'pill-purple';if(type==='Pièce identité')return'pill-warning';return'pill-muted'}

        function findEmployeeByDisplayName(name) {
            const target = (name || '').trim().toLowerCase();
            return employees.find(e => `${e.prenom} ${e.nom}`.trim().toLowerCase() === target);
        }

        function resolveHrEmployeeId(displayName) {
            const emp = findEmployeeByDisplayName(displayName);
            return emp?._hrEmployeeId || null;
        }

        function getTodayDateString(d = new Date()) {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        function _resolveDeptFromPoste(poste) {
            const p = (poste || '').toLowerCase();
            if (p.includes('prof') || p.includes('enseign')) return 'Professeurs';
            if (p.includes('compt')) return 'Comptabilité';
            if (p.includes('coord')) return 'Coordination Générale';
            if (p.includes('biblio')) return 'Bibliothèque';
            if (p.includes('comm')) return 'Communication';
            if (p.includes('direct')) return 'Direction Générale';
            return 'Administration';
        }

        function _mapAttendanceStatusToAPI(label) {
            const map = { 'Présent': 'present', 'Retard': 'late', 'Absent': 'absent', 'Congé': 'excused' };
            return map[label] || 'present';
        }

        function _mapAttendanceStatusFromAPI(status) {
            const map = { present: 'Présent', late: 'Retard', absent: 'Absent', excused: 'Congé' };
            return map[status] || 'Présent';
        }

        function mapAttendanceFromAPI(row) {
            const name = row.employee_name || '';
            const cleanName = name.includes('(') ? name.split('(')[0].trim() : name;
            return {
                _apiId: row.id,
                _employeeId: row.employee,
                employe: cleanName,
                date: row.date,
                entree: row.check_in_time ? String(row.check_in_time).slice(0, 5) : '—',
                sortie: row.check_out_time ? String(row.check_out_time).slice(0, 5) : '—',
                statut: _mapAttendanceStatusFromAPI(row.status),
                notes: row.notes || ''
            };
        }

        function _mapCandidateStatusFromAPI(status) {
            const map = { pending: 'En attente', interview: 'Entretien', selected: 'Accepté', rejected: 'Refusé', hired: 'Embauché' };
            return map[status] || status;
        }

        function _mapCandidateStatusToAPI(label) {
            const map = { 'En attente': 'pending', 'Entretien': 'interview', 'Accepté': 'selected', 'Refusé': 'rejected', 'Embauché': 'hired' };
            return map[label] || 'pending';
        }

        function mapCandidateFromAPI(c) {
            return {
                _apiId: c.id,
                prenom: c.first_name,
                nom: c.last_name,
                tel: c.phone || '',
                email: c.email || '',
                poste: c.position || '',
                cv: c.cv_file ? 'Reçu' : 'En attente',
                statut: _mapCandidateStatusFromAPI(c.status),
                dateCandidature: c.application_date ? new Date(c.application_date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
                dateEntretien: c.interview_date ? new Date(c.interview_date).toLocaleDateString('fr-FR') : '',
                heureEntretien: c.interview_time ? String(c.interview_time).slice(0, 5) : '',
                interviewer: c.interviewer || '',
                notes: c.notes || '',
                cvFileName: c.cv_file ? String(c.cv_file).split('/').pop() : ''
            };
        }

        // ==================== GESTYON UPLOAD FICHIER (NOUVO SISTÈM) ====================
        
        /**
         * Jere seleksyon fichye pou modal televese dokiman
         * Mete ajou zòn upload la ak non fichye a
         */
        function handleDocFileSelect(input) {
            const file = input.files && input.files[0];
            const zone = document.getElementById('docUploadZone');
            const nameDisplay = document.getElementById('docFileNameDisplay');
            const nameText = document.getElementById('docFileNameText');
            
            if (file) {
                zone.classList.add('has-file');
                nameDisplay.style.display = 'block';
                nameText.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
                window._tempDocFile = file;
            } else {
                zone.classList.remove('has-file');
                nameDisplay.style.display = 'none';
                nameText.textContent = '';
                window._tempDocFile = null;
            }
        }

        /**
         * Jere seleksyon fichye CV pou kandidat
         */
        function handleCVUpload(input) {
            const file = input.files && input.files[0];
            const zone = document.getElementById('cvUploadZone');
            const nameDisplay = document.getElementById('cvFileNameDisplay');
            const nameText = document.getElementById('cvFileNameText');
            
            if (file) {
                zone.classList.add('has-file');
                nameDisplay.style.display = 'block';
                nameText.textContent = file.name + ' (' + formatFileSize(file.size) + ')';
                window._tempCVFile = file;
                window._tempCVFileName = file.name;
            } else {
                zone.classList.remove('has-file');
                nameDisplay.style.display = 'none';
                nameText.textContent = '';
                window._tempCVFile = null;
                window._tempCVFileName = '';
            }
        }

        function formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1048576) return (bytes / 1024).toFixed(0) + ' KB';
            return (bytes / 1048576).toFixed(1) + ' MB';
        }

        function resetCVUpload() {
            const zone = document.getElementById('cvUploadZone');
            const nameDisplay = document.getElementById('cvFileNameDisplay');
            const input = document.getElementById('candCVInput');
            if (zone) zone.classList.remove('has-file');
            if (nameDisplay) nameDisplay.style.display = 'none';
            if (input) input.value = '';
            window._tempCVFile = null;
            window._tempCVFileName = '';
        }

        // ==================== PREVIEW PDF (VÈSYON KORIJE) ====================

        /**
         * Jenere yon PDF senp pou preview lè pa gen fichye reyèl
         * Sa evite erè "doc is not a constructor"
         */
async function generatePreviewPDF(docName) {
    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        
        pdf.setFontSize(20);
        pdf.setTextColor(10, 77, 140);
        pdf.text('CEJEC', 105, 30, { align: 'center' });
        
        pdf.setFontSize(14);
        pdf.setTextColor(26, 31, 43);
        pdf.text(`Document: ${docName}`, 105, 45, { align: 'center' });
        
        pdf.setDrawColor(10, 77, 140);
        pdf.line(20, 52, 190, 52);
        
        pdf.setFontSize(11);
        pdf.text("Centre d'Etudes des Jeunes en Entrepreneuriat et Commerce", 105, 65, { align: 'center' });
        pdf.text('Port-au-Prince, Haiti', 105, 75, { align: 'center' });
        
        pdf.setFontSize(9);
        pdf.setTextColor(139, 149, 165);
        pdf.text('Document faisant partie de la bibliotheque RH du CEJEC.', 105, 90, { align: 'center' });
        pdf.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 105, 100, { align: 'center' });
        
        return pdf.output('blob');
    } catch (e) {
        console.error('Erè jenere PDF:', e);
        return null;
    }
}

        /**
         * Kreye entèfas preview PDF nan modal viewDoc
         */
        async function renderPDFPreview(docName) {
            const ext = docName.split('.').pop().toLowerCase();
            
            // Si se pa yon PDF, afiche mesaj
            if (ext !== 'pdf') {
                return `<div class="pdf-preview-error" style="text-align:center;padding:30px;color:#fca5a5">
                    <i class="fas fa-exclamation-triangle" style="font-size:2rem;display:block;margin-bottom:10px"></i>
                    <strong>Aperçu non disponible</strong><br>
                    <small>La prévisualisation est disponible uniquement pour les fichiers PDF.<br>
                    Veuillez télécharger pour voir le contenu.</small>
                </div>`;
            }
            
            // Retounen entèfas ak onglet
            return `
            <div class="pdf-preview-tabs">
                <button class="pdf-preview-tab active" onclick="switchPreviewTab(event, 'details', '${docName}')">
                    <i class="fas fa-info-circle"></i> Détails
                </button>
                <button class="pdf-preview-tab" onclick="switchPreviewTab(event, 'preview', '${docName}')">
                    <i class="fas fa-eye"></i> Aperçu PDF
                </button>
            </div>
            <div id="previewDetailsSection">
                <div class="pdf-preview-container" style="background:#f0f4f8;color:var(--ink);text-align:left;padding:20px">
                    <p><i class="fas fa-check-circle" style="color:var(--success)"></i> <strong>Document prêt pour la prévisualisation</strong></p>
                    <p style="font-size:0.85rem;color:var(--muted)">Cliquez sur l'onglet <strong>"Aperçu PDF"</strong> pour voir le contenu du document.</p>
                </div>
            </div>
            <div id="previewPDFSection" style="display:none">
                <div class="pdf-preview-container">
                    <div class="pdf-preview-loading">
                        <i class="fas fa-spinner fa-spin"></i> Chargement de l'aperçu...
                    </div>
                </div>
            </div>`;
        }

        /**
         * Rann paj PDF nan seksyon preview
         */
        async function renderPDFInSection(docName) {
            const pdfSection = document.getElementById('previewPDFSection');
            if (!pdfSection) return;
            
            pdfSection.innerHTML = `<div class="pdf-preview-container">
                <div class="pdf-preview-loading">
                    <i class="fas fa-spinner fa-spin"></i> Génération de l'aperçu...
                </div>
            </div>`;
            
            try {
                const pdfBlob = await generatePreviewPDF(docName);
                if (!pdfBlob) throw new Error('Impossible de générer le PDF');
                
                if (window._currentPreviewUrl) URL.revokeObjectURL(window._currentPreviewUrl);
                const url = URL.createObjectURL(pdfBlob);
                window._currentPreviewUrl = url;
                
                pdfSection.innerHTML = `<div class="pdf-preview-container" style="padding:0;overflow:hidden">
                    <iframe src="${url}" style="width:100%;height:500px;border:none;display:block"></iframe>
                </div>`;
            } catch (e) {
                console.error('Erè preview:', e);
                pdfSection.innerHTML = `<div class="pdf-preview-error">
                    <i class="fas fa-exclamation-circle"></i> 
                    Impossible de générer l'aperçu. Veuillez télécharger le document.
                </div>`;
            }
        }

        /**
         * Rann yon paj espesifik
         */
        async function renderPDFPage(pageNum) {
            const previewContainer = document.getElementById('previewPDFSection');
            if (!previewContainer || !pdfDoc) return;
            
            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale: 1.0 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                const maxWidth = 700;
                const scale = maxWidth / viewport.width;
                const scaledViewport = page.getViewport({ scale });
                
                canvas.width = scaledViewport.width;
                canvas.height = scaledViewport.height;
                
                await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
                
                previewContainer.innerHTML = `
                <div class="pdf-preview-container">
                    <div class="pdf-preview-controls">
                        <button class="btn-pdf-nav" onclick="changePDFPage(-1)" ${pdfCurrentPage <= 1 ? 'disabled' : ''}>
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <span class="pdf-page-info">Page ${pdfCurrentPage} / ${pdfTotalPages}</span>
                        <button class="btn-pdf-nav" onclick="changePDFPage(1)" ${pdfCurrentPage >= pdfTotalPages ? 'disabled' : ''}>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                    ${canvas.outerHTML}
                </div>`;
            } catch (e) {
                previewContainer.innerHTML = `<div class="pdf-preview-error">Erreur: ${e.message}</div>`;
            }
        }

        async function changePDFPage(delta) {
            if (!pdfDoc) return;
            const newPage = pdfCurrentPage + delta;
            if (newPage < 1 || newPage > pdfTotalPages) return;
            pdfCurrentPage = newPage;
            await renderPDFPage(pdfCurrentPage);
        }

        function switchPreviewTab(evt, tab, docName) {
            document.querySelectorAll('.pdf-preview-tab').forEach(t => t.classList.remove('active'));
            if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');

            const detailsSection = document.getElementById('previewDetailsSection');
            const pdfSection = document.getElementById('previewPDFSection');

            if (tab === 'details') {
                if (detailsSection) detailsSection.style.display = 'block';
                if (pdfSection) pdfSection.style.display = 'none';
            } else {
                if (detailsSection) detailsSection.style.display = 'none';
                if (pdfSection) {
                    pdfSection.style.display = 'block';
                    renderPDFInSection(docName);
                }
            }
        }

        // ==================== WÈ DOKIMAN ====================
        function voirDoc(nom) {
            const doc = documentsData.find(d => d.nom === nom);
            if (!doc) return;
            
            pdfDoc = null;
            pdfCurrentPage = 1;
            pdfTotalPages = 0;
            
            let fileIcon = getDocIcon(nom);
            let fileColor = getDocColor(nom);
            let fileTypeLabel = 'Document';
            const ext = nom.split('.').pop().toLowerCase();
            if (ext === 'pdf') fileTypeLabel = 'Document PDF';
            else if (ext === 'doc' || ext === 'docx') fileTypeLabel = 'Document Word';
            else if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') fileTypeLabel = 'Image';
            
            const isCandidat = doc.employe.includes('(Candidat)');
            const candidatName = isCandidat ? doc.employe.replace(' (Candidat)', '') : '';
            let infoHTML = '';
            
            if (isCandidat && candidatName) {
                const candidat = candidatsData.find(c => (c.prenom + ' ' + c.nom) === candidatName);
                if (candidat) {
                    infoHTML = `<div style="background:var(--purple-light);border:1px solid #ddd6fe;
                        border-radius:var(--radius-sm);padding:14px 16px;margin-top:16px">
                        <h4 style="font-weight:700;color:#5b21b6;margin-bottom:8px">
                            <i class="fas fa-user-tie"></i> Informations du Candidat</h4>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85rem">
                            <div><span style="color:var(--muted)">Nom:</span> <strong>${candidat.prenom} ${candidat.nom}</strong></div>
                            <div><span style="color:var(--muted)">Poste:</span> <strong>${candidat.poste}</strong></div>
                            <div><span style="color:var(--muted)">Tél:</span> <strong>${candidat.tel}</strong></div>
                            <div><span style="color:var(--muted)">Email:</span> <strong>${candidat.email}</strong></div>
                            <div><span style="color:var(--muted)">Statut:</span> <span class="pill ${candidat.statut==='Entretien'?'pill-info':candidat.statut==='Accepté'?'pill-success':candidat.statut==='Refusé'?'pill-danger':'pill-warning'}">${candidat.statut}</span></div>
                        </div>
                    </div>`;
                }
            }
            if (!isCandidat) {
                const emp = employees.find(e => (e.prenom + ' ' + e.nom) === doc.employe);
                if (emp) {
                    infoHTML = `<div style="background:var(--blue-lighter);border:1px solid var(--blue-soft);
                        border-radius:var(--radius-sm);padding:14px 16px;margin-top:16px">
                        <h4 style="font-weight:700;color:var(--blue-dark);margin-bottom:8px">
                            <i class="fas fa-id-card"></i> Informations de l'Employé</h4>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85rem">
                            <div><span style="color:var(--muted)">Nom:</span> <strong>${emp.prenom} ${emp.nom}</strong></div>
                            <div><span style="color:var(--muted)">Matricule:</span> <strong>${emp.id}</strong></div>
                            <div><span style="color:var(--muted)">Fonction:</span> <strong>${emp.fonction}</strong></div>
                            <div><span style="color:var(--muted)">Département:</span> <strong>${emp.dept}</strong></div>
                            <div><span style="color:var(--muted)">Statut:</span> <span class="pill ${emp.statut==='Actif'?'pill-success':'pill-danger'}">${emp.statut}</span></div>
                        </div>
                    </div>`;
                }
            }
            
            const detailsHTML = `
            <div style="text-align:center;padding:10px 0 20px">
                <i class="fas ${fileIcon}" style="font-size:4rem;color:${fileColor};margin-bottom:12px;display:block"></i>
                <h3 style="font-size:1.1rem;color:var(--ink);font-weight:700">${doc.nom}</h3>
                <span class="pill pill-info" style="margin-top:4px">${fileTypeLabel}</span>
            </div>
            <div class="detail-grid">
                <div class="detail-item"><div class="d-label"><i class="fas fa-file-signature"></i> Fichier</div><div class="d-value">${doc.nom}</div></div>
                <div class="detail-item"><div class="d-label"><i class="fas fa-user"></i> Propriétaire</div><div class="d-value">${doc.employe}</div></div>
                <div class="detail-item"><div class="d-label"><i class="fas fa-tag"></i> Type</div><div class="d-value"><span class="pill ${getDocTypeClass(doc.type)}">${doc.type}</span></div></div>
                <div class="detail-item"><div class="d-label"><i class="fas fa-calendar"></i> Date</div><div class="d-value">${doc.date}</div></div>
                <div class="detail-item"><div class="d-label"><i class="fas fa-weight-hanging"></i> Taille</div><div class="d-value">${doc.taille}</div></div>
                <div class="detail-item"><div class="d-label"><i class="fas fa-shield-alt"></i> Source</div><div class="d-value">${isCandidat?'<span style="color:#5b21b6"><i class="fas fa-user-tie"></i> Candidat</span>':'<span style="color:var(--blue)"><i class="fas fa-building"></i> Employé</span>'}</div></div>
            </div>
            ${infoHTML}
            <div id="pdfPreviewArea" style="margin-top:16px"></div>`;
            
            document.getElementById('viewDocTitle').innerHTML = `<i class="fas fa-file-alt"></i> ${doc.nom}`;
            document.getElementById('viewDocContent').innerHTML = detailsHTML;
            document.getElementById('viewDocDownloadBtn').onclick = function() { telechargerDoc(doc.nom); };
            
            // Kòmanse preview PDF
            renderPDFPreview(nom).then(previewHTML => {
                const previewArea = document.getElementById('pdfPreviewArea');
                if (previewArea) previewArea.innerHTML = previewHTML;
            });
            
            openModal('viewDocModal');
        }

        function telechargerDoc(nom) {
            const doc = documentsData.find(d => d.nom === nom);
            if (doc) {
                showToast(`📥 Téléchargement de "${doc.nom}" en cours...`, 'info');
                setTimeout(() => showToast(`✅ "${doc.nom}" téléchargé avec succès`, 'success'), 1000);
            }
        }

        function supprimerDoc(nom) {
            if (confirm(`⚠️ Supprimer définitivement "${nom}" ?`)) {
                documentsData = documentsData.filter(d => d.nom !== nom);
                renderPage('documents');
                showToast(`🗑️ ${nom} supprimé`, 'error');
            }
        }

        async function uploadDocument() {
            const emp = document.getElementById('docEmp').value;
            const type = document.getElementById('docType').value;
            const desc = document.getElementById('docDesc')?.value || '';
            
            if (!emp) {
                showToast('⚠️ Veuillez sélectionner un employé', 'error');
                return;
            }
            
            let fileName = '';
            if (window._tempDocFile) {
                fileName = window._tempDocFile.name;
            } else {
                fileName = `${type}_${emp.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
            }

            // Trouver la fiche RH correspondante
            const hrEmployee = findEmployeeByDisplayName(emp);

            // Mapper le type vers la valeur API
            const typeMap = { 'CV': 'cv', 'Contrat': 'other', 'Diplôme': 'diploma', 'Pièce identité': 'id_card', 'Certificat': 'certification', 'Autre': 'other' };
            const apiDocType = typeMap[type] || 'other';

            if (hrEmployee?._hrEmployeeId && window._tempDocFile) {
                // Upload multipart vers l'API
                const formData = new FormData();
                formData.append('employee', hrEmployee._hrEmployeeId);
                formData.append('document_type', apiDocType);
                formData.append('filename', fileName);
                formData.append('file', window._tempDocFile);
                if (desc) formData.append('description', desc);
                try {
                    const created = await HRAPI.createDocument(formData);
                    documentsData.unshift({
                        _apiId: created.id,
                        nom: created.filename || fileName,
                        employe: emp,
                        type,
                        date: new Date().toLocaleDateString('fr-FR'),
                        taille: formatFileSize(window._tempDocFile.size),
                        fileUrl: created.file || null
                    });
                    _resetDocUpload();
                    closeModal('uploadDocModal');
                    document.getElementById('mainContent').innerHTML = renderDocuments();
                    showToast('📤 Document téléversé dans la base', 'success');
                    return;
                } catch (err) {
                    console.error('[RH] createDocument échoué:', err);
                    showToast('❌ Téléversement impossible : ' + (err.detail ? JSON.stringify(err.detail) : err.message), 'error');
                    return;
                }
            }
            showToast('⚠️ Sélectionnez un employé synchronisé et un fichier à téléverser', 'error');
        }

        function _resetDocUpload() {
            const zone = document.getElementById('docUploadZone');
            const nameDisplay = document.getElementById('docFileNameDisplay');
            const input = document.getElementById('docFileInput');
            if (zone) zone.classList.remove('has-file');
            if (nameDisplay) nameDisplay.style.display = 'none';
            if (input) input.value = '';
            window._tempDocFile = null;
        }

        // ==================== RANDI PAJ YO ====================
        document.querySelectorAll('#navRH button').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('#navRH button').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentPage = this.dataset.page;
                renderPage(currentPage);
            });
        });

        /** Affiche un spinner pendant le chargement d'un onglet */
        function showTabSpinner() {
            document.getElementById('mainContent').innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;min-height:280px;flex-direction:column;gap:16px">
                <div style="width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:var(--blue);border-radius:50%;animation:spin 0.8s linear infinite"></div>
                <span style="color:var(--muted);font-size:0.95rem">Chargement des données...</span>
            </div>
            <style>@keyframes spin{to{transform:rotate(360deg)}}</style>`;
        }

        function renderPage(page) {
            const mc = document.getElementById('mainContent');
            switch (page) {
                case 'employes': mc.innerHTML = renderEmployes(); break;
                case 'professeurs': loadAndRenderProfesseurs(); break;
                case 'presences': loadAndRenderPresences(); break;
                case 'conges': loadAndRenderConges(); break;
                case 'salaires': loadAndRenderSalaires(); break;
                case 'fichepaie': mc.innerHTML = renderFichePaie(); break;
                case 'recrutement': loadAndRenderRecrutement(); break;
                case 'documents': loadAndRenderDocuments(); break;
                default: mc.innerHTML = renderEmployes();
            }
        }

        async function loadAndRenderPresences() {
            showTabSpinner();
            try {
                await ensureAuth();
                const raw = await HRAPI.attendances(true);
                presencesData = raw.map(mapAttendanceFromAPI);
            } catch (e) {
                console.warn('[RH] Impossible de charger les présences:', e);
            }
            if (!employees || employees.length === 0) {
                await syncAllEmployees();
            }
            document.getElementById('mainContent').innerHTML = renderPresences();
        }

        function renderEmployes() {
            const total = employees.length;
            const actifs = employees.filter(e => e.statut === 'Actif').length;
            const suspendus = employees.filter(e => e.statut === 'Suspendu').length;
            let rows = employees.map((e, i) => `
                <tr>
                    <td><div class="emp-cell"><div class="avatar-sm" style="background:${getAvatarColor(i)}">${getInitials(e)}</div><div><div class="emp-name">${e.prenom} ${e.nom}</div><div class="emp-detail">${e.id}</div></div></div></td>
                    <td>${e.sexe}</td><td>${e.tel}</td><td>${e.email}</td><td>${e.fonction}</td><td>${e.dept}</td><td>${e.embauche}</td>
                    <td><span class="pill ${e.statut==='Actif'?'pill-success':e.statut==='Suspendu'?'pill-danger':'pill-warning'}">${e.statut}</span></td>
                    <td><div class="btn-group">
                        <button class="btn btn-sm btn-outline btn-icon" title="Voir" onclick="viewProfil(${i})"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-sm btn-outline btn-icon" title="Modifier" onclick="editEmp(${i})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger btn-icon" title="Supprimer" onclick="deleteEmp(${i})"><i class="fas fa-trash"></i></button>
                    </div></td>
                </tr>`).join('');
            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Total</span><h2>${total}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-users"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Actifs</span><h2>${actifs}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Suspendus</span><h2>${suspendus}</h2></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-times-circle"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Masse Salariale</span><h2>${(employees.reduce((s,e)=>(e.salaire||0)+(e.prime||0),0)/1000).toFixed(0)}K</h2></div><div class="stat-icon" style="color:#059669"><i class="fas fa-money-bill-wave"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-users"></i> Liste des Employés</h2><div class="btn-group">
                <button class="btn btn-sm btn-outline" onclick="exportEmployesCSV()"><i class="fas fa-file-excel"></i> Excel</button>
                <button class="btn btn-sm btn-outline" onclick="exportEmployesPDF()"><i class="fas fa-file-pdf"></i> PDF</button>
                <button class="btn btn-sm btn-primary" onclick="openModal('addEmpModal')"><i class="fas fa-plus"></i> Ajouter</button>
            </div></div>
            <div class="search-box"><i class="fas fa-search"></i><input placeholder="Rechercher..." oninput="searchEmp(this.value)"></div>
            <div class="table-wrap"><table><thead><tr><th>Employé</th><th>Sexe</th><th>Tél</th><th>Email</th><th>Fonction</th><th>Dépt</th><th>Embauche</th><th>Statut</th><th>Actions</th></tr></thead><tbody id="empTbody">${rows}</tbody></table></div></div>`;
        }

        let employeeSearchTimer;
        async function searchEmp(val) {
            const tbody = document.getElementById('empTbody');
            const query = val.trim();
            if (!query) {
                if (tbody) tbody.querySelectorAll('tr').forEach(tr => tr.style.display = '');
                return;
            }
            clearTimeout(employeeSearchTimer);
            employeeSearchTimer = setTimeout(async () => {
                try {
                    const remoteEmployees = await HRAPI.searchEmployees(query);
                    const allowedIds = new Set(remoteEmployees.map(item => String(item.id)));
                    if (tbody) tbody.querySelectorAll('tr').forEach((tr, index) => {
                        const employee = employees[index];
                        tr.style.display = employee?._hrEmployeeId && allowedIds.has(String(employee._hrEmployeeId)) ? '' : 'none';
                    });
                } catch (error) {
                    console.error('[RH] Recherche employés impossible:', error);
                    if (tbody) tbody.querySelectorAll('tr').forEach(tr => tr.style.display = tr.innerText.toLowerCase().includes(query.toLowerCase()) ? '' : 'none');
                }
            }, 250);
        }

        function viewProfil(i) {
            selectedProfilIndex = i;
            const e = employees[i];
            document.getElementById('profilName').innerHTML = `<i class="fas fa-id-card"></i> ${e.prenom} ${e.nom}`;
            document.getElementById('profilContent').innerHTML = `
            <div style="display:flex;gap:20px;align-items:center;margin-bottom:20px;flex-wrap:wrap">
                <div style="width:70px;height:70px;border-radius:50%;background:${getAvatarColor(i)};display:flex;align-items:center;justify-content:center;color:white;font-size:1.5rem;font-weight:700">${getInitials(e)}</div>
                <div><h3 style="font-size:1.3rem;color:var(--blue-dark)">${e.prenom} ${e.nom}</h3><p style="color:var(--muted)">${e.fonction} · ${e.dept}</p><span class="pill ${e.statut==='Actif'?'pill-success':'pill-danger'}">${e.statut}</span></div>
            </div>
            <div class="detail-grid">
                <div class="detail-item"><div class="d-label">Matricule</div><div class="d-value">${e.id}</div></div>
                <div class="detail-item"><div class="d-label">Sexe</div><div class="d-value">${e.sexe}</div></div>
                <div class="detail-item"><div class="d-label">Tél</div><div class="d-value">${e.tel}</div></div>
                <div class="detail-item"><div class="d-label">Email</div><div class="d-value">${e.email}</div></div>
                <div class="detail-item"><div class="d-label">Adresse</div><div class="d-value">${e.adresse||'N/A'}</div></div>
                <div class="detail-item"><div class="d-label">Embauche</div><div class="d-value">${e.embauche}</div></div>
                <div class="detail-item"><div class="d-label">Salaire</div><div class="d-value">${(e.salaire||0).toLocaleString()} HTG</div></div>
                <div class="detail-item"><div class="d-label">Prime</div><div class="d-value">${(e.prime||0).toLocaleString()} HTG</div></div>
            </div>`;
            openModal('profilModal');
        }

        function editEmp(i) {
            editingId = i;
            const e = employees[i];
            document.getElementById('modalEmpTitle').innerHTML = `<i class="fas fa-edit"></i> Modifier ${e.prenom} ${e.nom}`;
            document.getElementById('editEmpId').value = i;
            document.getElementById('empPrenom').value = e.prenom;
            document.getElementById('empNom').value = e.nom;
            document.getElementById('empSexe').value = e.sexe;
            document.getElementById('empTel').value = e.tel;
            document.getElementById('empEmail').value = e.email;
            document.getElementById('empFonction').value = e.fonction;
            document.getElementById('empDept').value = e.dept;
            document.getElementById('empEmbauche').value = e.embauche;
            document.getElementById('empStatut').value = e.statut;
            document.getElementById('empAdresse').value = e.adresse || '';
            document.getElementById('empSalaire').value = e.salaire || 50000;
            document.getElementById('empPrime').value = e.prime || 5000;
            openModal('addEmpModal');
        }

        // --- CRUD via backend API ---
        async function deleteEmpLegacy(i) {
            // Ensure we have a valid auth token
            await ensureAuth();
            if (confirm(`⚠️ Supprimer ${employees[i].prenom} ${employees[i].nom} ?`)) {
                const nom = employees[i].prenom + ' ' + employees[i].nom;
                const idToDelete = employees[i].id;
                try {
                    await HRAPI.deleteEmployee(idToDelete);
                    // Remove from in‑memory arrays
                    employees.splice(i, 1);
                    localEmployees = localEmployees.filter(e => e.id !== idToDelete);
                    localStorage.setItem('cejec_employees_rh', JSON.stringify(localEmployees));
                    presencesData = presencesData.filter(p => p.employe !== nom);
                    renderPage('employes');
                    updateBadges();
                    showToast(`🗑️ ${nom} supprimé (API)`, 'error');
                } catch (err) {
                    console.warn('[RH] deleteEmployee failed, aborting operation', err);
                    showToast(`❌ Erreur lors de la suppression de ${nom}`, 'error');
                }
            }
        }

        // Wrapper for delete button to maintain backward compatibility
        function deleteEmpDeprecated(i) {
            deleteEmpLegacy(i);
        }

        // Save (create or update) employee via backend API with fallback to local storage
        async function saveEmployeeLocal() {
            // Ensure we have a valid token before any API call
            await ensureAuth();
            const prenom = document.getElementById('empPrenom').value.trim();
            const nom = document.getElementById('empNom').value.trim();
            if (!prenom || !nom) { showToast('⚠️ Prénom et nom obligatoires', 'error'); return; }
            const payload = {
                prenom,
                nom,
                sexe: document.getElementById('empSexe').value,
                tel: document.getElementById('empTel').value,
                email: document.getElementById('empEmail').value,
                fonction: document.getElementById('empFonction').value,
                dept: document.getElementById('empDept').value,
                embauche: document.getElementById('empEmbauche').value || new Date().toISOString().split('T')[0],
                statut: document.getElementById('empStatut').value,
                adresse: document.getElementById('empAdresse').value,
                salaire: parseInt(document.getElementById('empSalaire').value) || 50000,
                prime: parseInt(document.getElementById('empPrime').value) || 5000,
                cours: editingId !== null ? employees[editingId].cours : [],
                diplomes: editingId !== null ? employees[editingId].diplomes : []
            };
            try {
                let result;
                if (editingId !== null) {
                    const id = employees[editingId].id;
                    result = await HRAPI.updateEmployee(id, payload);
                } else {
                    result = await HRAPI.createEmployee(payload);
                }
                // The API returns the created/updated object (including its id)
                const saved = result || payload; // fallback if API returns nothing
                if (editingId !== null) {
                    employees[editingId] = saved;
                    showToast(`✅ ${prenom} ${nom} modifié (API)`, 'success');
                } else {
                    employees.push(saved);
                    showToast(`✅ ${prenom} ${nom} ajouté (API) — ${saved.id}`, 'success');
                }
                // Sync local cache
                const localIdx = localEmployees.findIndex(e => e.id === saved.id);
                if (localIdx !== -1) localEmployees[localIdx] = saved; else localEmployees.push(saved);
                localStorage.setItem('cejec_employees_rh', JSON.stringify(localEmployees));
            } catch (apiErr) {
                console.warn('[RH] Employee save failed, aborting operation', apiErr);
                showToast('❌ Erreur lors de l\'enregistrement de l\'employé', 'error');
                return;
            }
            closeModal('addEmpModal');
            editingId = null;
            renderPage(currentPage);
            updateBadges();
        }

        function updateBadges() {
            const badge = document.getElementById('empCountBadge');
            if (badge) badge.textContent = employees.length;
        }

        // ==================== RANDI LÒT PAJ YO (VÈSYON KONTRAKTE) ====================
        
        /** Charge les teachers depuis l'API puis rend l'onglet */
        async function loadAndRenderProfesseurs() {
            showTabSpinner();
            try {
                teachersFromAPI = await HRAPI.teachers();
            } catch (e) {
                console.warn('[RH] Impossible de charger les teachers:', e);
                teachersFromAPI = [];
            }
            document.getElementById('mainContent').innerHTML = renderProfesseurs();
        }

        function renderProfesseurs() {
            // Priorité aux données API, fallback sur employees locaux
            let profs;
            if (teachersFromAPI.length > 0) {
                profs = teachersFromAPI.map(t => ({
                    id: 'T-' + t.id,
                    _apiId: t.id,
                    prenom: t.first_name || t.user?.first_name || '',
                    nom: t.last_name || t.user?.last_name || '',
                    email: t.email || t.user?.email || '',
                    tel: t.phone || t.user?.phone || '—',
                    fonction: 'Professeur',
                    dept: 'Professeurs',
                    statut: t.is_active !== false ? 'Actif' : 'Inactif',
                    embauche: t.hire_date || t.created_at?.slice(0, 10) || '—',
                    cours: t.courses?.map(c => c.name || c) || [],
                    diplomes: [],
                    salaire: 0, prime: 0,
                    _raw: t
                }));
            } else {
                profs = getProfs();
            }

            const source = teachersFromAPI.length > 0
                ? `<span style="font-size:.75rem;color:var(--success);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> API connectée</span>`
                : `<span style="font-size:.75rem;color:var(--warning);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> Données locales</span>`;

            let rows = profs.map((p, i) => {
                const empIndex = employees.indexOf(p);
                return `<tr>
                    <td><div class="emp-cell"><div class="avatar-sm" style="background:${getColorFromString(p.nom)}">${getInitials(p)}</div><div class="emp-name">${p.prenom} ${p.nom}</div></div></td>
                    <td>${p.cours?.length ? p.cours.map(c=>`<span class="pill pill-info" style="margin:2px">${c}</span>`).join(' ') : '<span class="pill pill-muted">Aucun</span>'}</td>
                    <td>Promotion 2026</td><td>Lun-Ven 8h-16h</td>
                    <td><span class="pill ${p.statut==='Actif'?'pill-success':'pill-danger'}">${p.statut}</span></td>
                    <td><div class="btn-group">
                        ${empIndex >= 0 ? `<button class="btn btn-sm btn-outline btn-icon" onclick="viewProfil(${empIndex})"><i class="fas fa-eye"></i></button>` : ''}
                    </div></td></tr>`;
            }).join('');

            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Professeurs</span><h2>${profs.length}</h2></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-chalkboard-teacher"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Cours</span><h2>${profs.reduce((s,p)=>s+(p.cours?.length||0),0)}</h2></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-book"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Présence</span><h2>92%</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-chart-line"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-chalkboard-teacher"></i> Professeurs ${source}</h2></div>
            <div class="table-wrap"><table><thead><tr><th>Professeur</th><th>Cours</th><th>Promotion</th><th>Horaire</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Aucun professeur trouvé</td></tr>'}</tbody></table></div></div>`;
        }

        function openCoursModal(profId) {
            const emp = employees.find(e => e.id === profId);
            if (!emp) return;
            selectedCoursProfId = profId;
            document.getElementById('addCoursTitle').innerHTML = `<i class="fas fa-book"></i> Cours - ${emp.prenom} ${emp.nom}`;
            document.getElementById('coursProfId').value = profId;
            document.getElementById('nouveauCours').value = '';
            refreshCoursList();
            openModal('addCoursModal');
        }

        function refreshCoursList() {
            const emp = employees.find(e => e.id === selectedCoursProfId);
            const container = document.getElementById('coursListContainer');
            if (!emp || !container) return;
            if (emp.cours && emp.cours.length > 0) {
                container.innerHTML = emp.cours.map((c, i) => `<span class="pill pill-info" style="display:inline-flex;align-items:center;gap:5px">${c}<span class="badge-remove" onclick="retirerCours('${selectedCoursProfId}',${i})"><i class="fas fa-times"></i></span></span>`).join('');
            } else {
                container.innerHTML = '<span style="color:var(--muted)">Aucun cours assigné</span>';
            }
        }

        function ajouterCoursProf() {
            const profId = document.getElementById('coursProfId').value;
            const nouveauCours = document.getElementById('nouveauCours').value.trim();
            if (!nouveauCours) { showToast('⚠️ Entrez un nom de cours', 'error'); return; }
            const emp = employees.find(e => e.id === profId);
            if (!emp) return;
            if (!emp.cours) emp.cours = [];
            if (emp.cours.includes(nouveauCours)) { showToast('⚠️ Ce cours est déjà assigné', 'info'); return; }
            emp.cours.push(nouveauCours);
            document.getElementById('nouveauCours').value = '';
            refreshCoursList();
            showToast(`✅ "${nouveauCours}" ajouté`, 'success');
        }

        function retirerCours(profId, index) {
            const emp = employees.find(e => e.id === profId);
            if (!emp || !emp.cours) return;
            const coursRetire = emp.cours[index];
            emp.cours.splice(index, 1);
            refreshCoursList();
            showToast(`🗑️ "${coursRetire}" retiré`, 'info');
        }

        function voirEmploiTemps(id) {
            const emp = employees.find(e => e.id === id);
            if (emp) {
                document.getElementById('emploiTempsTitle').innerHTML = `<i class="fas fa-calendar-alt"></i> Emploi du Temps - ${emp.prenom} ${emp.nom}`;
                const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
                const heures = ['8h-10h', '10h-12h', '12h-14h', '14h-16h'];
                let html = `<div class="table-wrap"><table style="min-width:auto"><thead><tr><th style="padding:10px;border:1px solid #ddd;background:#f0f4f8">Horaire</th>${jours.map(j => `<th style="padding:10px;border:1px solid #ddd;background:#f0f4f8">${j}</th>`).join('')}</tr></thead><tbody>`;
                heures.forEach(h => {
                    html += `<tr><td style="padding:10px;border:1px solid #ddd;font-weight:600">${h}</td>`;
                    jours.forEach(() => {
                        const coursDispo = emp.cours?.length ? emp.cours[Math.floor(Math.random() * emp.cours.length)] : '—';
                        html += `<td style="padding:10px;border:1px solid #ddd;text-align:center;font-size:.8rem">${coursDispo}</td>`;
                    });
                    html += `</tr>`;
                });
                html += `</tbody></table></div>`;
                document.getElementById('emploiTempsContent').innerHTML = html;
                openModal('emploiTempsModal');
            }
        }

        window._presenceFilter = window._presenceFilter || 'all';

        function setPresenceFilter(filter) {
            window._presenceFilter = filter;
            const mc = document.getElementById('mainContent');
            if (mc) mc.innerHTML = renderPresences();
        }

        function renderPresences() {
            const today = getTodayDateString();
            const source = _apiReady
                ? `<span style="font-size:.75rem;color:var(--success);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> API</span>`
                : `<span style="font-size:.75rem;color:var(--warning);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> Local</span>`;

            // Filtrer uniquement les employés éligibles à pointer aujourd'hui (actifs)
            const employesAujourdhui = employees.filter(e => e.statut !== 'Suspendu' && e.statut !== 'Terminé');

            // Récupérer le pointage de chaque employé pour aujourd'hui
            const rowsData = employesAujourdhui.map(e => {
                const empIndex = employees.indexOf(e);
                const nomComplet = `${e.prenom} ${e.nom}`.trim().toLowerCase();
                const p = presencesData.find(att => att.date === today && (
                    (e._hrEmployeeId && att._employeeId === e._hrEmployeeId) ||
                    (att.employe && att.employe.trim().toLowerCase() === nomComplet)
                ));
                const isPointed = Boolean(p && p.statut && p.statut !== 'À pointer');
                return { employee: e, empIndex, pres: p, isPointed };
            });

            // Statistiques du jour
            const totalEmployees = employesAujourdhui.length;
            const dejaPointesList = rowsData.filter(r => r.isPointed);
            const aPointerList = rowsData.filter(r => !r.isPointed);
            const presentsCount = rowsData.filter(r => r.isPointed && (r.pres.statut === 'Présent' || r.pres.statut === 'Retard')).length;
            const retardsCount = rowsData.filter(r => r.isPointed && r.pres.statut === 'Retard').length;
            const absentsCount = rowsData.filter(r => r.isPointed && r.pres.statut === 'Absent').length;
            const tauxPresence = totalEmployees > 0 ? Math.round((presentsCount / totalEmployees) * 100) : 0;

            // Filtrage selon sélection active
            let displayedRows = rowsData;
            if (window._presenceFilter === 'a_pointer') {
                displayedRows = aPointerList;
            } else if (window._presenceFilter === 'pointes') {
                displayedRows = dejaPointesList;
            } else {
                // Par défaut : ceux à pointer apparaissent en premier
                displayedRows = [...aPointerList, ...dejaPointesList];
            }

            const formattedDate = new Date(today + 'T12:00:00').toLocaleDateString('fr-FR', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });

            let rows = displayedRows.map(({ employee: e, empIndex, pres, isPointed }) => {
                const isRecruit = e._source === 'Recrutement' || String(e.id).startsWith('REC-') || (candidatsData && candidatsData.some(c => `${c.prenom} ${c.nom}`.toLowerCase() === `${e.prenom} ${e.nom}`.toLowerCase()));
                const recruitBadge = isRecruit ? `<span class="pill pill-info" style="font-size:0.7rem;padding:2px 6px;margin-left:6px" title="Enregistré via le recrutement"><i class="fas fa-briefcase"></i> Recruté</span>` : '';
                
                let statutHtml = '';
                let actionsHtml = '';
                if (isPointed) {
                    const badgeClass = pres.statut === 'Retard' ? 'pill-warning' : pres.statut === 'Absent' ? 'pill-danger' : pres.statut === 'Congé' ? 'pill-info' : 'pill-success';
                    statutHtml = `<span class="pill ${badgeClass}"><i class="fas fa-check"></i> ${pres.statut}</span>`;
                    actionsHtml = `<div class="btn-group">
                        <button class="btn btn-sm btn-outline" onclick="corrigerHeureModal(${empIndex})"><i class="fas fa-edit"></i> Corriger</button>
                        <button class="btn btn-sm btn-outline btn-icon" title="Re-pointer" onclick="pointerPresenceModal(${empIndex})"><i class="fas fa-redo"></i></button>
                    </div>`;
                } else {
                    statutHtml = `<span class="pill pill-warning" style="background:#fffbeb;color:#b45309;border:1px solid #fde68a"><i class="fas fa-hourglass-half"></i> À pointer</span>`;
                    actionsHtml = `<button class="btn btn-sm btn-primary" onclick="pointerPresenceModal(${empIndex})"><i class="fas fa-clock"></i> Pointer</button>`;
                }

                return `<tr>
                    <td>
                        <div class="emp-cell">
                            <div class="avatar-sm" style="background:${getAvatarColor(empIndex)}">${getInitials(e)}</div>
                            <div>
                                <div class="emp-name" style="display:flex;align-items:center">${e.prenom} ${e.nom} ${recruitBadge}</div>
                                <div class="emp-detail">${e.fonction || 'Employé'} • ${e.dept || 'Administration'}</div>
                            </div>
                        </div>
                    </td>
                    <td>${new Date(today + 'T12:00:00').toLocaleDateString('fr-FR')}</td>
                    <td style="font-weight:600">${pres ? pres.entree : '—'}</td>
                    <td style="font-weight:600">${pres ? pres.sortie : '—'}</td>
                    <td>${statutHtml}</td>
                    <td>${isPointed ? (pres.statut === 'Absent' ? '<span class="pill pill-danger">Absent</span>' : '<span class="pill pill-success">Présent</span>') : '<span class="pill pill-muted">Non pointé</span>'}</td>
                    <td>${actionsHtml}</td>
                </tr>`;
            }).join('');

            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Employés Aujourd'hui</span><h2>${totalEmployees}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-users"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Reste à Pointer</span><h2>${aPointerList.length}</h2></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-hourglass-half"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Pointés (Présents/Retards)</span><h2>${presentsCount}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-user-check"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Taux Pointage</span><h2>${tauxPresence}%</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-percentage"></i></div></div>
            </div>
            <div class="card">
                <div class="card-header" style="flex-wrap:wrap;gap:12px">
                    <div>
                        <h2 style="margin:0"><i class="fas fa-clock"></i> Pointage du Jour — <span style="text-transform:capitalize;font-weight:600;font-size:1.1rem">${formattedDate}</span> ${source}</h2>
                    </div>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline" onclick="exportPresencesCSV()"><i class="fas fa-file-excel"></i> Excel</button>
                    </div>
                </div>
                <div style="padding:12px 20px;border-bottom:1px solid #e2e8f0;background:#f8fafc;display:flex;gap:10px;align-items:center;flex-wrap:wrap">
                    <span style="font-weight:600;color:var(--muted);font-size:.85rem;margin-right:6px"><i class="fas fa-filter"></i> Affichage :</span>
                    <button class="btn btn-sm ${window._presenceFilter==='all'?'btn-primary':'btn-outline'}" onclick="setPresenceFilter('all')">
                        <i class="fas fa-list"></i> Tous pour aujourd'hui (${totalEmployees})
                    </button>
                    <button class="btn btn-sm ${window._presenceFilter==='a_pointer'?'btn-primary':'btn-outline'}" onclick="setPresenceFilter('a_pointer')">
                        <i class="fas fa-hourglass-half"></i> À pointer seulement (${aPointerList.length})
                    </button>
                    <button class="btn btn-sm ${window._presenceFilter==='pointes'?'btn-primary':'btn-outline'}" onclick="setPresenceFilter('pointes')">
                        <i class="fas fa-check-circle"></i> Déjà pointés (${dejaPointesList.length})
                    </button>
                </div>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Employé</th>
                                <th>Date</th>
                                <th>Entrée</th>
                                <th>Sortie</th>
                                <th>Statut</th>
                                <th>Présence</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows || `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px"><i class="fas fa-info-circle"></i> Aucun employé trouvé pour ce filtre.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>`;
        }

        function pointerPresenceModal(empIndex) {
            if (empIndex < 0 || empIndex >= employees.length) return;
            const e = employees[empIndex];
            const today = getTodayDateString();
            document.getElementById('pointageTitle').innerHTML = `<i class="fas fa-clock"></i> Pointer - ${e.prenom} ${e.nom}`;
            document.getElementById('pointageEmpIndex').value = empIndex;
            document.getElementById('pointageDate').value = today;
            document.getElementById('pointageDate').disabled = true;
            document.getElementById('pointageEntree').value = '08:00';
            document.getElementById('pointageSortie').value = '16:00';
            document.getElementById('pointageStatut').value = 'Présent';
            document.getElementById('pointageNotes').value = '';
            openModal('pointageModal');
        }

        function corrigerHeureModal(empIndex) {
            if (empIndex < 0 || empIndex >= employees.length) return;
            const e = employees[empIndex];
            const today = getTodayDateString();
            const nomComplet = `${e.prenom} ${e.nom}`.trim().toLowerCase();
            const existing = presencesData.find(p => p.date === today && (
                (p.employe && p.employe.trim().toLowerCase() === nomComplet) ||
                (e._hrEmployeeId && p._employeeId === e._hrEmployeeId)
            ));
            document.getElementById('pointageTitle').innerHTML = `<i class="fas fa-edit"></i> Corriger - ${e.prenom} ${e.nom}`;
            document.getElementById('pointageEmpIndex').value = empIndex;
            document.getElementById('pointageDate').value = today;
            document.getElementById('pointageDate').disabled = true;
            document.getElementById('pointageEntree').value = existing ? existing.entree : '08:00';
            document.getElementById('pointageSortie').value = existing ? existing.sortie : '16:00';
            document.getElementById('pointageStatut').value = existing ? existing.statut : 'Présent';
            document.getElementById('pointageNotes').value = existing ? (existing.notes || '') : '';
            openModal('pointageModal');
        }

        async function enregistrerPointage() {
            await ensureAuth();
            const empIndex = parseInt(document.getElementById('pointageEmpIndex').value);
            if (empIndex < 0 || empIndex >= employees.length) { showToast('⚠️ Employé invalide', 'error'); return; }
            const e = employees[empIndex];
            const nomComplet = `${e.prenom} ${e.nom}`.trim();
            const date = document.getElementById('pointageDate').value || getTodayDateString();
            const entree = document.getElementById('pointageEntree').value;
            const sortie = document.getElementById('pointageSortie').value;
            const statut = document.getElementById('pointageStatut').value;
            const notes = document.getElementById('pointageNotes').value;
            
            let employeeId = e._hrEmployeeId;
            // Si l'employé n'a pas encore d'_hrEmployeeId (ex: recrue nouvellement ajoutée), la créer dans l'API
            if (!employeeId && _apiReady) {
                try {
                    const statuses = { Actif: 'active', Suspendu: 'suspended', 'Congé': 'inactive', Terminé: 'terminated' };
                    const createdEmp = await HRAPI.createEmployee({
                        employee_number: e.id || `EMP-${Date.now().toString().slice(-6)}`,
                        first_name: e.prenom,
                        last_name: e.nom,
                        gender: e.sexe || 'N/A',
                        phone: e.tel && e.tel !== 'N/A' ? e.tel : '',
                        email: e.email && e.email !== 'N/A' ? e.email : '',
                        job_title: e.fonction || 'Employé',
                        department: e.dept || 'Administration',
                        hire_date: e.embauche || date,
                        status: statuses[e.statut] || 'active',
                        monthly_salary: Number(e.salaire) || 0,
                        monthly_bonus: Number(e.prime) || 0
                    });
                    if (createdEmp && createdEmp.id) {
                        employeeId = createdEmp.id;
                        e._hrEmployeeId = createdEmp.id;
                    }
                } catch (err) {
                    console.warn('[RH] Impossible de créer la fiche employé distante:', err);
                }
            }

            const existingIndex = presencesData.findIndex(p => 
                (p.employe.trim().toLowerCase() === nomComplet.toLowerCase() || (employeeId && p._employeeId === employeeId)) && p.date === date
            );
            const existing = existingIndex >= 0 ? presencesData[existingIndex] : null;

            const data = {
                employe: nomComplet,
                date,
                entree,
                sortie,
                statut,
                notes,
                _apiId: existing?._apiId || null,
                _employeeId: employeeId || existing?._employeeId || null
            };

            if (employeeId) {
                try {
                    const body = {
                        employee: employeeId,
                        date,
                        check_in_time: entree || null,
                        check_out_time: sortie || null,
                        status: _mapAttendanceStatusToAPI(statut),
                        notes
                    };
                    let saved;
                    if (existing?._apiId) {
                        saved = await HRAPI.updateAttendance(existing._apiId, body);
                    } else {
                        saved = await HRAPI.createAttendance(body);
                    }
                    data._apiId = saved.id;
                    data._employeeId = saved.employee;
                    data.entree = saved.check_in_time ? String(saved.check_in_time).slice(0, 5) : entree;
                    data.sortie = saved.check_out_time ? String(saved.check_out_time).slice(0, 5) : sortie;
                    data.statut = _mapAttendanceStatusFromAPI(saved.status);
                } catch (err) {
                    console.error('[RH] enregistrerPointage API échoué:', err);
                    showToast('❌ La présence n’a pas été enregistrée dans la base de données.', 'error');
                    return;
                }
            } else {
                showToast('❌ Fiche employé introuvable : présence non enregistrée.', 'error');
                return;
            }

            if (existingIndex >= 0) { presencesData[existingIndex] = data; }
            else { presencesData.unshift(data); }

            closeModal('pointageModal');
            document.getElementById('mainContent').innerHTML = renderPresences();
            showToast(`✅ Présence enregistrée pour ${nomComplet}`, 'success');
        }

        /** Charge les congés depuis l'API puis rend l'onglet */
        async function loadAndRenderConges() {
            showTabSpinner();
            try {
                const raw = await HRAPI.leaves();
                // Normaliser les données API vers la forme locale
                congesData = raw.map(l => ({
                    id: l.id,
                    _apiId: l.id,
                    employe: l.employee_name || l.teacher_name || 'Inconnu',
                    type: l.leave_type_name || l.leave_type || 'Congé',
                    debut: l.start_date ? new Date(l.start_date).toLocaleDateString('fr-FR') : '—',
                    fin: l.end_date ? new Date(l.end_date).toLocaleDateString('fr-FR') : '—',
                    jours: l.days_used || 0,
                    motif: l.reason || '',
                    statut: _mapLeaveStatus(l.status)
                }));
            } catch (e) {
                console.warn('[RH] Impossible de charger les congés:', e);
                // Garder congesData tel quel (peut être vide ou précédemment rempli)
            }
            document.getElementById('mainContent').innerHTML = renderConges();
        }

        function _mapLeaveStatus(s) {
            if (s === 'approved') return 'Approuvé';
            if (s === 'rejected') return 'Refusé';
            if (s === 'cancelled') return 'Annulé';
            return 'En attente';
        }

        function renderConges() {
            const source = _apiReady
                ? `<span style="font-size:.75rem;color:var(--success);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> API</span>`
                : `<span style="font-size:.75rem;color:var(--warning);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> Local</span>`;
            let rows = congesData.map(c => `<tr><td class="emp-name">${c.employe}</td>
                <td><span class="pill ${c.type.includes('maladie')?'pill-danger':c.type.includes('annuel')?'pill-info':'pill-warning'}">${c.type}</span></td>
                <td>${c.debut}</td><td>${c.fin}</td><td>${c.jours}</td><td>${c.motif}</td>
                <td><span class="pill ${c.statut==='Approuvé'?'pill-success':c.statut==='Refusé'?'pill-danger':'pill-warning'}">${c.statut}</span></td>
                <td><div class="btn-group">${c.statut==='En attente'?`<button class="btn btn-sm btn-outline" onclick="approuverConge(${c._apiId||c.id})">✓</button><button class="btn btn-sm btn-danger btn-icon" onclick="refuserConge(${c._apiId||c.id})"><i class="fas fa-times"></i></button>`:''}
                <button class="btn btn-sm btn-outline btn-icon" onclick="voirHistConge('${c.employe}')"><i class="fas fa-history"></i></button></div></td></tr>`).join('');
            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>En attente</span><h2>${congesData.filter(c=>c.statut==='En attente').length}</h2></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-hourglass-half"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Approuvés</span><h2>${congesData.filter(c=>c.statut==='Approuvé').length}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Total Jours</span><h2>${congesData.reduce((s,c)=>s+(c.jours||0),0)}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-calendar-day"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-umbrella-beach"></i> Congés ${source}</h2><button class="btn btn-primary btn-sm" onclick="openCongeModal()"><i class="fas fa-plus"></i> Nouvelle Demande</button></div>
            <div class="table-wrap"><table><thead><tr><th>Employé</th><th>Type</th><th>Début</th><th>Fin</th><th>Jours</th><th>Motif</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="8" style="text-align:center;color:var(--muted)">Aucun congé enregistré</td></tr>'}</tbody></table></div></div>`;
        }

        function openCongeModal() {
            const persistedEmployees = employees.filter(e => e._hrEmployeeId);
            document.getElementById('congeEmp').innerHTML = persistedEmployees.map(e =>
                `<option value="${e._hrEmployeeId}">${e.prenom} ${e.nom}</option>`
            ).join('');
            document.getElementById('congeType').innerHTML = leaveTypesFromAPI.map(lt =>
                `<option value="${lt.id}">${lt.name}</option>`
            ).join('');
            openModal('addCongeModal');
        }

        async function soumettreConge() {
            const employeeId = document.getElementById('congeEmp').value;
            const debut = document.getElementById('congeDebut').value;
            const fin = document.getElementById('congeFin').value;
            if (!employeeId || !debut || !fin) { showToast('⚠️ Champs requis', 'error'); return; }
            const d1 = new Date(debut), d2 = new Date(fin);
            const jours = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
            const leaveTypeId = document.getElementById('congeType').value;
            const leaveType = leaveTypesFromAPI.find(lt => String(lt.id) === String(leaveTypeId));
            const typeConge = leaveType?.name || '';
            const motif = document.getElementById('congeMotif').value;

            if (employeeId && leaveType) {
                try {
                    const body = {
                        employee: employeeId,
                        leave_type: leaveType.id,
                        start_date: debut,
                        end_date: fin,
                        days_used: jours,
                        reason: motif
                    };
                    await HRAPI.createLeave(body);
                    closeModal('addCongeModal');
                    await loadAndRenderConges();
                    showToast(`✅ Demande soumise (${jours} jours) — Enregistrée dans la base`, 'success');
                    return;
                } catch (err) {
                    console.error('[RH] createLeave échoué:', err);
                    showToast('❌ Demande non enregistrée : ' + (err.detail ? JSON.stringify(err.detail) : err.message), 'error');
                    return;
                }
            }
            showToast('❌ Cet employé ou type de congé n’est pas synchronisé avec la base', 'error');
        }

        async function approuverConge(id) {
            const c = congesData.find(c => (c._apiId || c.id) === id);
            if (!c) return;
            if (c._apiId) {
                try {
                    await HRAPI.approveLeave(c._apiId);
                    c.statut = 'Approuvé';
                    document.getElementById('mainContent').innerHTML = renderConges();
                    showToast('✅ Congé approuvé — Sauvegardé dans la base', 'success');
                    return;
                } catch (err) { console.warn('[RH] approveLeave échoué:', err); }
            }
            c.statut = 'Approuvé';
            document.getElementById('mainContent').innerHTML = renderConges();
            showToast('✅ Congé approuvé', 'success');
        }

        async function refuserConge(id) {
            const c = congesData.find(c => (c._apiId || c.id) === id);
            if (!c) return;
            if (c._apiId) {
                try {
                    await HRAPI.rejectLeave(c._apiId);
                    c.statut = 'Refusé';
                    document.getElementById('mainContent').innerHTML = renderConges();
                    showToast('❌ Congé refusé — Sauvegardé dans la base', 'error');
                    return;
                } catch (err) { console.warn('[RH] rejectLeave échoué:', err); }
            }
            c.statut = 'Refusé';
            document.getElementById('mainContent').innerHTML = renderConges();
            showToast('❌ Congé refusé', 'error');
        }

        function voirHistConge(employe) {
            document.getElementById('histCongeTitle').innerHTML = `<i class="fas fa-history"></i> Historique Congés - ${employe}`;
            const hist = congesData.filter(c => c.employe === employe);
            let html = hist.length ? `<div class="hist-cards">` + hist.map(c => {
                const iconColor = c.type.includes('maladie') ? 'var(--red)' : c.type.includes('annuel') ? 'var(--info)' : 'var(--warning)';
                const iconBg = c.type.includes('maladie') ? 'var(--red-light)' : c.type.includes('annuel') ? 'var(--info-light)' : 'var(--warning-light)';
                return `<div class="hist-card"><div class="hist-card-left"><div class="hist-card-icon" style="background:${iconBg};color:${iconColor}"><i class="fas ${c.type.includes('maladie')?'fa-briefcase-medical':c.type.includes('annuel')?'fa-umbrella-beach':'fa-clock'}"></i></div><div class="hist-card-info"><h4>${c.type}</h4><span>${c.motif||'Aucun motif'}</span></div></div><div class="hist-card-right"><div class="hist-card-stat"><div class="hstat-value">${c.debut}</div><div class="hstat-label">Début</div></div><div class="hist-card-divider"></div><div class="hist-card-stat"><div class="hstat-value">${c.fin}</div><div class="hstat-label">Fin</div></div><div class="hist-card-divider"></div><div class="hist-card-stat"><div class="hstat-value">${c.jours}j</div><div class="hstat-label">Jours</div></div><span class="pill ${c.statut==='Approuvé'?'pill-success':'pill-warning'}">${c.statut}</span></div></div>`;
            }).join('') + `</div>` : '<div class="alert-info"><i class="fas fa-info-circle"></i> Aucun historique</div>';
            document.getElementById('histCongeContent').innerHTML = html;
            openModal('histCongeModal');
        }

        /** Charge les salaires depuis l'API puis rend l'onglet */
        async function loadAndRenderSalaires() {
            showTabSpinner();
            try {
                salaireFromAPI = await HRAPI.salaries();
            } catch (e) {
                console.warn('[RH] Impossible de charger les salaires:', e);
                salaireFromAPI = [];
            }
            document.getElementById('mainContent').innerHTML = renderSalaires();
        }

        function renderSalaires() {
            // Si l'API a retourné des salaires, on les affiche en priorité
            let rows, totalBrut = 0, totalNet = 0;
            const source = salaireFromAPI.length > 0
                ? `<span style="font-size:.75rem;color:var(--success);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> API</span>`
                : `<span style="font-size:.75rem;color:var(--warning);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> Local</span>`;

            if (salaireFromAPI.length > 0) {
                rows = salaireFromAPI.map(s => {
                    const base = parseFloat(s.base_salary) || 0;
                    const bonuses = parseFloat(s.bonuses) || 0;
                    const ded = parseFloat(s.deductions) || Math.round(base * 0.08);
                    const net = parseFloat(s.net_salary) || (base + bonuses - ded);
                    totalBrut += base + bonuses;
                    totalNet += net;
                    const isPaid = s.status === 'paid';
                    return `<tr>
                        <td><div class="emp-name">${s.employee_name || s.teacher_name || 'Inconnu'}</div><div class="emp-detail">${s.status || '—'}</div></td>
                        <td>${base.toLocaleString()} HTG</td>
                        <td style="color:var(--success)">+${bonuses.toLocaleString()} HTG</td>
                        <td style="color:var(--red)">-${ded.toLocaleString()} HTG</td>
                        <td style="font-weight:800;color:var(--blue)">${net.toLocaleString()} HTG</td>
                        <td><span class="pill ${isPaid?'pill-success':'pill-warning'}">${isPaid?'Payé':'En attente'}</span></td>
                        <td><div class="btn-group">
                            <button class="btn btn-sm btn-outline" onclick="genererFicheAPI(${s.id})"><i class="fas fa-receipt"></i> Fiche</button>
                            ${!isPaid ? `<button class="btn btn-sm btn-success" onclick="marquerPaye(${s.id})"><i class="fas fa-check"></i> Payé</button>` : ''}
                        </div></td></tr>`;
                }).join('');
            } else {
                rows = employees.map(e => {
                    const base = e.salaire || 50000, prime = e.prime || 5000, ded = Math.round(base * 0.08), net = base + prime - ded;
                    totalBrut += base + prime; totalNet += net;
                    return `<tr><td><div class="emp-name">${e.prenom} ${e.nom}</div><div class="emp-detail">${e.fonction}</div></td><td>${base.toLocaleString()} HTG</td><td style="color:var(--success)">+${prime.toLocaleString()} HTG</td><td style="color:var(--red)">-${ded.toLocaleString()} HTG</td><td style="font-weight:800;color:var(--blue)">${net.toLocaleString()} HTG</td><td><span class="pill pill-warning">Local</span></td><td><div class="btn-group"><button class="btn btn-sm btn-outline" onclick="genererFiche('${e.id}')"><i class="fas fa-receipt"></i> Fiche</button><button class="btn btn-sm btn-outline btn-icon" onclick="voirHistSalaire(${employees.indexOf(e)})"><i class="fas fa-history"></i></button></div></td></tr>`;
                }).join('');
            }

            const colCount = salaireFromAPI.length > 0 ? 7 : 6;
            return `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
                <div class="stat-card"><div class="stat-info"><span>Masse brute</span><h2>${totalBrut.toLocaleString()}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-money-bill-wave"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Net total</span><h2>${totalNet.toLocaleString()}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-wallet"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>${salaireFromAPI.length > 0 ? 'Fiches' : 'Employés'}</span><h2>${salaireFromAPI.length > 0 ? salaireFromAPI.length : employees.length}</h2></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-users"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-money-bill-wave"></i> Salaires ${source}</h2><div class="btn-group">
                <button class="btn btn-sm btn-outline" onclick="exportSalairesCSV()"><i class="fas fa-file-excel"></i> Excel</button>
                <button class="btn btn-sm btn-outline" onclick="exportSalairesPDF()"><i class="fas fa-file-pdf"></i> PDF</button>
                <button class="btn btn-sm btn-primary" onclick="calculerPayroll()"><i class="fas fa-calculator"></i> Calculer</button>
            </div></div>
            <div class="table-wrap"><table><thead><tr><th>Employé</th><th>Base</th><th>Prime/Bonus</th><th>Déductions</th><th>Net</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows || '<tr><td colspan="'+colCount+'" style="text-align:center;color:var(--muted)">Aucun salaire trouvé</td></tr>'}</tbody></table></div></div>`;
        }

        function genererFiche(id) {
            selectedFicheEmp = employees.find(e => e.id === id);
            if (selectedFicheEmp) showFichePaieModal(selectedFicheEmp);
        }

        function genererFicheAPI(salaryId) {
            const s = salaireFromAPI.find(s => s.id === salaryId);
            if (!s) return;
            const empName = s.employee_name || s.teacher_name;
            const empLocal = { prenom: empName?.split(' ')[0] || 'Employé', nom: empName?.split(' ').slice(1).join(' ') || '', id: 'S-' + s.id, salaire: parseFloat(s.base_salary) || 0, prime: parseFloat(s.bonuses) || 0 };
            selectedFicheEmp = empLocal;
            showFichePaieModal(empLocal);
        }

        async function marquerPaye(salaryId) {
            try {
                await HRAPI.markSalaryPaid(salaryId, { payment_date: new Date().toISOString().slice(0, 10) });
                showToast('✅ Salaire marqué comme payé', 'success');
                await loadAndRenderSalaires();
            } catch (err) {
                console.error('[RH] markSalaryPaid échoué:', err);
                showToast('❌ Erreur lors de la mise à jour', 'error');
            }
        }

        function calculerPayroll() { showToast('✅ Payroll calculé', 'success'); loadAndRenderSalaires(); }

        function exportSalairesCSV() {
            let csv = 'Matricule,Employé,Fonction,Salaire Base,Prime,Déductions,Net\n';
            employees.forEach(e => {
                const base = e.salaire || 50000, prime = e.prime || 5000, ded = Math.round(base * 0.08), net = base + prime - ded;
                csv += `${e.id},${e.prenom} ${e.nom},${e.fonction},${base},${prime},${ded},${net}\n`;
            });
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'salaires_cejec.csv';
            a.click();
            showToast('📁 CSV Salaires exporté', 'success');
        }

        function exportSalairesPDF() {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                doc.setFillColor(10, 77, 140);
                doc.rect(0, 0, pageWidth, 22, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('CEJEC', 14, 14);
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.text("Centre d'Études des Jeunes en Entrepreneuriat et Commerce", 14, 19);
                doc.setFontSize(10);
                doc.text(`Rapport des Salaires — ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 14, 14, { align: 'right' });

                let totalBase = 0, totalPrime = 0, totalDed = 0, totalNet = 0;
                const body = employees.map(e => {
                    const base = e.salaire || 50000, prime = e.prime || 5000, ded = Math.round(base * 0.08), net = base + prime - ded;
                    totalBase += base; totalPrime += prime; totalDed += ded; totalNet += net;
                    return [e.id, `${e.prenom} ${e.nom}`, e.fonction, `${base.toLocaleString()} HTG`, `${prime.toLocaleString()} HTG`, `${ded.toLocaleString()} HTG`, `${net.toLocaleString()} HTG`];
                });

                doc.autoTable({
                    head: [['Matricule', 'Employé', 'Fonction', 'Base', 'Prime', 'Déductions', 'Net']],
                    body: body,
                    foot: [['', '', 'TOTAL', `${totalBase.toLocaleString()} HTG`, `${totalPrime.toLocaleString()} HTG`, `${totalDed.toLocaleString()} HTG`, `${totalNet.toLocaleString()} HTG`]],
                    startY: 28,
                    theme: 'grid',
                    styles: { lineColor: [220, 226, 235], lineWidth: 0.1, fontSize: 9 },
                    headStyles: { fillColor: [10, 77, 140], textColor: 255, fontStyle: 'bold' },
                    footStyles: { fillColor: [240, 244, 248], textColor: [10, 77, 140], fontStyle: 'bold' },
                    alternateRowStyles: { fillColor: [240, 244, 248] },
                    columnStyles: { 3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 6: { halign: 'right' } },
                    margin: { left: 14, right: 14 },
                    didDrawPage: function() {
                        const pageCount = doc.internal.getNumberOfPages();
                        doc.setFontSize(8);
                        doc.setTextColor(139, 149, 165);
                        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber} / ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
                        doc.text('Généré par le Module RH CEJEC', 14, pageHeight - 8);
                    }
                });

                doc.save('salaires_cejec.pdf');
                showToast('📄 PDF exporté', 'success');
            } catch (e) {
                console.error('Erè export salaires PDF:', e);
                showToast('❌ Erreur export PDF', 'error');
            }
        }

        function voirHistSalaire(i) {
            const e = employees[i];
            document.getElementById('histSalaireTitle').innerHTML = `<i class="fas fa-history"></i> Salaire - ${e.prenom} ${e.nom}`;
            const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'];
            let html = `<div class="hist-cards">` + mois.map(m => {
                const base = e.salaire || 50000, ded = Math.round(base * 0.08), net = base + (e.prime || 5000) - ded;
                return `<div class="hist-card"><div class="hist-card-left"><div class="hist-card-icon" style="background:var(--blue-light);color:var(--blue)"><i class="fas fa-calendar-week"></i></div><div class="hist-card-info"><h4>${m} 2026</h4><span>Salaire mensuel</span></div></div><div class="hist-card-right"><div class="hist-card-stat"><div class="hstat-value">${base.toLocaleString()}</div><div class="hstat-label">Base</div></div><div class="hist-card-divider"></div><div class="hist-card-stat"><div class="hstat-value" style="color:var(--success)">+${(e.prime||5000).toLocaleString()}</div><div class="hstat-label">Prime</div></div><div class="hist-card-divider"></div><div class="hist-card-stat"><div class="hstat-value" style="color:var(--red)">-${ded.toLocaleString()}</div><div class="hstat-label">Déd.</div></div><div class="hist-card-divider"></div><div class="hist-card-stat"><div class="hstat-value" style="color:var(--blue);font-size:1.2rem">${net.toLocaleString()}</div><div class="hstat-label">Net</div></div></div></div>`;
            }).join('') + `</div>`;
            document.getElementById('histSalaireContent').innerHTML = html;
            openModal('histSalaireModal');
        }

        function renderFichePaie() {
            let rows = employees.map(e => `<tr><td><div class="emp-name">${e.prenom} ${e.nom}</div><div class="emp-detail">${e.id}</div></td><td>${e.fonction}</td><td>${e.dept}</td><td style="font-weight:800;color:var(--blue)">${((e.salaire||50000)+(e.prime||5000)-Math.round((e.salaire||50000)*0.08)).toLocaleString()} HTG</td><td><button class="btn btn-sm btn-primary" onclick="genererFiche('${e.id}')"><i class="fas fa-receipt"></i> Voir Fiche</button></td></tr>`).join('');
            return `<div class="stats-grid"><div class="stat-card"><div class="stat-info"><span>Fiches</span><h2>${employees.length}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-receipt"></i></div></div></div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-receipt"></i> Fiches de Paie</h2></div>
            <div class="table-wrap"><table><thead><tr><th>Employé</th><th>Fonction</th><th>Dépt</th><th>Net</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
        }

        function showFichePaieModal(emp) {
            const base = emp.salaire || 50000, prime = emp.prime || 5000;
            const taks = Math.round(base * 0.15), ofatma = Math.round(base * 0.06), dedTotal = taks + ofatma, net = base + prime - dedTotal;
            document.getElementById('fichePaieContent').innerHTML = `
            <div class="payslip"><div class="payslip-header"><div class="payslip-logo">CEJEC</div><div class="payslip-sub">Centre d'Études des Jeunes en Entrepreneuriat et Commerce</div><div class="payslip-title">Fiche de Paie — ${new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</div></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px"><div><div class="d-label">Employé</div><div class="d-value">${emp.prenom} ${emp.nom}</div></div><div><div class="d-label">Matricule</div><div class="d-value">${emp.id}</div></div></div>
            <div class="payslip-row"><span>Salaire Base</span><span>${base.toLocaleString()}.00 HTG</span></div>
            <div class="payslip-row"><span>Primes</span><span>${prime.toLocaleString()}.00 HTG</span></div>
            <div class="payslip-row"><span>Taks (15%)</span><span style="color:var(--red)">-${taks.toLocaleString()}.00 HTG</span></div>
            <div class="payslip-row"><span>OFATMA (6%)</span><span style="color:var(--red)">-${ofatma.toLocaleString()}.00 HTG</span></div>
            <div class="payslip-total"><div class="payslip-total-label">Net à Payer</div><div class="payslip-total-amount">${net.toLocaleString()}.00 HTG</div></div></div>`;
            openModal('fichePaieModal');
        }

        function renderRecrutement() {
            const source = _apiReady
                ? `<span style="font-size:.75rem;color:var(--success);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> API</span>`
                : `<span style="font-size:.75rem;color:var(--warning);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> Local</span>`;
            let rows = candidatsData.map((c, i) => `<tr><td><div class="emp-name">${c.prenom} ${c.nom}</div><div class="emp-detail">${c.dateCandidature}</div></td><td>${c.poste}</td><td>${c.tel}</td><td>${c.email}</td>
                <td><span class="pill ${c.cv==='Reçu'?'pill-success':'pill-muted'}">${c.cv}</span></td>
                <td><span class="pill ${c.statut==='Entretien'?'pill-info':c.statut==='Accepté'?'pill-success':c.statut==='Refusé'?'pill-danger':'pill-warning'}">${c.statut}</span></td>
                <td><div class="btn-group">
                    <button class="btn btn-sm btn-outline btn-icon" onclick="voirCandidat(${i})"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline btn-icon" onclick="editCandidat(${i})"><i class="fas fa-edit"></i></button>
                    ${c.statut==='En attente' ? `<button class="btn btn-sm btn-outline" onclick="programmerEntretien(${i})"><i class="fas fa-calendar-check"></i> Entretien</button><button class="btn btn-sm btn-success" onclick="accepterCandidat(${i})"><i class="fas fa-user-plus"></i> Embaucher</button>` : ''}
                    ${c.statut==='Entretien' ? `<button class="btn btn-sm btn-success" onclick="accepterCandidat(${i})"><i class="fas fa-user-plus"></i> Embaucher</button><button class="btn btn-sm btn-danger btn-icon" onclick="refuserCandidat(${i})"><i class="fas fa-times"></i></button>` : ''}
                </div></td></tr>`).join('');
            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Candidats</span><h2>${candidatsData.length}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-briefcase"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Entretiens</span><h2>${candidatsData.filter(c=>c.statut==='Entretien').length}</h2></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-calendar-check"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Acceptés</span><h2>${candidatsData.filter(c=>c.statut==='Accepté').length}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-briefcase"></i> Recrutement ${source}</h2><button class="btn btn-primary btn-sm" onclick="openModal('addCandidatModal')"><i class="fas fa-plus"></i> Ajouter</button></div>
            <div class="table-wrap"><table><thead><tr><th>Candidat</th><th>Poste</th><th>Tél</th><th>Email</th><th>CV</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
        }

        async function loadAndRenderRecrutement() {
            showTabSpinner();
            try {
                await ensureAuth();
                const raw = await HRAPI.candidates();
                candidatsData = raw.map(mapCandidateFromAPI);
            } catch (e) {
                console.warn('[RH] Impossible de charger les candidats:', e);
            }
            document.getElementById('mainContent').innerHTML = renderRecrutement();
        }

        function voirCandidat(i) {
            const c = candidatsData[i];
            if (!c) return;
            document.getElementById('detailsCandidatTitle').innerHTML = `<i class="fas fa-eye"></i> ${c.prenom} ${c.nom}`;
            document.getElementById('detailsCandidatContent').innerHTML = `<div class="detail-grid">
                <div class="detail-item"><div class="d-label">Nom</div><div class="d-value">${c.prenom} ${c.nom}</div></div>
                <div class="detail-item"><div class="d-label">Poste</div><div class="d-value">${c.poste}</div></div>
                <div class="detail-item"><div class="d-label">Tél</div><div class="d-value">${c.tel}</div></div>
                <div class="detail-item"><div class="d-label">Email</div><div class="d-value">${c.email}</div></div>
                <div class="detail-item"><div class="d-label">Statut</div><div class="d-value"><span class="pill ${c.statut==='Entretien'?'pill-info':c.statut==='Accepté'?'pill-success':c.statut==='Refusé'?'pill-danger':'pill-warning'}">${c.statut}</span></div></div>
                <div class="detail-item"><div class="d-label">Date</div><div class="d-value">${c.dateCandidature}</div></div>
                ${c.dateEntretien?`<div class="detail-item"><div class="d-label">Entretien</div><div class="d-value">${c.dateEntretien} à ${c.heureEntretien}</div></div>`:''}
                ${c.interviewer?`<div class="detail-item"><div class="d-label">Intervieweur</div><div class="d-value">${c.interviewer}</div></div>`:''}
                <div class="detail-item" style="grid-column:1/-1"><div class="d-label">Notes</div><div class="d-value">${c.notes||'Aucune'}</div></div>
            </div>`;
            openModal('detailsCandidatModal');
        }

        function editCandidat(i) {
            editingCandidatIndex = i;
            const c = candidatsData[i];
            document.getElementById('modalCandidatTitle').innerHTML = `<i class="fas fa-edit"></i> Modifier - ${c.prenom} ${c.nom}`;
            document.getElementById('editCandidatIndex').value = i;
            document.getElementById('candPrenom').value = c.prenom;
            document.getElementById('candNom').value = c.nom;
            document.getElementById('candTel').value = c.tel;
            document.getElementById('candEmail').value = c.email;
            document.getElementById('candPoste').value = c.poste;
            document.getElementById('candDate').value = c.dateCandidature.split('/').reverse().join('-');
            document.getElementById('candNotes').value = c.notes || '';
            resetCVUpload();
            openModal('addCandidatModal');
        }

        async function saveCandidat() {
            await ensureAuth();
            const p = document.getElementById('candPrenom').value.trim();
            const n = document.getElementById('candNom').value.trim();
            if (!p || !n) { showToast('⚠️ Prénom et nom requis', 'error'); return; }
            const applicationDate = document.getElementById('candDate').value || getTodayDateString();
            const existing = editingCandidatIndex !== null ? candidatsData[editingCandidatIndex] : null;
            const posteVal = document.getElementById('candPoste').value;
            const telVal = document.getElementById('candTel').value;
            const emailVal = document.getElementById('candEmail').value;
            const notesVal = document.getElementById('candNotes').value;
            const formData = new FormData();
            formData.append('first_name', p);
            formData.append('last_name', n);
            formData.append('phone', telVal);
            formData.append('email', emailVal);
            formData.append('position', posteVal);
            formData.append('application_date', applicationDate);
            formData.append('notes', notesVal);
            if (existing?.statut) formData.append('status', _mapCandidateStatusToAPI(existing.statut));
            if (window._tempCVFile) formData.append('cv_file', window._tempCVFile);

            try {
                if (existing?._apiId) {
                    await HRAPI.updateCandidate(existing._apiId, formData);
                    showToast(`✅ ${p} ${n} modifié`, 'success');
                } else {
                    await HRAPI.createCandidate(formData);
                    showToast(`✅ ${p} ${n} ajouté au recrutement`, 'success');
                }
                editingCandidatIndex = null;
                closeModal('addCandidatModal');
                resetCVUpload();
                await Promise.all([syncAllEmployees(), loadAndRenderRecrutement()]);
                updateBadges();
            } catch (err) {
                console.warn('[RH] API saveCandidat non disponible, sauvegarde locale:', err);
                const localCand = {
                    _apiId: existing?._apiId || null,
                    prenom: p,
                    nom: n,
                    tel: telVal,
                    email: emailVal,
                    poste: posteVal,
                    cv: window._tempCVFile ? 'Reçu' : 'En attente',
                    statut: existing ? existing.statut : 'En attente',
                    dateCandidature: new Date(applicationDate).toLocaleDateString('fr-FR'),
                    dateEntretien: '',
                    heureEntretien: '',
                    interviewer: '',
                    notes: notesVal,
                    cvFileName: window._tempCVFile ? window._tempCVFile.name : ''
                };
                if (editingCandidatIndex !== null) {
                    candidatsData[editingCandidatIndex] = localCand;
                } else {
                    candidatsData.unshift(localCand);
                }
                editingCandidatIndex = null;
                closeModal('addCandidatModal');
                resetCVUpload();
                await syncAllEmployees();
                updateBadges();
                if (currentPage === 'recrutement') await loadAndRenderRecrutement();
                else renderPage(currentPage);
                showToast(`✅ ${p} ${n} enregistré`, 'success');
            }
        }

        async function _updateCandidateStatus(index, statusApi, toastMsg, toastType = 'success') {
            const c = candidatsData[index];
            if (!c?._apiId) {
                showToast('⚠️ Candidat non synchronisé avec l\'API', 'error');
                return false;
            }
            const formData = new FormData();
            formData.append('status', statusApi);
            try {
                await HRAPI.updateCandidate(c._apiId, formData);
                showToast(toastMsg, toastType);
                await loadAndRenderRecrutement();
                return true;
            } catch (err) {
                console.error('[RH] Mise à jour candidat échouée:', err);
                showToast('❌ Mise à jour impossible', 'error');
                return false;
            }
        }

        function programmerEntretien(i) {
            const c = candidatsData[i];
            if (!c) return;
            document.getElementById('entretienTitle').innerHTML = `<i class="fas fa-calendar-check"></i> Programmer Entretien`;
            document.getElementById('entretienCandidatIndex').value = i;
            document.getElementById('entretienCandidatNom').value = `${c.prenom} ${c.nom} - ${c.poste}`;
            document.getElementById('entretienDate').value = '';
            document.getElementById('entretienHeure').value = '10:00';
            const admin = JSON.parse(localStorage.getItem('authUser') || '{}');
            document.getElementById('entretienInterviewer').innerHTML = `<option selected>${admin.first_name || ''} ${admin.last_name || admin.email || 'Administrateur connecté'}</option>`;
            document.getElementById('entretienInterviewer').disabled = true;
            openModal('entretienModal');
        }

        async function confirmerEntretien() {
            const i = parseInt(document.getElementById('entretienCandidatIndex').value);
            const date = document.getElementById('entretienDate').value;
            const heure = document.getElementById('entretienHeure').value;
            const notes = document.getElementById('entretienNotes')?.value || '';
            if (!date) { showToast('⚠️ Sélectionnez une date', 'error'); return; }
            const c = candidatsData[i];
            if (!c?._apiId) { showToast('⚠️ Candidat non synchronisé', 'error'); return; }
            try {
                await HRAPI.scheduleInterview(c._apiId, { interview_date: date, interview_time: heure, notes });
                closeModal('entretienModal');
                await loadAndRenderRecrutement();
                showToast(`📅 Entretien programmé`, 'success');
            } catch (err) {
                console.error('[RH] confirmerEntretien échoué:', err);
                showToast('❌ Programmation impossible', 'error');
            }
        }

        async function accepterCandidat(i) {
            const candidate = candidatsData[i];
            if (!candidate) return;
            if (confirm(`✅ Confirmer ${candidate.prenom} ${candidate.nom} comme employé ?`)) {
                try {
                    if (candidate._apiId) {
                        await HRAPI.hireCandidate(candidate._apiId);
                    }
                    candidate.statut = 'Accepté';
                    await Promise.all([syncAllEmployees(), loadAndRenderRecrutement()]);
                    updateBadges();
                    showToast(`✅ ${candidate.prenom} ${candidate.nom} est maintenant employé`, 'success');
                } catch (err) {
                    showToast('❌ Embauche impossible : ' + (err.detail ? JSON.stringify(err.detail) : err.message), 'error');
                }
            }
        }

        async function refuserCandidat(i) {
            const candidate = candidatsData[i];
            if (!candidate) return;
            if (confirm(`❌ Refuser ${candidate.prenom} ${candidate.nom} ?`)) {
                try {
                    if (candidate._apiId) {
                        await HRAPI.rejectCandidate(candidate._apiId);
                    }
                    candidate.statut = 'Refusé';
                    await Promise.all([syncAllEmployees(), loadAndRenderRecrutement()]);
                    updateBadges();
                    showToast('❌ Candidat refusé', 'success');
                } catch (err) {
                    showToast('❌ Rejet impossible : ' + (err.detail ? JSON.stringify(err.detail) : err.message), 'error');
                }
            }
        }

        /** Charge les documents depuis l'API puis rend l'onglet */
        async function loadAndRenderDocuments() {
            showTabSpinner();
            try {
                const raw = await HRAPI.documents();
                documentsFromAPI = raw.map(d => ({
                    _apiId: d.id,
                    nom: d.filename || `doc_${d.id}`,
                    employe: d.employee_name || d.teacher_name || 'Inconnu',
                    type: _mapDocType(d.document_type),
                    date: d.created_at ? new Date(d.created_at).toLocaleDateString('fr-FR') : '—',
                    taille: '—',
                    fileUrl: d.file || null
                }));
                documentsData = documentsFromAPI;
                _apiReady = true;
            } catch (e) {
                console.warn('[RH] Impossible de charger les documents:', e);
                documentsData = [];
                _apiReady = false;
                _apiErrorMessage = 'Les documents ne sont pas disponibles : connexion à la base impossible.';
            }
            document.getElementById('mainContent').innerHTML = renderDocuments();
        }

        function _mapDocType(t) {
            if (!t) return 'Autre';
            if (t === 'cv') return 'CV';
            if (t === 'diploma') return 'Diplôme';
            if (t === 'id_card') return 'Pièce identité';
            if (t === 'certification') return 'Certificat';
            return t.charAt(0).toUpperCase() + t.slice(1);
        }

        function renderDocuments() {
            const source = _apiReady
                ? `<span style="font-size:.75rem;color:var(--success);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> API</span>`
                : `<span style="font-size:.75rem;color:var(--danger);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> Indisponible</span>`;
            let rows = documentsData.map((d, idx) => `<tr>
                <td><div style="display:flex;align-items:center;gap:10px"><i class="fas ${getDocIcon(d.nom)}" style="color:${getDocColor(d.nom)};font-size:1.2rem"></i><div><div class="emp-name">${d.nom}</div><div class="emp-detail">${d.type} · ${d.taille}</div></div></div></td>
                <td>${d.employe}</td><td><span class="pill ${getDocTypeClass(d.type)}">${d.type}</span></td><td>${d.date}</td><td>${d.taille}</td>
                <td><div class="btn-group">
                    <button class="btn btn-sm btn-outline btn-icon" title="Voir" onclick="voirDoc('${d.nom}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline" onclick="telechargerDocAPI(${idx})"><i class="fas fa-download"></i> Télécharger</button>
                    <button class="btn btn-sm btn-danger btn-icon" title="Supprimer" onclick="supprimerDocAPI(${idx})"><i class="fas fa-trash"></i></button>
                </div></td></tr>`).join('');
            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Documents</span><h2>${documentsData.length}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-folder-open"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>CV Candidats</span><h2>${documentsData.filter(d=>d.employe&&d.employe.includes('(Candidat)')).length}</h2></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-user-tie"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Docs Employés</span><h2>${documentsData.filter(d=>!d.employe?.includes('(Candidat)')).length}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-building"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-folder-open"></i> Documents ${source}</h2><button class="btn btn-sm btn-primary" onclick="openModal('uploadDocModal')"><i class="fas fa-upload"></i> Téléverser</button></div>
            <div class="table-wrap"><table><thead><tr><th><i class="fas fa-file"></i> Document</th><th><i class="fas fa-user"></i> Propriétaire</th><th><i class="fas fa-tag"></i> Type</th><th><i class="fas fa-calendar"></i> Date</th><th><i class="fas fa-weight-hanging"></i> Taille</th><th><i class="fas fa-cog"></i> Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="6" style="text-align:center;color:var(--muted)">${_apiErrorMessage || 'Aucun document trouvé'}</td></tr>`}</tbody></table></div></div>`;
        }

        function telechargerDocAPI(idx) {
            const d = documentsData[idx];
            if (!d) return;
            if (d.fileUrl) {
                const a = document.createElement('a');
                a.href = d.fileUrl.startsWith('http') ? d.fileUrl : API_CONFIG.BASE_URL.replace('/api/v1','') + d.fileUrl;
                a.download = d.nom;
                a.target = '_blank';
                a.click();
                showToast(`📥 Téléchargement de "${d.nom}" en cours...`, 'info');
            } else {
                telechargerDoc(d.nom);
            }
        }

        async function supprimerDocAPI(idx) {
            const d = documentsData[idx];
            if (!d) return;
            if (!confirm(`⚠️ Supprimer définitivement "${d.nom}" ?`)) return;
            if (d._apiId) {
                try {
                    await HRAPI.deleteDocument(d._apiId);
                    documentsData.splice(idx, 1);
                    document.getElementById('mainContent').innerHTML = renderDocuments();
                    showToast(`🗑️ ${d.nom} supprimé de la base`, 'error');
                    return;
                } catch (err) {
                    console.warn('[RH] deleteDocument échoué:', err);
                    showToast('❌ Erreur suppression document', 'error');
                    return;
                }
            }
            documentsData.splice(idx, 1);
            document.getElementById('mainContent').innerHTML = renderDocuments();
            showToast(`🗑️ ${d.nom} supprimé`, 'error');
        }

        /** Charge les évaluations depuis l'API puis rend l'onglet */
        async function loadAndRenderEvaluations() {
            showTabSpinner();
            try {
                const raw = await HRAPI.evaluations();
                // Normaliser vers la forme locale (perf/punct/disc/comm/score)
                evaluationsData = raw.map(ev => {
                    const scores = ev.criteria_scores || {};
                    // L'API conserve une note globale normalisée sur 5,
                    // tandis que l'écran affiche des pourcentages.
                    const perf = scores.performance ?? (Number(ev.rating || 0) * 20);
                    const punct = scores.ponctualite ?? scores.punctuality ?? perf;
                    const disc = scores.discipline ?? perf;
                    const comm = scores.communication ?? perf;
                    const score = Math.round((perf + punct + disc + comm) / 4);
                    return {
                        _apiId: ev.id,
                        employe: ev.employee_name || ev.teacher_name || 'Inconnu',
                        perf, punct, disc, comm, score,
                        date: ev.evaluation_date ? new Date(ev.evaluation_date).toLocaleDateString('fr-FR') : '—',
                        commentaire: ev.strengths || ev.areas_for_improvement || '',
                        _raw: ev
                    };
                });
                _apiReady = true;
            } catch (e) {
                console.warn('[RH] Impossible de charger les évaluations:', e);
                evaluationsData = [];
                _apiReady = false;
                _apiErrorMessage = 'Les évaluations ne sont pas disponibles : connexion à la base impossible.';
            }
            document.getElementById('mainContent').innerHTML = renderEvaluations();
        }

        function renderEvaluations() {
            const source = _apiReady
                ? `<span style="font-size:.75rem;color:var(--success);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> API</span>`
                : `<span style="font-size:.75rem;color:var(--danger);margin-left:8px"><i class="fas fa-circle" style="font-size:.5rem"></i> Indisponible</span>`;
            let rows = evaluationsData.map((ev, i) => `<tr><td class="emp-name">${ev.employe}</td><td>${ev.date}</td>
                <td><div>${ev.perf}%<div class="perf-bar"><div class="perf-fill" style="width:${ev.perf}%"></div></div></div></td>
                <td><div>${ev.punct}%<div class="perf-bar"><div class="perf-fill" style="width:${ev.punct}%"></div></div></div></td>
                <td><div>${ev.disc}%<div class="perf-bar"><div class="perf-fill" style="width:${ev.disc}%"></div></div></div></td>
                <td><div>${ev.comm}%<div class="perf-bar"><div class="perf-fill" style="width:${ev.comm}%"></div></div></div></td>
                <td><span class="pill ${ev.score>=90?'pill-success':ev.score>=75?'pill-info':'pill-warning'}">${ev.score}%</span></td>
                <td><div class="btn-group">
                    <button class="btn btn-sm btn-outline btn-icon" title="Modifier" onclick="editEvaluation(${i})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger btn-icon" title="Supprimer" onclick="deleteEvaluation(${i})"><i class="fas fa-trash"></i></button>
                </div></td></tr>`).join('');
            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Évaluations</span><h2>${evaluationsData.length}</h2></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-star"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Score moyen</span><h2>${evaluationsData.length?Math.round(evaluationsData.reduce((s,e)=>s+e.score,0)/evaluationsData.length):0}%</h2></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-chart-bar"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Meilleur</span><h2>${evaluationsData.length?Math.max(...evaluationsData.map(e=>e.score)):0}%</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-trophy"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-star"></i> Évaluations ${source}</h2><button class="btn btn-primary btn-sm" onclick="openEvalModal()"><i class="fas fa-plus"></i> Nouvelle</button></div>
            <div class="table-wrap"><table><thead><tr><th>Employé</th><th>Date</th><th>Perf</th><th>Punct</th><th>Disc</th><th>Comm</th><th>Score</th><th>Actions</th></tr></thead><tbody>${rows || `<tr><td colspan="8" style="text-align:center;color:var(--muted)">${_apiErrorMessage || 'Aucune évaluation trouvée'}</td></tr>`}</tbody></table></div></div>`;
        }

        function openEvalModal() {
            editingEvalIndex = null;
            document.getElementById('evalEmp').innerHTML = employees.filter(e => e._hrEmployeeId).map(e => `<option>${e.prenom} ${e.nom}</option>`).join('');
            document.getElementById('evalEmp').disabled = false;
            document.getElementById('evalPerf').value = '';
            document.getElementById('evalPunct').value = '';
            document.getElementById('evalDisc').value = '';
            document.getElementById('evalComm').value = '';
            document.getElementById('evalComments').value = '';
            openModal('addEvalModal');
        }

        function editEvaluation(i) {
            const ev = evaluationsData[i];
            if (!ev) return;
            editingEvalIndex = i;
            document.getElementById('evalEmp').innerHTML = employees.filter(e => e._hrEmployeeId).map(e => `<option ${(e.prenom+' '+e.nom)===ev.employe?'selected':''}>${e.prenom} ${e.nom}</option>`).join('');
            document.getElementById('evalPerf').value = ev.perf;
            document.getElementById('evalPunct').value = ev.punct;
            document.getElementById('evalDisc').value = ev.disc;
            document.getElementById('evalComm').value = ev.comm;
            document.getElementById('evalComments').value = ev.commentaire || '';
            openModal('addEvalModal');
        }

        function deleteEvaluation(i) {
            const ev = evaluationsData[i];
            if (!ev) return;
            if (confirm(`⚠️ Supprimer l'évaluation de ${ev.employe} ?`)) {
                if (!ev._apiId) { showToast('❌ Évaluation non synchronisée : suppression refusée', 'error'); return; }
                HRAPI.deleteEvaluation(ev._apiId)
                    .then(() => loadAndRenderEvaluations())
                    .then(() => showToast(`🗑️ Évaluation de ${ev.employe} supprimée`, 'success'))
                    .catch(err => showToast('❌ Suppression impossible : ' + (err.detail ? JSON.stringify(err.detail) : err.message), 'error'));
            }
        }

        async function saveEvaluation() {
            const emp = document.getElementById('evalEmp').value;
            const perf = parseInt(document.getElementById('evalPerf').value) || 0;
            const punct = parseInt(document.getElementById('evalPunct').value) || 0;
            const disc = parseInt(document.getElementById('evalDisc').value) || 0;
            const comm = parseInt(document.getElementById('evalComm').value) || 0;
            const score = Math.round((perf + punct + disc + comm) / 4);
            const commentaire = document.getElementById('evalComments').value;

            const employeeId = resolveHrEmployeeId(emp);

            const existing = editingEvalIndex !== null ? evaluationsData[editingEvalIndex] : null;

            if (employeeId) {
                try {
                    const body = {
                        employee: employeeId,
                        evaluation_date: new Date().toISOString().slice(0, 10),
                        rating: Math.max(1, Math.min(5, score / 20)),
                        criteria_scores: { performance: perf, ponctualite: punct, discipline: disc, communication: comm },
                        strengths: commentaire,
                        evaluation_type: 'ad_hoc'
                    };
                    if (existing?._apiId) {
                        await HRAPI.updateEvaluation(existing._apiId, body);
                        showToast(`✅ Évaluation de ${emp} modifiée — Score: ${score}%`, 'success');
                    } else {
                        await HRAPI.createEvaluation(body);
                        showToast(`✅ ${emp} — Score: ${score}% — Sauvegardé`, 'success');
                    }
                    editingEvalIndex = null;
                    closeModal('addEvalModal');
                    await loadAndRenderEvaluations();
                    return;
                } catch (err) {
                    console.error('[RH] saveEvaluation API échoué:', err);
                    showToast('❌ Évaluation non enregistrée : ' + (err.detail ? JSON.stringify(err.detail) : err.message), 'error');
                    return;
                }
            }
            showToast('❌ Employé non synchronisé avec la base RH', 'error');
        }

        // ==================== EKSPÒTASYON ====================
        function exportEmployesCSV() {
            let csv = 'Matricule,Nom,Prénom,Fonction,Département,Statut,Salaire\n';
            employees.forEach(e => csv += `${e.id},${e.nom},${e.prenom},${e.fonction},${e.dept},${e.statut},${e.salaire||0}\n`);
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'employes_cejec.csv';
            a.click();
            showToast('📁 CSV exporté', 'success');
        }

        function exportEmployesPDF() {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();

                // En-tête
                doc.setFillColor(10, 77, 140);
                doc.rect(0, 0, pageWidth, 22, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('CEJEC', 14, 14);
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.text("Centre d'Études des Jeunes en Entrepreneuriat et Commerce", 14, 19);
                doc.setFontSize(10);
                doc.text(`Liste des Employés — ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - 14, 14, { align: 'right' });
                doc.setFontSize(8);
                doc.text(`${employees.length} employé(s)`, pageWidth - 14, 19, { align: 'right' });

                const body = employees.map(e => [
                    e.id,
                    `${e.prenom} ${e.nom}`,
                    e.sexe,
                    e.tel,
                    e.email,
                    e.fonction,
                    e.dept,
                    e.embauche,
                    e.statut
                ]);

                doc.autoTable({
                    head: [['Matricule', 'Nom Complet', 'Sexe', 'Téléphone', 'Email', 'Fonction', 'Département', 'Embauche', 'Statut']],
                    body: body,
                    startY: 28,
                    theme: 'grid',
                    styles: { lineColor: [220, 226, 235], lineWidth: 0.1 },
                    headStyles: { fillColor: [10, 77, 140], textColor: 255, fontStyle: 'bold', fontSize: 9, halign: 'left' },
                    bodyStyles: { fontSize: 8.5, textColor: [26, 31, 43] },
                    alternateRowStyles: { fillColor: [240, 244, 248] },
                    columnStyles: {
                        0: { cellWidth: 26 },
                        1: { cellWidth: 38 },
                        2: { cellWidth: 16 },
                        3: { cellWidth: 28 },
                        4: { cellWidth: 48 },
                        5: { cellWidth: 28 },
                        6: { cellWidth: 30 },
                        7: { cellWidth: 22 },
                        8: { cellWidth: 18 }
                    },
                    margin: { left: 14, right: 14 },
                    didDrawPage: function() {
                        const pageCount = doc.internal.getNumberOfPages();
                        doc.setFontSize(8);
                        doc.setTextColor(139, 149, 165);
                        doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber} / ${pageCount}`, pageWidth - 14, pageHeight - 8, { align: 'right' });
                        doc.text('Généré par le Module RH CEJEC', 14, pageHeight - 8);
                    }
                });

                doc.save('employes_cejec.pdf');
                showToast('📄 PDF exporté', 'success');
            } catch (e) {
                console.error('Erè PDF:', e);
                showToast('❌ Erreur export PDF', 'error');
            }
        }

        function exportProfilPDF() {
            try {
                if (selectedProfilIndex === null) { showToast('⚠️ Aucun profil sélectionné', 'error'); return; }
                const e = employees[selectedProfilIndex];
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();

                doc.setFillColor(10, 77, 140);
                doc.rect(0, 0, pageWidth, 30, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('CEJEC', 14, 15);
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.text("Centre d'Études des Jeunes en Entrepreneuriat et Commerce", 14, 22);
                doc.setFontSize(12);
                doc.text('Fiche Profil Employé', pageWidth - 14, 18, { align: 'right' });

                doc.setTextColor(26, 31, 43);
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text(`${e.prenom} ${e.nom}`, 14, 42);
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(139, 149, 165);
                doc.text(`${e.fonction} · ${e.dept}`, 14, 49);

                doc.setDrawColor(220, 226, 235);
                doc.line(14, 54, pageWidth - 14, 54);

                const infos = [
                    ['Matricule', e.id],
                    ['Sexe', e.sexe],
                    ['Téléphone', e.tel],
                    ['Email', e.email],
                    ['Adresse', e.adresse || 'N/A'],
                    ["Date d'embauche", e.embauche],
                    ['Statut', e.statut],
                    ['Salaire de base', `${(e.salaire||0).toLocaleString()} HTG`],
                    ['Prime', `${(e.prime||0).toLocaleString()} HTG`]
                ];

                doc.autoTable({
                    body: infos,
                    startY: 60,
                    theme: 'plain',
                    styles: { fontSize: 10, cellPadding: 3 },
                    columnStyles: {
                        0: { fontStyle: 'bold', textColor: [139, 149, 165], cellWidth: 50 },
                        1: { textColor: [26, 31, 43] }
                    }
                });

                if (e.diplomes && e.diplomes.length) {
                    let y = doc.lastAutoTable.finalY + 10;
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(10, 77, 140);
                    doc.text('Diplômes', 14, y);
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(9);
                    doc.setTextColor(26, 31, 43);
                    e.diplomes.forEach((d, idx) => doc.text(`• ${d}`, 18, y + 7 + idx * 6));
                }

                if (e.cours && e.cours.length) {
                    let y = doc.lastAutoTable.finalY + 10 + (e.diplomes?.length ? e.diplomes.length * 6 + 12 : 0);
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(10, 77, 140);
                    doc.text('Cours Assignés', 14, y);
                    doc.setFont(undefined, 'normal');
                    doc.setFontSize(9);
                    doc.setTextColor(26, 31, 43);
                    e.cours.forEach((c, idx) => doc.text(`• ${c}`, 18, y + 7 + idx * 6));
                }

                doc.setFontSize(8);
                doc.setTextColor(139, 149, 165);
                doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — Module RH CEJEC`, 14, doc.internal.pageSize.getHeight() - 10);

                doc.save(`profil_${e.id}.pdf`);
                showToast('📄 PDF exporté', 'success');
            } catch (e) {
                console.error('Erè export profil PDF:', e);
                showToast('❌ Erreur export PDF', 'error');
            }
        }

        function exportFichePDF() {
            try {
                if (!selectedFicheEmp) { showToast('⚠️ Aucune fiche sélectionnée', 'error'); return; }
                const e = selectedFicheEmp;
                const base = e.salaire || 50000, prime = e.prime || 5000;
                const taks = Math.round(base * 0.15), ofatma = Math.round(base * 0.06), net = base + prime - taks - ofatma;

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();

                doc.setFillColor(10, 77, 140);
                doc.rect(0, 0, pageWidth, 32, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(20);
                doc.setFont(undefined, 'bold');
                doc.text('CEJEC', 14, 16);
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.text("Centre d'Études des Jeunes en Entrepreneuriat et Commerce", 14, 23);
                doc.setFontSize(11);
                doc.text(`Fiche de Paie — ${new Date().toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}`, pageWidth - 14, 19, { align: 'right' });

                doc.setTextColor(26, 31, 43);
                doc.setFontSize(11);
                doc.setFont(undefined, 'bold');
                doc.text('Employé', 14, 45);
                doc.text('Matricule', pageWidth / 2 + 5, 45);
                doc.setFont(undefined, 'normal');
                doc.setFontSize(10);
                doc.text(`${e.prenom} ${e.nom}`, 14, 52);
                doc.text(e.id, pageWidth / 2 + 5, 52);

                doc.autoTable({
                    head: [['Élément', 'Montant']],
                    body: [
                        ['Salaire Base', `${base.toLocaleString()}.00 HTG`],
                        ['Primes', `+${prime.toLocaleString()}.00 HTG`],
                        ['Taks (15%)', `-${taks.toLocaleString()}.00 HTG`],
                        ['OFATMA (6%)', `-${ofatma.toLocaleString()}.00 HTG`]
                    ],
                    startY: 60,
                    theme: 'grid',
                    headStyles: { fillColor: [10, 77, 140], textColor: 255 },
                    styles: { fontSize: 10, cellPadding: 4 },
                    columnStyles: { 1: { halign: 'right' } }
                });

                const finalY = doc.lastAutoTable.finalY + 8;
                doc.setFillColor(10, 77, 140);
                doc.rect(14, finalY, pageWidth - 28, 16, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('Net à Payer', 20, finalY + 10);
                doc.setFontSize(14);
                doc.text(`${net.toLocaleString()}.00 HTG`, pageWidth - 20, finalY + 10, { align: 'right' });

                doc.setTextColor(139, 149, 165);
                doc.setFontSize(8);
                doc.setFont(undefined, 'normal');
                doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — Module RH CEJEC`, 14, doc.internal.pageSize.getHeight() - 10);

                doc.save(`fiche_paie_${e.id}.pdf`);
                showToast('📄 PDF exporté', 'success');
            } catch (e) {
                console.error('Erè export fiche PDF:', e);
                showToast('❌ Erreur export PDF', 'error');
            }
        }
        function exportPresencesCSV() {
            const today = getTodayDateString();
            const employesAujourdhui = employees.filter(e => e.statut !== 'Suspendu' && e.statut !== 'Terminé');
            let csv = 'Employé,Fonction,Département,Date,Entrée,Sortie,Statut,Présence\n';
            employesAujourdhui.forEach(e => {
                const nomComplet = `${e.prenom} ${e.nom}`.trim();
                const p = presencesData.find(att => att.date === today && (
                    (e._hrEmployeeId && att._employeeId === e._hrEmployeeId) ||
                    (att.employe && att.employe.trim().toLowerCase() === nomComplet.toLowerCase())
                ));
                const entree = p ? p.entree : '—';
                const sortie = p ? p.sortie : '—';
                const statut = p ? p.statut : 'À pointer';
                const presence = p ? (p.statut === 'Absent' ? 'Absent' : 'Présent') : 'Non pointé';
                csv += `"${nomComplet}","${e.fonction || 'Employé'}","${e.dept || 'Administration'}","${today}","${entree}","${sortie}","${statut}","${presence}"\n`;
            });
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `presences_${today}.csv`;
            a.click();
            showToast('📁 CSV Présences du jour exporté', 'success');
        }

        // ==================== MODAL AK INISYALIZASYON ====================
        function openModal(id) {
            document.getElementById(id).classList.add('open');
            if (id === 'addEmpModal' && editingId === null) {
                document.getElementById('modalEmpTitle').innerHTML = '<i class="fas fa-user-plus"></i> Nouvel Employé';
                document.querySelectorAll('#addEmpModal input, #addEmpModal select').forEach(el => {
                    if (el.type !== 'hidden' && el.id !== 'empStatut' && el.id !== 'empSalaire' && el.id !== 'empPrime') el.value = '';
                });
                document.getElementById('editEmpId').value = '';
                document.getElementById('empStatut').value = 'Actif';
                document.getElementById('empSalaire').value = '50000';
                document.getElementById('empPrime').value = '5000';
            }
            if (id === 'addCandidatModal' && editingCandidatIndex === null) {
                document.getElementById('modalCandidatTitle').innerHTML = '<i class="fas fa-briefcase"></i> Nouveau Candidat';
                document.getElementById('editCandidatIndex').value = '';
                ['candPrenom','candNom','candTel','candEmail','candDate','candNotes'].forEach(f => document.getElementById(f).value = '');
                resetCVUpload();
            }
            if (id === 'uploadDocModal') {
                document.getElementById('docEmp').innerHTML = employees.filter(e => e._hrEmployeeId).map(e => `<option>${e.prenom} ${e.nom}</option>`).join('');
                const zone = document.getElementById('docUploadZone');
                const nameDisplay = document.getElementById('docFileNameDisplay');
                const input = document.getElementById('docFileInput');
                if (zone) zone.classList.remove('has-file');
                if (nameDisplay) nameDisplay.style.display = 'none';
                if (input) input.value = '';
                window._tempDocFile = null;
            }
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('open');
            if (id === 'addCoursModal') selectedCoursProfId = null;
            if (id === 'addCandidatModal') editingCandidatIndex = null;
            if (id === 'addEvalModal') editingEvalIndex = null;
            if (id === 'viewDocModal' && window._currentPreviewUrl) {
                URL.revokeObjectURL(window._currentPreviewUrl);
                window._currentPreviewUrl = null;
            }
            editingId = null;
        }

        document.querySelectorAll('.modal-overlay').forEach(m => m.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('open'); }));
        document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open')); });

        async function refreshAll() {
            showToast('🔄 Actualisation en cours...', 'info');
            // Recharger toutes les données API
            try { leaveTypesFromAPI = await HRAPI.leaveTypes(); } catch(e) {}
            await syncAllEmployees();
            renderPage(currentPage);
            updateBadges();
            showToast('🔄 Données actualisées', 'success');
        }

        // ==================== DEMARAJ APLIKASYON ====================
        async function syncAllEmployees() {
            let apiProfs = [];
            let apiStaff = [];
            
            try {
                teachersFromAPI = await HRAPI.teachers();
            } catch (e) {
                console.warn('[RH] Impossible de charger les professeurs:', e.message);
                teachersFromAPI = [];
            }

            try {
                const staff = await HRAPI.employees();
                apiStaff = staff.map(mapEmployeeFromAPI);
            } catch (e) {
                console.warn('[RH] Personnel administratif non disponible:', e.message);
            }

            try {
                const rawCand = await HRAPI.candidates();
                candidatsData = rawCand.map(mapCandidateFromAPI);
            } catch (e) {
                console.warn('[RH] Impossible de charger les candidats:', e.message);
            }

            const staffByEmail = {};
            apiStaff.forEach(s => {
                if (s.email && s.email !== 'N/A') staffByEmail[s.email.toLowerCase()] = s;
            });

            if (teachersFromAPI.length > 0) {
                apiProfs = teachersFromAPI.map(t => {
                    const usr = t.user || {};
                    const specialty = t.primary_specialty ? [t.primary_specialty.subject] : [];
                    const hrMatch = staffByEmail[(usr.email || '').toLowerCase()]
                        || apiStaff.find(s => s.fonction === 'Professeur' && s.id === t.teacher_id);
                    const hrEmployeeId = hrMatch?._hrEmployeeId || null;
                    return {
                        _apiId: t.id,
                        _userId: usr.id,
                        _hrEmployeeId: hrEmployeeId,
                        id: hrMatch?.id || `PROF-${t.id}`,
                        prenom: usr.first_name || 'Inconnu',
                        nom: usr.last_name || '',
                        sexe: usr.profile?.gender === 'M' ? 'Homme' : (usr.profile?.gender === 'F' ? 'Femme' : 'N/A'),
                        tel: usr.phone || 'N/A',
                        email: usr.email || 'N/A',
                        fonction: 'Professeur',
                        dept: 'Professeurs',
                        embauche: t.hire_date || 'N/A',
                        statut: t.is_active !== false ? 'Actif' : 'Suspendu',
                        salaire: parseFloat(t.base_salary || t.monthly_salary) || 0,
                        prime: 0,
                        cours: specialty,
                        diplomes: [t.qualification || '']
                    };
                });
            }

            const profHrIds = new Set(apiProfs.map(p => p._hrEmployeeId).filter(Boolean));
            const staffOnly = apiStaff.filter(s => s.fonction !== 'Professeur' && !profHrIds.has(s._hrEmployeeId));

            // S'assurer que tous les collaborateurs enregistrés via le Recrutement apparaissent aussi
            const knownEmails = new Set(
                [...staffOnly, ...apiProfs].map(e => (e.email || '').toLowerCase()).filter(em => em && em !== 'n/a')
            );
            const knownNames = new Set(
                [...staffOnly, ...apiProfs].map(e => `${(e.prenom || '').trim().toLowerCase()} ${(e.nom || '').trim().toLowerCase()}`)
            );

            const recruitedEmployees = (candidatsData || [])
                .filter(c => {
                    const email = (c.email || '').toLowerCase();
                    const name = `${(c.prenom || '').trim().toLowerCase()} ${(c.nom || '').trim().toLowerCase()}`;
                    if (email && email !== 'n/a' && knownEmails.has(email)) return false;
                    if (knownNames.has(name)) return false;
                    return true;
                })
                .map((c, idx) => ({
                    _hrEmployeeId: c._hrEmployeeId || null,
                    _candidateId: c._apiId || null,
                    _source: 'Recrutement',
                    id: `REC-${c._apiId || (idx + 1)}`,
                    prenom: c.prenom,
                    nom: c.nom,
                    sexe: 'N/A',
                    tel: c.tel || 'N/A',
                    email: c.email || 'N/A',
                    fonction: c.poste || 'Employé',
                    dept: _resolveDeptFromPoste(c.poste),
                    embauche: c.dateCandidature ? c.dateCandidature.split('/').reverse().join('-') : getTodayDateString(),
                    statut: c.statut === 'Refusé' ? 'Suspendu' : 'Actif',
                    adresse: '',
                    salaire: 0,
                    prime: 0,
                    cours: (c.poste || '').toLowerCase().includes('prof') ? [c.poste] : [],
                    diplomes: []
                }));

            // Si aucune donnée API disponible, conserver les collaborateurs locaux
            if (staffOnly.length === 0 && apiProfs.length === 0 && localEmployees && localEmployees.length > 0) {
                employees = [...localEmployees, ...recruitedEmployees];
            } else {
                employees = [...staffOnly, ...apiProfs, ...recruitedEmployees];
            }
            localStorage.setItem('cejec_employees_rh', JSON.stringify(employees));
        }

        function mapEmployeeFromAPI(employee) {
            const statuses = { active: 'Actif', suspended: 'Suspendu', inactive: 'Congé', terminated: 'Terminé' };
            return {
                _hrEmployeeId: employee.id,
                id: employee.employee_number,
                prenom: employee.first_name,
                nom: employee.last_name,
                sexe: employee.gender || 'N/A',
                tel: employee.phone || 'N/A',
                email: employee.email || 'N/A',
                fonction: employee.job_title,
                dept: employee.department,
                embauche: employee.hire_date,
                statut: statuses[employee.status] || employee.status,
                adresse: employee.address || '',
                salaire: parseFloat(employee.monthly_salary) || 0,
                prime: parseFloat(employee.monthly_bonus) || 0,
                cours: [], diplomes: []
            };
        }

        async function deleteEmp(i) {
            const employee = employees[i];
            if (!employee || !confirm(`⚠️ Supprimer ${employee.prenom} ${employee.nom} ?`)) return;
            try {
                // Only delete HR employee records; user accounts are managed elsewhere
                if (employee._hrEmployeeId) {
                    await HRAPI.deleteEmployee(employee._hrEmployeeId);
                } else {
                    console.warn('[RH] Delete operation skipped for non‑HR employee', employee);
                }
                // Skipping AuthAPI.deleteUser; user accounts are managed elsewhere
                

                await syncAllEmployees();
                renderPage('employes'); updateBadges();
                showToast(`🗑️ ${employee.prenom} ${employee.nom} supprimé`, 'success');
            } catch (err) {
                console.error('[RH] deleteEmployee échoué:', err);
                showToast('❌ Suppression impossible', 'error');
            }
        }

        async function saveEmployee() {
            const prenom = document.getElementById('empPrenom').value.trim();
            const nom = document.getElementById('empNom').value.trim();
            if (!prenom || !nom) { showToast('⚠️ Prénom et nom obligatoires', 'error'); return; }
            
            const current = editingId !== null ? employees[editingId] : null;
            const isProfesseur = document.getElementById('empFonction').value === 'Professeur';
            const statuses = { Actif: 'active', Suspendu: 'suspended', 'Congé': 'inactive', Terminé: 'terminated' };

            try {


                    const body = {
                        employee_number: current?.id || `${matriculePrefix}${Date.now().toString().slice(-6)}`,
                        first_name: prenom, last_name: nom,
                        gender: document.getElementById('empSexe').value,
                        phone: document.getElementById('empTel').value,
                        email: document.getElementById('empEmail').value,
                        job_title: document.getElementById('empFonction').value,
                        department: document.getElementById('empDept').value,
                        hire_date: document.getElementById('empEmbauche').value || new Date().toISOString().slice(0, 10),
                        status: statuses[document.getElementById('empStatut').value] || 'active',
                        address: document.getElementById('empAdresse').value,
                        monthly_salary: Number(document.getElementById('empSalaire').value) || 0,
                        monthly_bonus: Number(document.getElementById('empPrime').value) || 0,
                    };
                    if (current?._hrEmployeeId) await HRAPI.updateEmployee(current._hrEmployeeId, body);
                    else await HRAPI.createEmployee(body);
                
                
                await syncAllEmployees();
                closeModal('addEmpModal'); editingId = null;
                renderPage('employes'); updateBadges();
                showToast(`✅ ${prenom} ${nom} enregistré`, 'success');
            } catch (err) {
                console.error('[RH] saveEmployee échoué:', err);
                showToast('❌ Enregistrement impossible. Vérifiez la connexion et vos droits.', 'error');
            }
        }
        async function initRH() {
            console.log('[RH] Démarrage du module RH CEJEC...');
            
            // Chargement silencieux des données API en arrière-plan
            try {
                leaveTypesFromAPI = await HRAPI.leaveTypes();
                console.log('[RH] Types de congés chargés:', leaveTypesFromAPI.length);
            } catch (e) {
                console.warn('[RH] Types de congés non disponibles:', e.message);
            }
            
            await syncAllEmployees();

            _apiReady = Boolean(teachersFromAPI.length || employees.some(e => e._hrEmployeeId) || leaveTypesFromAPI.length);
            if (!_apiReady) _apiErrorMessage = 'Connexion à la base RH indisponible.';
            console.log('✅ Module RH CEJEC prêt ! API:', _apiReady);
            
            // On rend la page APRES le chargement pour inclure les professeurs de l'API
            renderPage('employes');
            updateBadges();
        }

        initRH();
