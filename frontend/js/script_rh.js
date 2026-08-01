        // ==================== KONFIGIRASYON PDF.JS ====================
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // ==================== DONE ====================
        let employees=[{id:'EMP-2024-001',prenom:'Jean-Marc',nom:'Dubois',sexe:'Homme',tel:'+509 44 55 66 77',email:'jeanmarc@cejec.edu.ht',fonction:'Administrateur',dept:'Direction Générale',embauche:'2020-01-15',statut:'Actif',adresse:'Port-au-Prince',salaire:95000,prime:15000,cours:[],diplomes:['Licence en Gestion','Master en Administration']},{id:'EMP-2024-002',prenom:'Marie',nom:'Louis',sexe:'Femme',tel:'+509 33 22 11 00',email:'marie@cejec.edu.ht',fonction:'Secrétaire',dept:'Administration',embauche:'2021-03-10',statut:'Actif',adresse:'Pétion-Ville',salaire:65000,prime:8000,cours:[],diplomes:['BTS Secrétariat']},{id:'EMP-2024-003',prenom:'Carline',nom:'Étienne',sexe:'Femme',tel:'+509 22 33 44 55',email:'carline@cejec.edu.ht',fonction:'Comptable',dept:'Comptabilité',embauche:'2021-06-01',statut:'Actif',adresse:'Delmas',salaire:70000,prime:10000,cours:[],diplomes:['Licence Comptabilité']},{id:'EMP-2024-004',prenom:'Jacques',nom:'Mentor',sexe:'Homme',tel:'+509 38 00 11 22',email:'jacques@cejec.edu.ht',fonction:'Professeur',dept:'Professeurs',embauche:'2019-09-01',statut:'Actif',adresse:'Cap-Haïtien',salaire:75000,prime:12000,cours:['Entrepreneuriat 101','Marketing Digital'],diplomes:['Master en Entrepreneuriat']},{id:'EMP-2024-005',prenom:'Rose',nom:'Michel',sexe:'Femme',tel:'+509 39 88 77 66',email:'rose@cejec.edu.ht',fonction:'Professeur',dept:'Professeurs',embauche:'2020-09-01',statut:'Actif',adresse:'Port-au-Prince',salaire:72000,prime:10000,cours:['Commerce International','Finance'],diplomes:['MBA Finance']},{id:'EMP-2024-006',prenom:'Jean',nom:'Baptiste',sexe:'Homme',tel:'+509 37 66 55 44',email:'jean.baptiste@cejec.edu.ht',fonction:'Professeur',dept:'Professeurs',embauche:'2021-09-01',statut:'Actif',adresse:'Jacmel',salaire:70000,prime:9000,cours:['Gestion de Projet','Leadership'],diplomes:['Master en Management']},{id:'EMP-2024-007',prenom:'Marc',nom:'Arthur',sexe:'Homme',tel:'+509 40 11 22 33',email:'marc.arthur@cejec.edu.ht',fonction:'Directeur',dept:'Direction Générale',embauche:'2018-01-01',statut:'Actif',adresse:'Port-au-Prince',salaire:120000,prime:25000,cours:[],diplomes:['Doctorat en Éducation']},{id:'EMP-2024-008',prenom:'Sophie',nom:'Laurent',sexe:'Femme',tel:'+509 41 22 33 44',email:'sophie@cejec.edu.ht',fonction:'Coordinatrice',dept:'Coordination Générale',embauche:'2022-01-15',statut:'Actif',adresse:'Port-au-Prince',salaire:80000,prime:12000,cours:[],diplomes:['Master Coordination']},{id:'EMP-2024-009',prenom:'Pierre',nom:'Antoine',sexe:'Homme',tel:'+509 42 33 44 55',email:'pierre@cejec.edu.ht',fonction:'Bibliothécaire',dept:'Bibliothèque',embauche:'2022-06-01',statut:'Actif',adresse:'Port-au-Prince',salaire:55000,prime:5000,cours:[],diplomes:['Licence Bibliothéconomie']},{id:'EMP-2024-010',prenom:'Nathalie',nom:'Pierre',sexe:'Femme',tel:'+509 43 44 55 66',email:'nathalie@cejec.edu.ht',fonction:'Agent Communication',dept:'Communication',embauche:'2023-01-10',statut:'Actif',adresse:'Pétion-Ville',salaire:60000,prime:7000,cours:[],diplomes:['Licence Communication']},{id:'EMP-2024-011',prenom:'André',nom:'Simon',sexe:'Homme',tel:'+509 44 55 66 88',email:'andre@cejec.edu.ht',fonction:'Agent',dept:'Administration',embauche:'2023-06-15',statut:'Suspendu',adresse:'Delmas',salaire:45000,prime:3000,cours:[],diplomes:['BTS Administration']},{id:'EMP-2024-012',prenom:'Isabelle',nom:'Martin',sexe:'Femme',tel:'+509 45 66 77 99',email:'isabelle@cejec.edu.ht',fonction:'Professeur',dept:'Professeurs',embauche:'2023-09-01',statut:'Actif',adresse:'Port-au-Prince',salaire:68000,prime:8000,cours:['Informatique','Statistiques'],diplomes:['Master Informatique']}];
        let congesData=[{id:1,employe:'André Simon',type:'Congé maladie',debut:'10/06/2026',fin:'12/06/2026',jours:3,motif:'Grippe',statut:'En attente'},{id:2,employe:'Marie Louis',type:'Congé annuel',debut:'20/06/2026',fin:'27/06/2026',jours:7,motif:'Vacances',statut:'Approuvé'}];
        let evaluationsData=[{employe:'Jean-Marc Dubois',perf:92,punct:95,disc:100,comm:88,score:93.75,date:'15/01/2026',commentaire:'Excellent leadership'},{employe:'Marie Louis',perf:88,punct:90,disc:95,comm:85,score:89.5,date:'20/02/2026',commentaire:'Très bonne organisation'},{employe:'Jacques Mentor',perf:90,punct:88,disc:92,comm:90,score:90,date:'10/03/2026',commentaire:'Excellent pédagogue'}];
        let candidatsData=[{prenom:'Pierre',nom:'Dubois',tel:'+509 44 11 22 33',email:'pierre@email.com',poste:'Professeur Marketing',cv:'Reçu',statut:'Entretien',dateCandidature:'01/06/2026',dateEntretien:'',heureEntretien:'',interviewer:'',notes:'Bon profil, à suivre',cvFileName:'CV_Pierre_Dubois.pdf'},{prenom:'Mireille',nom:'Dumont',tel:'+509 33 22 11 00',email:'mireille@email.com',poste:'Secrétaire',cv:'Reçu',statut:'En attente',dateCandidature:'05/06/2026',dateEntretien:'',heureEntretien:'',interviewer:'',notes:'',cvFileName:'CV_Mireille_Dumont.pdf'}];
        let documentsData=[{nom:'CV_JeanMarc_Dubois.pdf',employe:'Jean-Marc Dubois',type:'CV',date:'15/01/2020',taille:'245 KB'},{nom:'Contrat_Marie_Louis.pdf',employe:'Marie Louis',type:'Contrat',date:'10/03/2021',taille:'1.2 MB'},{nom:'Diplome_Jacques_Mentor.pdf',employe:'Jacques Mentor',type:'Diplôme',date:'01/09/2019',taille:'890 KB'},{nom:'CIN_Rose_Michel.pdf',employe:'Rose Michel',type:'Pièce identité',date:'01/09/2020',taille:'340 KB'},{nom:'CV_Pierre_Dubois.pdf',employe:'Pierre Dubois (Candidat)',type:'CV',date:'01/06/2026',taille:'180 KB'},{nom:'CV_Mireille_Dumont.pdf',employe:'Mireille Dumont (Candidat)',type:'CV',date:'05/06/2026',taille:'210 KB'}];
        let presencesData=[];
        let editingId=null,currentPage='employes',selectedFicheEmp=null,selectedCoursProfId=null,editingCandidatIndex=null; let editingEvalIndex = null; let selectedProfilIndex = null;
        let pdfDoc=null,pdfCurrentPage=1,pdfTotalPages=0;
        const matriculePrefix='EMP-'+new Date().getFullYear()+'-';

        // ==================== FONKSYON ITILITÈ ====================
        function getProfs(){return employees.filter(e=>e.fonction==='Professeur')}
        function getInitials(e){return(e.prenom[0]+e.nom[0]).toUpperCase()}
        function getAvatarColor(i){const c=['#0A4D8C','#D62828','#10b981','#f59e0b','#8b5cf6','#ec4899','#6366f1','#14b8a6','#e11d48','#0891b2','#7c3aed','#059669'];return c[i%c.length]}
        function getColorFromString(s){let h=0;for(let i=0;i<s.length;i++)h=s.charCodeAt(i)+((h<<5)-h);const c=['#0A4D8C','#D62828','#10b981','#f59e0b','#8b5cf6','#ec4899','#6366f1','#14b8a6'];return c[Math.abs(h)%c.length]}
        function showToast(msg,type='success'){const icons={success:'fa-check-circle',error:'fa-times-circle',info:'fa-info-circle'};const el=document.createElement('div');el.className=`toast toast-${type}`;el.innerHTML=`<i class="fas ${icons[type]}"></i> ${msg}`;document.getElementById('toastContainer').appendChild(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(100px)';el.style.transition='all .3s';setTimeout(()=>el.remove(),300)},3000)}
        function getDocIcon(nom){const ext=nom.split('.').pop().toLowerCase();if(ext==='pdf')return'fa-file-pdf';if(ext==='doc'||ext==='docx')return'fa-file-word';if(ext==='jpg'||ext==='jpeg'||ext==='png')return'fa-file-image';if(ext==='xls'||ext==='xlsx')return'fa-file-excel';return'fa-file-alt'}
        function getDocColor(nom){const ext=nom.split('.').pop().toLowerCase();if(ext==='pdf')return'var(--red)';if(ext==='doc'||ext==='docx')return'#3b82f6';if(ext==='jpg'||ext==='jpeg'||ext==='png')return'var(--purple)';if(ext==='xls'||ext==='xlsx')return'var(--success)';return'var(--muted)'}
        function getDocTypeClass(type){if(type==='CV')return'pill-success';if(type==='Contrat')return'pill-info';if(type==='Diplôme')return'pill-purple';if(type==='Pièce identité')return'pill-warning';return'pill-muted'}

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

        function uploadDocument() {
            const emp = document.getElementById('docEmp').value;
            const type = document.getElementById('docType').value;
            
            if (!emp) {
                showToast('⚠️ Veuillez sélectionner un employé', 'error');
                return;
            }
            
            let fileName = '';
            if (window._tempDocFile) {
                fileName = window._tempDocFile.name;
            } else {
                fileName = `${type}_${emp.replace(' ', '_')}_${Date.now()}.pdf`;
            }
            
            documentsData.push({
                nom: fileName,
                employe: emp,
                type: type,
                date: new Date().toLocaleDateString('fr-FR'),
                taille: window._tempDocFile ? formatFileSize(window._tempDocFile.size) : `${Math.floor(Math.random() * 500) + 50} KB`
            });
            
            // Reset zòn upload
            const zone = document.getElementById('docUploadZone');
            const nameDisplay = document.getElementById('docFileNameDisplay');
            const input = document.getElementById('docFileInput');
            if (zone) zone.classList.remove('has-file');
            if (nameDisplay) nameDisplay.style.display = 'none';
            if (input) input.value = '';
            window._tempDocFile = null;
            
            closeModal('uploadDocModal');
            renderPage('documents');
            showToast('📤 Document téléversé avec succès', 'success');
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

        function renderPage(page) {
            const mc = document.getElementById('mainContent');
            switch (page) {
                case 'employes': mc.innerHTML = renderEmployes(); break;
                case 'professeurs': mc.innerHTML = renderProfesseurs(); break;
                case 'presences': initPresences(); mc.innerHTML = renderPresences(); break;
                case 'conges': mc.innerHTML = renderConges(); break;
                case 'salaires': mc.innerHTML = renderSalaires(); break;
                case 'fichepaie': mc.innerHTML = renderFichePaie(); break;
                case 'recrutement': mc.innerHTML = renderRecrutement(); break;
                case 'documents': mc.innerHTML = renderDocuments(); break;
                case 'evaluations': mc.innerHTML = renderEvaluations(); break;
                default: mc.innerHTML = renderEmployes();
            }
        }

        function initPresences() {
            if (presencesData.length === 0) {
                const today = new Date().toISOString().split('T')[0];
                employees.forEach((e, i) => {
                    presencesData.push({
                        employe: e.prenom + ' ' + e.nom,
                        date: today,
                        entree: i === 3 ? '09:15' : '08:00',
                        sortie: '16:00',
                        statut: i === 3 ? 'Retard' : 'Présent',
                        notes: ''
                    });
                });
            }
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

        function searchEmp(val) {
            const tbody = document.getElementById('empTbody');
            if (tbody) tbody.querySelectorAll('tr').forEach(tr => tr.style.display = tr.innerText.toLowerCase().includes(val.toLowerCase()) ? '' : 'none');
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

        function deleteEmp(i) {
            if (confirm(`⚠️ Supprimer ${employees[i].prenom} ${employees[i].nom} ?`)) {
                const nom = employees[i].prenom + ' ' + employees[i].nom;
                employees.splice(i, 1);
                presencesData = presencesData.filter(p => p.employe !== nom);
                renderPage('employes');
                updateBadges();
                showToast(`🗑️ ${nom} supprimé`, 'error');
            }
        }

        function saveEmployee() {
            const prenom = document.getElementById('empPrenom').value.trim();
            const nom = document.getElementById('empNom').value.trim();
            if (!prenom || !nom) { showToast('⚠️ Prénom et nom obligatoires', 'error'); return; }
            const data = {
                id: editingId !== null ? employees[editingId].id : matriculePrefix + String(employees.length + 1).padStart(3, '0'),
                prenom, nom,
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
            if (editingId !== null) {
                employees[editingId] = data;
                showToast(`✅ ${prenom} ${nom} modifié`, 'success');
            } else {
                employees.push(data);
                showToast(`✅ ${prenom} ${nom} ajouté — ${data.id}`, 'success');
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
        
        function renderProfesseurs() {
            const profs = getProfs();
            let rows = profs.map((p, i) => {
                const empIndex = employees.indexOf(p);
                return `<tr><td><div class="emp-cell"><div class="avatar-sm" style="background:${getColorFromString(p.nom)}">${getInitials(p)}</div><div class="emp-name">${p.prenom} ${p.nom}</div></div></td>
                <td>${p.cours?.length?p.cours.map(c=>`<span class="pill pill-info" style="margin:2px">${c}</span>`).join(' '):'<span class="pill pill-muted">Aucun</span>'}</td>
                <td>Promotion 2026</td><td>Lun-Ven 8h-16h</td>
                <td><span class="pill ${p.statut==='Actif'?'pill-success':'pill-danger'}">${p.statut}</span></td>
                <td><div class="btn-group">
                    <button class="btn btn-sm btn-outline" onclick="openCoursModal('${p.id}')"><i class="fas fa-plus-circle"></i> Cours</button>
                    <button class="btn btn-sm btn-outline btn-icon" onclick="voirEmploiTemps('${p.id}')"><i class="fas fa-calendar-alt"></i></button>
                    <button class="btn btn-sm btn-outline btn-icon" onclick="viewProfil(${empIndex})"><i class="fas fa-eye"></i></button>
                </div></td></tr>`;
            }).join('');
            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Professeurs</span><h2>${profs.length}</h2></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-chalkboard-teacher"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Cours</span><h2>${profs.reduce((s,p)=>s+(p.cours?.length||0),0)}</h2></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-book"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Présence</span><h2>92%</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-chart-line"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-chalkboard-teacher"></i> Professeurs</h2></div>
            <div class="table-wrap"><table><thead><tr><th>Professeur</th><th>Cours</th><th>Promotion</th><th>Horaire</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
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

        function renderPresences() {
            initPresences();
            let rows = presencesData.map(p => {
                const empIndex = employees.findIndex(e => (e.prenom + ' ' + e.nom) === p.employe);
                return `<tr><td class="emp-name">${p.employe}</td><td>${new Date(p.date).toLocaleDateString('fr-FR')}</td><td>${p.entree}</td><td>${p.sortie}</td>
                <td><span class="pill ${p.statut==='Retard'?'pill-warning':p.statut==='Absent'?'pill-danger':'pill-success'}">${p.statut}</span></td>
                <td><span class="pill ${p.statut==='Absent'?'pill-danger':'pill-success'}">${p.statut==='Absent'?'Absent':'Présent'}</span></td>
                <td><div class="btn-group">
                    <button class="btn btn-sm btn-outline" onclick="pointerPresenceModal(${empIndex})"><i class="fas fa-check-circle"></i> Pointer</button>
                    <button class="btn btn-sm btn-outline btn-icon" onclick="corrigerHeureModal(${empIndex})"><i class="fas fa-edit"></i></button>
                </div></td></tr>`;
            }).join('');
            const presents = presencesData.filter(p => p.statut === 'Présent' || p.statut === 'Retard').length;
            const retards = presencesData.filter(p => p.statut === 'Retard').length;
            const absents = presencesData.filter(p => p.statut === 'Absent').length;
            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Présents</span><h2>${presents}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-user-check"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Retards</span><h2>${retards}</h2></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-clock"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Absents</span><h2>${absents}</h2></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-user-times"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Taux</span><h2>${employees.length>0?Math.round((presents/employees.length)*100):0}%</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-percentage"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-clock"></i> Présences</h2><button class="btn btn-sm btn-outline" onclick="exportPresencesCSV()"><i class="fas fa-file-excel"></i> Excel</button></div>
            <div class="table-wrap"><table><thead><tr><th>Nom</th><th>Date</th><th>Entrée</th><th>Sortie</th><th>Statut</th><th>Présence</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
        }

        function pointerPresenceModal(empIndex) {
            if (empIndex < 0 || empIndex >= employees.length) return;
            const e = employees[empIndex];
            document.getElementById('pointageTitle').innerHTML = `<i class="fas fa-clock"></i> Pointer - ${e.prenom} ${e.nom}`;
            document.getElementById('pointageEmpIndex').value = empIndex;
            document.getElementById('pointageDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('pointageEntree').value = '08:00';
            document.getElementById('pointageSortie').value = '16:00';
            document.getElementById('pointageStatut').value = 'Présent';
            document.getElementById('pointageNotes').value = '';
            openModal('pointageModal');
        }

        function corrigerHeureModal(empIndex) {
            if (empIndex < 0 || empIndex >= employees.length) return;
            const e = employees[empIndex];
            const existing = presencesData.find(p => p.employe === (e.prenom + ' ' + e.nom));
            document.getElementById('pointageTitle').innerHTML = `<i class="fas fa-edit"></i> Corriger - ${e.prenom} ${e.nom}`;
            document.getElementById('pointageEmpIndex').value = empIndex;
            document.getElementById('pointageDate').value = existing ? existing.date : new Date().toISOString().split('T')[0];
            document.getElementById('pointageEntree').value = existing ? existing.entree : '08:00';
            document.getElementById('pointageSortie').value = existing ? existing.sortie : '16:00';
            document.getElementById('pointageStatut').value = existing ? (existing.statut === 'Retard' ? 'Retard' : existing.statut === 'Absent' ? 'Absent' : 'Présent') : 'Présent';
            document.getElementById('pointageNotes').value = existing ? (existing.notes || '') : '';
            openModal('pointageModal');
        }

        function enregistrerPointage() {
            const empIndex = parseInt(document.getElementById('pointageEmpIndex').value);
            if (empIndex < 0 || empIndex >= employees.length) { showToast('⚠️ Employé invalide', 'error'); return; }
            const e = employees[empIndex];
            const nomComplet = e.prenom + ' ' + e.nom;
            const date = document.getElementById('pointageDate').value;
            const existingIndex = presencesData.findIndex(p => p.employe === nomComplet && p.date === date);
            const data = {
                employe: nomComplet,
                date: date,
                entree: document.getElementById('pointageEntree').value,
                sortie: document.getElementById('pointageSortie').value,
                statut: document.getElementById('pointageStatut').value,
                notes: document.getElementById('pointageNotes').value
            };
            if (existingIndex >= 0) { presencesData[existingIndex] = data; }
            else { presencesData.push(data); }
            closeModal('pointageModal');
            renderPage('presences');
            showToast(`✅ Présence enregistrée`, 'success');
        }

        function renderConges() {
            let rows = congesData.map(c => `<tr><td class="emp-name">${c.employe}</td>
                <td><span class="pill ${c.type.includes('maladie')?'pill-danger':c.type.includes('annuel')?'pill-info':'pill-warning'}">${c.type}</span></td>
                <td>${c.debut}</td><td>${c.fin}</td><td>${c.jours}</td><td>${c.motif}</td>
                <td><span class="pill ${c.statut==='Approuvé'?'pill-success':c.statut==='Refusé'?'pill-danger':'pill-warning'}">${c.statut}</span></td>
                <td><div class="btn-group">${c.statut==='En attente'?`<button class="btn btn-sm btn-outline" onclick="approuverConge(${c.id})">✓</button><button class="btn btn-sm btn-danger btn-icon" onclick="refuserConge(${c.id})"><i class="fas fa-times"></i></button>`:'—'}
                <button class="btn btn-sm btn-outline btn-icon" onclick="voirHistConge('${c.employe}')"><i class="fas fa-history"></i></button></div></td></tr>`).join('');
            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>En attente</span><h2>${congesData.filter(c=>c.statut==='En attente').length}</h2></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-hourglass-half"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Approuvés</span><h2>${congesData.filter(c=>c.statut==='Approuvé').length}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Total Jours</span><h2>${congesData.reduce((s,c)=>s+c.jours,0)}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-calendar-day"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-umbrella-beach"></i> Congés</h2><button class="btn btn-primary btn-sm" onclick="openCongeModal()"><i class="fas fa-plus"></i> Nouvelle Demande</button></div>
            <div class="table-wrap"><table><thead><tr><th>Employé</th><th>Type</th><th>Début</th><th>Fin</th><th>Jours</th><th>Motif</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
        }

        function openCongeModal() {
            document.getElementById('congeEmp').innerHTML = employees.map(e => `<option>${e.prenom} ${e.nom}</option>`).join('');
            openModal('addCongeModal');
        }

        function soumettreConge() {
            const emp = document.getElementById('congeEmp').value;
            const debut = document.getElementById('congeDebut').value;
            const fin = document.getElementById('congeFin').value;
            if (!emp || !debut || !fin) { showToast('⚠️ Champs requis', 'error'); return; }
            const d1 = new Date(debut), d2 = new Date(fin);
            const jours = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
            congesData.push({
                id: congesData.length + 1,
                employe: emp,
                type: document.getElementById('congeType').value,
                debut: new Date(debut).toLocaleDateString('fr-FR'),
                fin: new Date(fin).toLocaleDateString('fr-FR'),
                jours: jours,
                motif: document.getElementById('congeMotif').value,
                statut: 'En attente'
            });
            closeModal('addCongeModal');
            renderPage('conges');
            showToast(`✅ Demande soumise (${jours} jours)`, 'success');
        }

        function approuverConge(id) { const c = congesData.find(c => c.id === id); if (c) { c.statut = 'Approuvé'; renderPage('conges'); showToast('✅ Congé approuvé', 'success'); } }
        function refuserConge(id) { const c = congesData.find(c => c.id === id); if (c) { c.statut = 'Refusé'; renderPage('conges'); showToast('❌ Congé refusé', 'error'); } }

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

        function renderSalaires() {
            let rows = employees.map(e => {
                const base = e.salaire || 50000, prime = e.prime || 5000, ded = Math.round(base * 0.08), net = base + prime - ded;
                return `<tr><td><div class="emp-name">${e.prenom} ${e.nom}</div><div class="emp-detail">${e.fonction}</div></td><td>${base.toLocaleString()} HTG</td><td style="color:var(--success)">+${prime.toLocaleString()} HTG</td><td style="color:var(--red)">-${ded.toLocaleString()} HTG</td><td style="font-weight:800;color:var(--blue)">${net.toLocaleString()} HTG</td><td><div class="btn-group"><button class="btn btn-sm btn-outline" onclick="genererFiche('${e.id}')"><i class="fas fa-receipt"></i> Fiche</button><button class="btn btn-sm btn-outline btn-icon" onclick="voirHistSalaire(${employees.indexOf(e)})"><i class="fas fa-history"></i></button></div></td></tr>`;
            }).join('');
            const totalMasse = employees.reduce((s, e) => { const b = e.salaire || 50000, p = e.prime || 5000; return s + b + p - Math.round(b * 0.08); }, 0);
            return `<div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
                <div class="stat-card"><div class="stat-info"><span>Masse brute</span><h2>${(employees.reduce((s,e)=>(e.salaire||50000)+(e.prime||5000),0)).toLocaleString()}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-money-bill-wave"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Net total</span><h2>${totalMasse.toLocaleString()}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-wallet"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Employés</span><h2>${employees.length}</h2></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-users"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-money-bill-wave"></i> Salaires</h2><div class="btn-group">
                <button class="btn btn-sm btn-outline" onclick="exportSalairesCSV()"><i class="fas fa-file-excel"></i> Excel</button>
                <button class="btn btn-sm btn-outline" onclick="exportSalairesPDF()"><i class="fas fa-file-pdf"></i> PDF</button>
                <button class="btn btn-sm btn-primary" onclick="calculerPayroll()"><i class="fas fa-calculator"></i> Calculer</button>
            </div></div>
            <div class="table-wrap"><table><thead><tr><th>Employé</th><th>Base</th><th>Prime</th><th>Déductions</th><th>Net</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
        }

        function genererFiche(id) {
            selectedFicheEmp = employees.find(e => e.id === id);
            if (selectedFicheEmp) showFichePaieModal(selectedFicheEmp);
        }

        function calculerPayroll() { showToast('✅ Payroll calculé', 'success'); renderPage('salaires'); }

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
            let rows = candidatsData.map((c, i) => `<tr><td><div class="emp-name">${c.prenom} ${c.nom}</div><div class="emp-detail">${c.dateCandidature}</div></td><td>${c.poste}</td><td>${c.tel}</td><td>${c.email}</td>
                <td><span class="pill ${c.cv==='Reçu'?'pill-success':'pill-muted'}">${c.cv}</span></td>
                <td><span class="pill ${c.statut==='Entretien'?'pill-info':c.statut==='Accepté'?'pill-success':c.statut==='Refusé'?'pill-danger':'pill-warning'}">${c.statut}</span></td>
                <td><div class="btn-group">
                    <button class="btn btn-sm btn-outline btn-icon" onclick="voirCandidat(${i})"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline btn-icon" onclick="editCandidat(${i})"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline" onclick="programmerEntretien(${i})"><i class="fas fa-calendar-check"></i> Entretien</button>
                    <button class="btn btn-sm btn-success btn-icon" onclick="accepterCandidat(${i})"><i class="fas fa-check"></i></button>
                    <button class="btn btn-sm btn-danger btn-icon" onclick="refuserCandidat(${i})"><i class="fas fa-times"></i></button>
                </div></td></tr>`).join('');
            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Candidats</span><h2>${candidatsData.length}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-briefcase"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Entretiens</span><h2>${candidatsData.filter(c=>c.statut==='Entretien').length}</h2></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-calendar-check"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Acceptés</span><h2>${candidatsData.filter(c=>c.statut==='Accepté').length}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-briefcase"></i> Recrutement</h2><button class="btn btn-primary btn-sm" onclick="openModal('addCandidatModal')"><i class="fas fa-plus"></i> Ajouter</button></div>
            <div class="table-wrap"><table><thead><tr><th>Candidat</th><th>Poste</th><th>Tél</th><th>Email</th><th>CV</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
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

        function saveCandidat() {
            const p = document.getElementById('candPrenom').value.trim();
            const n = document.getElementById('candNom').value.trim();
            if (!p || !n) { showToast('⚠️ Prénom et nom requis', 'error'); return; }
            const data = {
                prenom: p, nom: n,
                tel: document.getElementById('candTel').value,
                email: document.getElementById('candEmail').value,
                poste: document.getElementById('candPoste').value,
                cv: window._tempCVFile ? 'Reçu' : (editingCandidatIndex !== null ? candidatsData[editingCandidatIndex].cv : 'En attente'),
                statut: editingCandidatIndex !== null ? candidatsData[editingCandidatIndex].statut : 'En attente',
                dateCandidature: document.getElementById('candDate').value ? new Date(document.getElementById('candDate').value).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR'),
                dateEntretien: editingCandidatIndex !== null ? candidatsData[editingCandidatIndex].dateEntretien : '',
                heureEntretien: editingCandidatIndex !== null ? candidatsData[editingCandidatIndex].heureEntretien : '',
                interviewer: editingCandidatIndex !== null ? candidatsData[editingCandidatIndex].interviewer : '',
                notes: document.getElementById('candNotes').value,
                cvFileName: window._tempCVFileName || (editingCandidatIndex !== null ? candidatsData[editingCandidatIndex].cvFileName : '')
            };
            if (editingCandidatIndex !== null) {
                candidatsData[editingCandidatIndex] = data;
                showToast(`✅ ${p} ${n} modifié`, 'success');
                editingCandidatIndex = null;
            } else {
                candidatsData.push(data);
                showToast(`✅ ${p} ${n} ajouté`, 'success');
            }
            if (window._tempCVFile) {
                documentsData.push({
                    nom: window._tempCVFileName || `CV_${p}_${n}.pdf`,
                    employe: p + ' ' + n + ' (Candidat)',
                    type: 'CV',
                    date: new Date().toLocaleDateString('fr-FR'),
                    taille: formatFileSize(window._tempCVFile.size)
                });
            }
            closeModal('addCandidatModal');
            resetCVUpload();
            renderPage('recrutement');
        }

        function programmerEntretien(i) {
            const c = candidatsData[i];
            if (!c) return;
            document.getElementById('entretienTitle').innerHTML = `<i class="fas fa-calendar-check"></i> Programmer Entretien`;
            document.getElementById('entretienCandidatIndex').value = i;
            document.getElementById('entretienCandidatNom').value = `${c.prenom} ${c.nom} - ${c.poste}`;
            document.getElementById('entretienDate').value = '';
            document.getElementById('entretienHeure').value = '10:00';
            document.getElementById('entretienInterviewer').innerHTML = '<option value="">— Sélectionner —</option>' + employees.filter(e => e.fonction === 'Directeur' || e.fonction === 'Coordinateur' || e.fonction === 'Administrateur').map(e => `<option>${e.prenom} ${e.nom}</option>`).join('');
            openModal('entretienModal');
        }

        function confirmerEntretien() {
            const i = parseInt(document.getElementById('entretienCandidatIndex').value);
            const date = document.getElementById('entretienDate').value;
            const heure = document.getElementById('entretienHeure').value;
            const interviewer = document.getElementById('entretienInterviewer').value;
            if (!date) { showToast('⚠️ Sélectionnez une date', 'error'); return; }
            if (!interviewer) { showToast('⚠️ Sélectionnez un intervieweur', 'error'); return; }
            candidatsData[i].statut = 'Entretien';
            candidatsData[i].dateEntretien = new Date(date).toLocaleDateString('fr-FR');
            candidatsData[i].heureEntretien = heure;
            candidatsData[i].interviewer = interviewer;
            closeModal('entretienModal');
            renderPage('recrutement');
            showToast(`📅 Entretien programmé`, 'success');
        }

        function accepterCandidat(i) {
            if (confirm(`✅ Accepter ${candidatsData[i].prenom} ${candidatsData[i].nom} ?`)) {
                candidatsData[i].statut = 'Accepté';
                renderPage('recrutement');
                showToast('✅ Candidat accepté', 'success');
            }
        }

        function refuserCandidat(i) {
            if (confirm(`❌ Refuser ${candidatsData[i].prenom} ${candidatsData[i].nom} ?`)) {
                candidatsData[i].statut = 'Refusé';
                renderPage('recrutement');
                showToast('❌ Candidat refusé', 'error');
            }
        }

        function renderDocuments() {
            let rows = documentsData.map(d => `<tr>
                <td><div style="display:flex;align-items:center;gap:10px"><i class="fas ${getDocIcon(d.nom)}" style="color:${getDocColor(d.nom)};font-size:1.2rem"></i><div><div class="emp-name">${d.nom}</div><div class="emp-detail">${d.type} · ${d.taille}</div></div></div></td>
                <td>${d.employe}</td><td><span class="pill ${getDocTypeClass(d.type)}">${d.type}</span></td><td>${d.date}</td><td>${d.taille}</td>
                <td><div class="btn-group">
                    <button class="btn btn-sm btn-outline btn-icon" title="Voir" onclick="voirDoc('${d.nom}')"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-outline" onclick="telechargerDoc('${d.nom}')"><i class="fas fa-download"></i> Télécharger</button>
                    <button class="btn btn-sm btn-danger btn-icon" title="Supprimer" onclick="supprimerDoc('${d.nom}')"><i class="fas fa-trash"></i></button>
                </div></td></tr>`).join('');
            return `<div class="stats-grid">
                <div class="stat-card"><div class="stat-info"><span>Documents</span><h2>${documentsData.length}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-folder-open"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>CV Candidats</span><h2>${documentsData.filter(d=>d.employe.includes('(Candidat)')).length}</h2></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-user-tie"></i></div></div>
                <div class="stat-card"><div class="stat-info"><span>Docs Employés</span><h2>${documentsData.filter(d=>!d.employe.includes('(Candidat)')).length}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-building"></i></div></div>
            </div>
            <div class="card"><div class="card-header"><h2><i class="fas fa-folder-open"></i> Documents</h2><button class="btn btn-sm btn-primary" onclick="openModal('uploadDocModal')"><i class="fas fa-upload"></i> Téléverser</button></div>
            <div class="table-wrap"><table><thead><tr><th><i class="fas fa-file"></i> Document</th><th><i class="fas fa-user"></i> Propriétaire</th><th><i class="fas fa-tag"></i> Type</th><th><i class="fas fa-calendar"></i> Date</th><th><i class="fas fa-weight-hanging"></i> Taille</th><th><i class="fas fa-cog"></i> Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
        }

        function renderEvaluations() {
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
            <div class="card"><div class="card-header"><h2><i class="fas fa-star"></i> Évaluations</h2><button class="btn btn-primary btn-sm" onclick="openEvalModal()"><i class="fas fa-plus"></i> Nouvelle</button></div>
            <div class="table-wrap"><table><thead><tr><th>Employé</th><th>Date</th><th>Perf</th><th>Punct</th><th>Disc</th><th>Comm</th><th>Score</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
        }

        function openEvalModal() {
            editingEvalIndex = null;
            document.getElementById('evalEmp').innerHTML = employees.map(e => `<option>${e.prenom} ${e.nom}</option>`).join('');
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
            document.getElementById('evalEmp').innerHTML = employees.map(e => `<option ${(e.prenom+' '+e.nom)===ev.employe?'selected':''}>${e.prenom} ${e.nom}</option>`).join('');
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
                evaluationsData.splice(i, 1);
                renderPage('evaluations');
                showToast(`🗑️ Évaluation de ${ev.employe} supprimée`, 'error');
            }
        }

        function saveEvaluation() {
            const emp = document.getElementById('evalEmp').value;
            const perf = parseInt(document.getElementById('evalPerf').value) || 0;
            const punct = parseInt(document.getElementById('evalPunct').value) || 0;
            const disc = parseInt(document.getElementById('evalDisc').value) || 0;
            const comm = parseInt(document.getElementById('evalComm').value) || 0;
            const score = Math.round((perf + punct + disc + comm) / 4);
            const data = {
                employe: emp, perf, punct, disc, comm, score,
                date: editingEvalIndex !== null ? evaluationsData[editingEvalIndex].date : new Date().toLocaleDateString('fr-FR'),
                commentaire: document.getElementById('evalComments').value
            };
            if (editingEvalIndex !== null) {
                evaluationsData[editingEvalIndex] = data;
                showToast(`✅ Évaluation de ${emp} modifiée — Score: ${score}%`, 'success');
            } else {
                evaluationsData.push(data);
                showToast(`✅ ${emp} — Score: ${score}%`, 'success');
            }
            editingEvalIndex = null;
            closeModal('addEvalModal');
            renderPage('evaluations');
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
            let csv = 'Employé,Date,Entrée,Sortie,Statut\n';
            presencesData.forEach(p => csv += `${p.employe},${p.date},${p.entree},${p.sortie},${p.statut}\n`);
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'presences_cejec.csv';
            a.click();
            showToast('📁 CSV Présences exporté', 'success');
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
                document.getElementById('docEmp').innerHTML = employees.map(e => `<option>${e.prenom} ${e.nom}</option>`).join('');
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

        function refreshAll() { initPresences(); renderPage(currentPage); updateBadges(); showToast('🔄 Actualisé', 'info'); }

        // ==================== DEMARAJ APLIKASYON ====================
        initPresences();
        renderPage('employes');
        updateBadges();
        console.log('✅ Module RH CEJEC prêt !');