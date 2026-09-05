        let matieres = [
            'Entrepreneuriat', 'Plan d\'affaires', 'Sociologie de la pratique des affaires',
            'Éducation à la technologie', 'Développement personnel', 'Marketing',
            'Droit des affaires', 'Les lois du succès', 'Gestion des ressources humaines',
            'Leadership', 'Correspondance administrative', 'Art oratoire'
        ];

        let academicyears = ['2025-2026', '2026-2027', '2027-2028'];
        let classes = ['ENTREPRENEURIAT', 'COMPTABILITÉ', 'INFORMATIQUE', 'GESTION'];
        let currentYear = '2025-2026';
        let currentClass = 'ENTREPRENEURIAT';

        let etudiants = [
            { id: 1, nom: 'Marie Dupont', matricule: 'CEJ-001', telephone: '+509 34 01 0101',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
            { id: 2, nom: 'Sophie Bernard', matricule: 'CEJ-002', telephone: '+509 34 02 0202',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
            { id: 3, nom: 'Pierre Antoine', matricule: 'CEJ-003', telephone: '+509 34 03 0303',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
            { id: 4, nom: 'Jean Baptiste', matricule: 'CEJ-004', telephone: '+509 34 04 0404',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
            { id: 5, nom: 'Rose Michel', matricule: 'CEJ-005', telephone: '+509 34 05 0505',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
            { id: 6, nom: 'Jameson Pierre', matricule: 'CEJ-006', telephone: '+509 34 06 0606',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
            { id: 7, nom: 'Mireille Dumont', matricule: 'CEJ-007', telephone: '+509 34 07 0707',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
            { id: 8, nom: 'Frantz Louis', matricule: 'CEJ-008', telephone: '+509 34 08 0808',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
            { id: 9, nom: 'Marc Arthur', matricule: 'CEJ-009', telephone: '+509 34 09 0909',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
            { id: 10, nom: 'Nathalie Pierre', matricule: 'CEJ-010', telephone: '+509 34 10 1010',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
            { id: 11, nom: 'Carline Étienne', matricule: 'CEJ-011', telephone: '+509 34 11 1111',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
            { id: 12, nom: 'André Simon', matricule: 'CEJ-012', telephone: '+509 34 12 1212',
                classe: 'ENTREPRENEURIAT', annee: '2025-2026' },
        ];

        let evaluations = [];
        let notes = {};
        let nextEvalId = 1;
        let currentPanelStudent = null;
        let currentEditStudent = null;
        let chartInstances = {};
        let schoolClasses = [];
        let courses = [];
        let assessments = [];
        let editingAssessmentId = null;
        function getCurrentClassData() { return schoolClasses.find(item => item.name === currentClass); }
        function refreshCurrentCourses() { const schoolClass = getCurrentClassData(); evaluations = assessments.filter(item => (!schoolClass || item.school_class === schoolClass.id) && item.academic_year === currentYear).map(item => ({ id: String(item.id), matiere: item.course_name, type: item.title, evaluationType: item.evaluation_type, date: item.evaluation_date, coef: Number(item.coefficient), comment: item.term, annee: item.academic_year, classe: item.school_class_name })); matieres = [...new Set(evaluations.map(evaluation => evaluation.matiere))]; }
        async function loadRealData() { const [students, loadedClasses, loadedCourses, loadedGrades, loadedAssessments] = await Promise.all([StudentsAPI.list(), ClassesAPI.list(), CoursesAPI.list(), GradesAPI.list(), AssessmentsAPI.list()]); schoolClasses = loadedClasses.filter(item => item.is_active); courses = loadedCourses.filter(item => item.status === 'active'); assessments = loadedAssessments; classes = schoolClasses.map(item => item.name); if (classes.length) currentClass = classes[0]; academicyears = [...new Set(assessments.map(item => item.academic_year))]; currentYear = academicyears[0] || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`; etudiants = students.map(student => ({ id: student.id, nom: student.full_name || `Étudiant #${student.id}`, matricule: student.registration_number || `ETU-${student.id}`, telephone: '', classe: student.school_class_name || 'Sans classe', annee: currentYear })); refreshCurrentCourses(); notes = {}; loadedGrades.forEach(grade => { notes[`${grade.student}_${grade.assessment || grade.course}`] = Number(grade.value); }); }
        function getEvaluationForMatiere(reference) { return evaluations.find(evaluation => String(evaluation.id) === String(reference)) || evaluations.find(evaluation => evaluation.matiere === reference); }
        async function persistNote(etudiantId, matiere, value, date) { const evaluation = getEvaluationForMatiere(matiere); if (!evaluation) throw new Error('EVALUATION_INTROUVABLE'); const result = await GradesAPI.submit({ student: etudiantId, assessment: evaluation.id, value, date }); if (result.outcome === 'conflict') throw new Error('CONFLIT_NOTE'); notes[`${etudiantId}_${evaluation.id}`] = value; }
        function getRecordedNoteCount(studentId = null) { const students = studentId == null ? getFilteredEtudiants().map(student => student.id) : [studentId]; return students.reduce((count, id) => count + evaluations.filter(evaluation => notes[`${id}_${evaluation.id}`] !== undefined && notes[`${id}_${evaluation.id}`] !== null).length, 0); }

        function initSampleData() {
            if (etudiants.length > 0 && evaluations.length > 0) return; // FIX: Don't overwrite real data
            matieres.forEach((mat, idx) => {
                const evalId1 = nextEvalId++;
                evaluations.push({ id: evalId1, matiere: mat, type: 'Devoir', date: '2026-03-' + String(10 + idx)
                        .padStart(2, '0'), coef: 2, comment: '', annee: '2025-2026',
                    classe: 'ENTREPRENEURIAT' });
                etudiants.filter(e => e.classe === 'ENTREPRENEURIAT' && e.annee === '2025-2026').forEach(et => {
                    notes[`${et.id}_${evalId1}`] = Math.round((55 + Math.random() * 45) * 2) / 2;
                });
                const evalId2 = nextEvalId++;
                evaluations.push({ id: evalId2, matiere: mat, type: 'Examen', date: '2026-05-' + String(15 + idx)
                        .padStart(2, '0'), coef: 3, comment: 'Examen Final', annee: '2025-2026',
                    classe: 'ENTREPRENEURIAT' });
                etudiants.filter(e => e.classe === 'ENTREPRENEURIAT' && e.annee === '2025-2026').forEach(et => {
                    notes[`${et.id}_${evalId2}`] = Math.round((45 + Math.random() * 55) * 2) / 2;
                });
            });
        }

        function getInitials(nom) { return nom.split(' ').map(w => w[0]).join('').toUpperCase(); }

        function getAvatarColor(i) {
            const c = ['#0A4D8C', '#D62828', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#e11d48',
                '#0891b2', '#7c3aed', '#059669'
            ];
            return c[i % c.length];
        }

        function showToast(msg, type = 'success') {
            const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
            const el = document.createElement('div');
            el.className = `toast toast-${type}`;
            el.innerHTML = `<i class="fas ${icons[type]}"></i> ${msg}`;
            document.getElementById('toastContainer').appendChild(el);
            setTimeout(() => { el.style.opacity = '0';
                el.style.transform = 'translateX(80px)';
                el.style.transition = 'all .3s';
                setTimeout(() => el.remove(), 300); }, 3500);
        }

        function getFilteredEtudiants() {
            const search = document.getElementById('filterSearch').value.toLowerCase();
            const mention = document.getElementById('filterMention').value;
            let filtered = etudiants.filter(e => e.annee === currentYear && e.classe === currentClass);
            if (search) filtered = filtered.filter(e => e.nom.toLowerCase().includes(search));
            if (mention !== 'tous') {
                filtered = filtered.filter(e => {
                    const avg = getStudentAverage(e.id);
                    return getMention(avg).class === mention;
                });
            }
            return filtered;
        }

        function getStudentAverage(etudiantId) {
            let totalNotes = 0,
                totalCoef = 0;
            evaluations.forEach(ev => {
                if (ev.annee === currentYear && ev.classe === currentClass) {
                    const key = `${etudiantId}_${ev.id}`;
                    if (notes[key] !== undefined && notes[key] !== null && notes[key] !== '') {
                        totalNotes += notes[key] * ev.coef;
                        totalCoef += ev.coef;
                    }
                }
            });
            return totalCoef > 0 ? Math.round((totalNotes / totalCoef) * 100) / 100 : 0;
        }

        function getMatiereAverage(etudiantId, matiere) {
            let totalNotes = 0,
                totalCoef = 0;
            evaluations.forEach(ev => {
                if (ev.matiere === matiere && ev.annee === currentYear && ev.classe === currentClass) {
                    const key = `${etudiantId}_${ev.id}`;
                    if (notes[key] !== undefined && notes[key] !== null && notes[key] !== '') {
                        totalNotes += notes[key] * ev.coef;
                        totalCoef += ev.coef;
                    }
                }
            });
            return totalCoef > 0 ? Math.round((totalNotes / totalCoef) * 100) / 100 : null;
        }

        function getMention(avg) {
            if (avg >= 90) return { text: 'Excellent', class: 'mention-excellent' };
            if (avg >= 80) return { text: 'Très Bien', class: 'mention-tresbien' };
            if (avg >= 70) return { text: 'Bien', class: 'mention-bien' };
            if (avg >= 60) return { text: 'Assez Bien', class: 'mention-assezbien' };
            if (avg >= 50) return { text: 'Passable', class: 'mention-passable' };
            return { text: 'Insuffisant', class: 'mention-insuffisant' };
        }

        function getClassRank(etudiantId) {
            const filtered = getFilteredEtudiants();
            const avgs = filtered.map(e => ({ id: e.id, avg: getStudentAverage(e.id) })).sort((a, b) => b.avg - a.avg);
            const idx = avgs.findIndex(a => a.id === etudiantId);
            return idx >= 0 ? idx + 1 : filtered.length;
        }

        function getNoteClass(note) {
            if (note === null || note === undefined || note === '') return '';
            if (note >= 80) return 'note-high';
            if (note >= 60) return 'note-mid';
            return 'note-low';
        }

        function renderTable() {
            const filtered = getFilteredEtudiants();
            const classEvals = evaluations.filter(ev => ev.annee === currentYear && ev.classe === currentClass);
            const head = document.getElementById('tableHead');
            const body = document.getElementById('tableBody');

            let headHTML = '<tr><th class="corner"><i class="fas fa-user"></i> Élève</th>';
            matieres.forEach(mat => {
                const count = classEvals.filter(ev => ev.matiere === mat).length;
                const shortName = mat.length > 20 ? mat.substring(0, 18) + '...' : mat;
                headHTML +=
                    `<th><i class="fas fa-book"></i> ${shortName}<br><small style="font-weight:400;font-size:.6rem">${count} note(s)</small></th>`;
            });
            headHTML +=
                '<th><i class="fas fa-calculator"></i> Moy.</th><th><i class="fas fa-trophy"></i> Rang</th><th><i class="fas fa-star"></i> Mention</th>';
            headHTML +=
                '<th class="actions-col"><i class="fas fa-cogs"></i> Actions</th></tr>';
            head.innerHTML = headHTML;

            const avgsList = filtered.map(e => ({ id: e.id, avg: getStudentAverage(e.id) })).sort((a, b) => b.avg - a.avg);
            const rankMap = {};
            avgsList.forEach((a, i) => rankMap[a.id] = i + 1);

            let bodyHTML = '';
            if (filtered.length === 0) {
                bodyHTML = '<tr><td colspan="' + (matieres.length + 4) +
                    '" style="text-align:center;padding:40px;color:var(--muted);font-size:0.9rem">Aucun élève trouvé</td></tr>';
            } else {
                filtered.forEach((et) => {
                    bodyHTML += '<tr>';
                    bodyHTML +=
                        `<td class="student-cell" onclick="openPanel(${et.id})" title="Détails"><span class="avatar-xs" style="background:${getAvatarColor(et.id)}">${getInitials(et.nom)}</span>${et.nom}</td>`;

                    matieres.forEach(mat => {
                        const avg = getMatiereAverage(et.id, mat);
                        const noteClass = getNoteClass(avg);
                        bodyHTML +=
                            `<td class="note-cell" onclick="event.stopPropagation();startCellEdit(this, ${et.id}, '${mat.replace(/'/g, "\\'")}')" title="Cliquer pour ajouter/modifier la note de ${et.nom} en ${mat}">
                    <span class="note-display ${noteClass}">${avg !== null ? avg.toFixed(1) : '<span style="color:#cbd5e1">-</span>'}</span>
                    <input type="number" class="note-input-inline" min="0" max="100" step="0.5" inputmode="decimal" onblur="finishCellEdit(this, ${et.id}, '${mat.replace(/'/g, "\\'")}')" onkeydown="if(event.key==='Enter'){this.blur();}">
                  </td>`;
                    });

                    const avg = getStudentAverage(et.id);
                    const rank = rankMap[et.id] || filtered.length;
                    const mention = getMention(avg);
                    bodyHTML += `<td class="avg-cell">${avg > 0 ? avg.toFixed(2) : '-'}</td>`;
                    bodyHTML += `<td class="rank-cell">${rank}<sup>/${filtered.length}</sup></td>`;
                    bodyHTML +=
                        `<td><span class="mention-badge ${mention.class}">${avg > 0 ? mention.text : '-'}</span></td>`;
                    bodyHTML += `<td class="actions-cell">
                <button class="btn btn-outline btn-xs" onclick="event.stopPropagation();openPanel(${et.id})" title="Voir"><i class="fas fa-eye"></i></button>
                <button class="btn btn-outline btn-xs" onclick="event.stopPropagation();openEditNotesModal(${et.id})" title="Modifier tout"><i class="fas fa-edit"></i></button>
                <button class="btn btn-primary btn-xs" onclick="event.stopPropagation();generateBulletin(${et.id})" title="Bulletin"><i class="fas fa-file-alt"></i></button>
                <button class="btn btn-outline btn-xs" onclick="event.stopPropagation();printStudent(${et.id})" title="Imprimer"><i class="fas fa-print"></i></button>
                <button class="btn btn-danger btn-xs" onclick="event.stopPropagation();archiveStudent(${et.id})" title="Archiver"><i class="fas fa-archive"></i></button>
              </td>`;
                    bodyHTML += '</tr>';
                });
            }
            body.innerHTML = bodyHTML;

            document.getElementById('classNameDisplay').textContent = currentClass;
            document.getElementById('currentYear').textContent = currentYear;
            document.getElementById('currentClass').textContent = currentClass;
            document.getElementById('notesCount').textContent = getRecordedNoteCount();
            updateStats();
            updateCharts();
        }

        function startCellEdit(cell, etudiantId, matiere) {
            if (cell.classList.contains('editing')) return;
            document.querySelectorAll('td.note-cell.editing').forEach(c => { c.classList.remove('editing'); });
            cell.classList.add('editing');
            const input = cell.querySelector('.note-input-inline');
            const currentAvg = getMatiereAverage(etudiantId, matiere);
            input.value = currentAvg !== null ? currentAvg : '';
            setTimeout(() => { input.focus(); if (input.value) input.select(); }, 50);
            input.dataset.etudiantId = etudiantId;
            input.dataset.matiere = matiere;
        }

        async function finishCellEdit(input, etudiantId, matiere) { const cell = input.closest('.note-cell'); if (!cell) return; const value = Number(input.value); cell.classList.remove('editing'); if (input.value === '' || Number.isNaN(value)) { showToast('La suppression d’une note n’est pas encore disponible.', 'info'); renderTable(); return; } if (value < 0 || value > 100) { showToast('La note doit être comprise entre 0 et 100.', 'error'); renderTable(); return; } try { await persistNote(etudiantId, matiere, value, new Date().toISOString().slice(0, 10)); showToast('Note enregistrée.', 'success'); } catch (error) { showToast(error.message === 'CONFLIT_NOTE' ? 'Conflit détecté : arbitrage administrateur requis.' : 'Enregistrement impossible.', 'error'); } renderTable(); }

        function openAssessmentModal(id = null) { editingAssessmentId = id; const existing = id ? assessments.find(item => String(item.id) === String(id)) : null; const schoolClass = getCurrentClassData(); document.getElementById('assessmentModalTitle').textContent = existing ? 'Modifier l’évaluation' : 'Nouvelle évaluation'; document.getElementById('assessmentCourse').innerHTML = courses.map(course => `<option value="${course.id}">${course.code} — ${course.name}</option>`).join(''); document.getElementById('assessmentCourse').value = existing?.course || ''; document.getElementById('assessmentTitle').value = existing?.title || ''; document.getElementById('assessmentType').value = existing?.evaluation_type || 'assignment'; document.getElementById('assessmentCoefficient').value = existing?.coefficient || 1; document.getElementById('assessmentTerm').value = existing?.term || ''; document.getElementById('assessmentYear').value = existing?.academic_year || currentYear; document.getElementById('assessmentDate').value = existing?.evaluation_date || new Date().toISOString().slice(0, 10); if (!schoolClass) { showToast('Sélectionnez une classe active.', 'error'); return; } document.getElementById('assessmentModal').classList.add('open'); }
        function closeAssessmentModal() { document.getElementById('assessmentModal').classList.remove('open'); editingAssessmentId = null; }
        async function saveAssessment() { const schoolClass = getCurrentClassData(); const payload = { course: document.getElementById('assessmentCourse').value, school_class: schoolClass?.id, title: document.getElementById('assessmentTitle').value.trim(), evaluation_type: document.getElementById('assessmentType').value, coefficient: Number(document.getElementById('assessmentCoefficient').value), term: document.getElementById('assessmentTerm').value.trim(), academic_year: document.getElementById('assessmentYear').value.trim(), evaluation_date: document.getElementById('assessmentDate').value }; if (!payload.course || !payload.school_class || !payload.title || !payload.academic_year || !payload.evaluation_date || payload.coefficient <= 0) { showToast('Complétez tous les champs requis.', 'error'); return; } try { const saved = editingAssessmentId ? await AssessmentsAPI.update(editingAssessmentId, payload) : await AssessmentsAPI.create(payload); const index = assessments.findIndex(item => String(item.id) === String(saved.id)); if (index >= 0) assessments[index] = saved; else assessments.push(saved); if (!academicyears.includes(saved.academic_year)) academicyears.push(saved.academic_year); currentYear = saved.academic_year; updateYearFilter(); refreshCurrentCourses(); closeAssessmentModal(); renderTable(); showToast('Évaluation enregistrée.', 'success'); } catch (error) { showToast('Enregistrement de l’évaluation impossible.', 'error'); } }

        function openAddNoteModal() {
            const studentSelect = document.getElementById('addNoteStudent');
            studentSelect.innerHTML = '<option value="">-- Sélectionner un élève --</option>' +
                etudiants.filter(e => e.annee === currentYear && e.classe === currentClass)
                .map(e => `<option value="${e.id}">${e.nom}</option>`).join('');

            const matiereSelect = document.getElementById('addNoteMatiere');
            matiereSelect.innerHTML = '<option value="">-- Sélectionner une évaluation --</option>' +
                evaluations.map(e => `<option value="${e.id}">${e.matiere} · ${e.type} · coef ${e.coef}</option>`).join('');
            matiereSelect.onchange = () => { const e = getEvaluationForMatiere(matiereSelect.value); const labels = { quiz: 'Quiz', assignment: 'Devoir', exam: 'Examen', project: 'Projet', oral: 'Oral' }; document.getElementById('addNoteCoef').value = e?.coef || ''; document.getElementById('addNoteType').value = labels[e?.evaluationType] || ''; };

            document.getElementById('addNoteDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('addNoteValue').value = 75;
            document.getElementById('addNoteCoef').value = 1;
            document.getElementById('addNoteType').value = 'Examen';
            document.getElementById('addNoteModal').classList.add('open');
            setTimeout(() => studentSelect.focus(), 100);
        }

        function closeAddNoteModal() { document.getElementById('addNoteModal').classList.remove('open'); }

        async function saveNewNote() { const etudiantId = Number(document.getElementById('addNoteStudent').value); const matiere = document.getElementById('addNoteMatiere').value; const noteVal = Number(document.getElementById('addNoteValue').value); const date = document.getElementById('addNoteDate').value; if (!etudiantId || !matiere || Number.isNaN(noteVal) || noteVal < 0 || noteVal > 100) { showToast('Sélectionnez un élève, un cours et une note entre 0 et 100.', 'error'); return; } try { await persistNote(etudiantId, matiere, noteVal, date); closeAddNoteModal(); renderTable(); showToast('Note enregistrée.', 'success'); } catch (error) { showToast(error.message === 'CONFLIT_NOTE' ? 'Conflit détecté : la note doit être arbitrée par un administrateur.' : 'Enregistrement impossible.', 'error'); } }

        function updateStats() {
            const filtered = getFilteredEtudiants();
            document.getElementById('statStudents').textContent = filtered.length;
            const avgs = filtered.map(e => getStudentAverage(e.id)).filter(a => a > 0);
            const classAvg = avgs.length > 0 ? Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 100) / 100 : 0;
            document.getElementById('statAvg').textContent = classAvg;
            const success = avgs.filter(a => a >= 10).length;
            document.getElementById('statSuccess').textContent = avgs.length > 0 ? Math.round((success / avgs.length) *
                100) + '%' : '0%';
            const best = filtered.reduce((a, b) => getStudentAverage(a.id) >= getStudentAverage(b.id) ? a : b, filtered[
            0]);
            document.getElementById('statBest').textContent = best && getStudentAverage(best.id) > 0 ? best.nom.split(' ')[
                0
            ] : '-';
            const low = avgs.filter(a => a < 10).length;
            document.getElementById('statLow').textContent = low;
        }

        function updateCharts() {
            const filtered = getFilteredEtudiants();
            const ctx1 = document.getElementById('barChart');
            if (ctx1) {
                if (chartInstances['bar']) chartInstances['bar'].destroy();
                const matAvgs = matieres.map(mat => {
                    const allNotes = [];
                    filtered.forEach(et => { const avg = getMatiereAverage(et.id, mat); if (avg !== null) allNotes
                            .push(avg); });
                    return allNotes.length > 0 ? Math.round((allNotes.reduce((a, b) => a + b, 0) / allNotes
                        .length) * 10) / 10 : 0;
                });
                const shortLabels = matieres.map(m => m.length > 18 ? m.substring(0, 16) + '...' : m);
                chartInstances['bar'] = new Chart(ctx1, {
                    type: 'bar',
                    data: { labels: shortLabels, datasets: [{ label: 'Moy. /100', data: matAvgs,
                            backgroundColor: 'rgba(10,77,140,0.7)', borderRadius: 6 }] },
                    options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100,
                                ticks: { font: { size: 10 } } }, x: { ticks: { font: { size: 9 },
                                maxRotation: 45 } } },
                        plugins: { legend: { display: false } } }
                });
            }
            const ctx2 = document.getElementById('pieChart');
            if (ctx2) {
                if (chartInstances['pie']) chartInstances['pie'].destroy();
                const mentionsCount = { 'Excellent': 0, 'Très Bien': 0, 'Bien': 0, 'Assez Bien': 0, 'Passable': 0,
                    'Insuffisant': 0 };
                filtered.forEach(et => { const avg = getStudentAverage(et.id); if (avg > 0) mentionsCount[getMention(
                        avg).text] = (mentionsCount[getMention(avg).text] || 0) + 1; });
                const colors = ['#10b981', '#3b82f6', '#6366f1', '#f59e0b', '#f97316', '#D62828'];
                chartInstances['pie'] = new Chart(ctx2, {
                    type: 'doughnut',
                    data: { labels: Object.keys(mentionsCount), datasets: [{ data: Object.values(
                                mentionsCount), backgroundColor: colors, borderWidth: 0 }] },
                    options: { responsive: true, maintainAspectRatio: false, cutout: '55%',
                        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 },
                                padding: 10 } } } }
                });
            }
        }

        function openPanel(etudiantId) {
            currentPanelStudent = etudiants.find(e => e.id === etudiantId);
            if (!currentPanelStudent) return;
            document.getElementById('studentPanel').classList.add('open');
            document.getElementById('panelOverlay').classList.add('open');
            document.getElementById('panelAvatar').textContent = getInitials(currentPanelStudent.nom);
            document.getElementById('panelAvatar').style.background = getAvatarColor(etudiantId);
            document.getElementById('panelName').textContent = currentPanelStudent.nom;
            document.getElementById('panelMatricule').textContent = 'Matricule: ' + currentPanelStudent.matricule;
            const avg = getStudentAverage(etudiantId);
            const rank = getClassRank(etudiantId);
            const mention = getMention(avg);
            const filtered = getFilteredEtudiants();
            const classEvals = evaluations.filter(ev => ev.annee === currentYear && ev.classe === currentClass);
            let matieresHTML = matieres.map(mat => {
                const mAvg = getMatiereAverage(etudiantId, mat);
                const m = mAvg !== null ? getMention(mAvg) : { text: '-', class: '' };
                const shortMat = mat.length > 30 ? mat.substring(0, 28) + '...' : mat;
                return `<div class="info-row"><span class="label">${shortMat}</span><span class="value">${mAvg !== null ? mAvg.toFixed(1)+'/100' : 'N/A'} <small style="font-size:0.6rem">(${m.text})</small></span></div>`;
            }).join('');
            document.getElementById('panelBody').innerHTML = `
            <div class="info-row"><span class="label">Matricule</span><span class="value">${currentPanelStudent.matricule}</span></div>
            <div class="info-row"><span class="label">Téléphone</span><span class="value">${currentPanelStudent.telephone}</span></div>
            <div class="info-row"><span class="label">Classe</span><span class="value">${currentPanelStudent.classe}</span></div>
            <div class="info-row"><span class="label">Année</span><span class="value">${currentPanelStudent.annee}</span></div>
            <div class="info-row"><span class="label">Notes saisies</span><span class="value">${getRecordedNoteCount(etudiantId)}</span></div>
            <hr style="margin:10px 0;border-color:var(--border-light)">
            <div class="info-row"><span class="label" style="font-weight:700;color:var(--blue);font-size:0.85rem">Moyenne</span><span class="value" style="font-size:1.3rem;font-weight:800;color:var(--blue)">${avg > 0 ? avg.toFixed(2)+'/100' : 'N/A'}</span></div>
            <div class="info-row"><span class="label">Rang</span><span class="value" style="font-weight:700">${rank} / ${filtered.length}</span></div>
            <div class="info-row"><span class="label">Mention</span><span class="value"><span class="mention-badge ${mention.class}">${mention.text}</span></span></div>
            <hr style="margin:10px 0;border-color:var(--border-light)">
            <strong style="font-size:0.75rem;color:var(--muted)">DÉTAIL PAR MATIÈRE</strong>
            ${matieresHTML}`;
        }

        function closePanel() { document.getElementById('studentPanel').classList.remove('open');
            document.getElementById('panelOverlay').classList.remove('open');
            currentPanelStudent = null; }

        function panelView() { if (currentPanelStudent) showToast('Détails de ' + currentPanelStudent.nom, 'info'); }

        function panelEditNotes() { if (currentPanelStudent) { closePanel();
                openEditNotesModal(currentPanelStudent.id); } }

        function panelBulletin() { if (currentPanelStudent) { generateBulletin(currentPanelStudent.id);
                closePanel(); } }

        function panelStats() { if (currentPanelStudent) { document.getElementById('filterSearch').value =
                    currentPanelStudent.nom;
                applyFilters();
                closePanel(); } }

        function panelPrint() { if (currentPanelStudent) { printStudent(currentPanelStudent.id);
                closePanel(); } }

        function panelSendWhatsApp() {
            if (currentPanelStudent) {
                const msg =
                    `📚 *Bulletin CEJEC*\n👤 *${currentPanelStudent.nom}*\n📊 Moy: ${getStudentAverage(currentPanelStudent.id).toFixed(2)}/100\n🏅 Mention: ${getMention(getStudentAverage(currentPanelStudent.id)).text}\n📅 ${currentYear}`;
                window.open(
                    `https://wa.me/${currentPanelStudent.telephone.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(msg)}`,
                    '_blank');
                showToast('WhatsApp ouvert pour ' + currentPanelStudent.nom, 'success');
                closePanel();
            }
        }

        function panelSendEmail() { if (currentPanelStudent) { showToast('Email envoyé à ' + currentPanelStudent.nom,
                'success');
                closePanel(); } }

        function panelArchive() { if (currentPanelStudent) { archiveStudent(currentPanelStudent.id);
                closePanel(); } }

        function openEditNotesModal(etudiantId) {
            currentEditStudent = etudiants.find(e => e.id === etudiantId);
            if (!currentEditStudent) return;
            document.getElementById('editStudentName').textContent = currentEditStudent.nom;
            const classEvals = evaluations.filter(ev => ev.annee === currentYear && ev.classe === currentClass);
            let html = '<div style="max-height:55vh;overflow-y:auto;-webkit-overflow-scrolling:touch">';
            matieres.forEach(mat => {
                const matEvals = classEvals.filter(ev => ev.matiere === mat);
                if (matEvals.length > 0) {
                    const shortMat = mat.length > 32 ? mat.substring(0, 30) + '...' : mat;
                    html +=
                        `<h4 style="margin-top:10px;color:var(--blue-dark);font-size:0.82rem"><i class="fas fa-book"></i> ${shortMat}</h4>`;
                    matEvals.forEach(ev => {
                        const key = `${etudiantId}_${ev.id}`;
                        const val = notes[key] !== undefined && notes[key] !== null ? notes[key] : '';
                        html += `
                <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border-light);flex-wrap:wrap">
                  <span style="flex:1;font-size:0.75rem;min-width:110px">${ev.type} (coef ${ev.coef})</span>
                  <span style="font-size:0.7rem;color:var(--muted);min-width:80px">${ev.date}</span>
                  <input type="number" class="note-edit-input" data-eval="${ev.id}" value="${val}" min="0" max="100" step="0.5" style="width:60px;padding:7px;border:2px solid var(--input-border);border-radius:var(--radius-xs);text-align:center;font-family:Inter,sans-serif;font-size:0.8rem" inputmode="decimal">
                  <span style="font-size:0.7rem;color:var(--muted)">/100</span>
                </div>`;
                    });
                }
            });
            html += '</div>';
            document.getElementById('editNotesBody').innerHTML = html;
            document.getElementById('editNotesModal').classList.add('open');
        }

        function closeEditNotesModal() { document.getElementById('editNotesModal').classList.remove('open');
            currentEditStudent = null; }

        async function saveEditedNotes() { if (!currentEditStudent) return; const student = currentEditStudent; try { for (const input of document.querySelectorAll('.note-edit-input')) { if (input.value === '') continue; const value = Number(input.value); const evaluation = evaluations.find(item => String(item.id) === input.dataset.eval); if (!evaluation || Number.isNaN(value) || value < 0 || value > 100) throw new Error('NOTE_INVALIDE'); await persistNote(student.id, evaluation.matiere, value, new Date().toISOString().slice(0, 10)); } closeEditNotesModal(); renderTable(); showToast(`Notes de ${student.nom} enregistrées.`, 'success'); } catch (error) { showToast(error.message === 'CONFLIT_NOTE' ? 'Conflit détecté : arbitrage administrateur requis.' : 'Une note est invalide ou n’a pas pu être enregistrée.', 'error'); } }

        function archiveStudent(etudiantId) {
            const et = etudiants.find(e => e.id === etudiantId);
            if (!et) return;
            document.getElementById('confirmTitle').textContent = 'Archiver ?';
            document.getElementById('confirmMessage').textContent =
                `Archiver ${et.nom} ? Ses notes seront conservées.`;
            document.getElementById('confirmYes').onclick = function() { et.annee = currentYear + ' (Archivé)';
                closeConfirmModal();
                renderTable();
                showToast(et.nom + ' archivé', 'success'); };
            document.getElementById('confirmModal').classList.add('open');
        }

        function generateBulletin(etudiantId) {
            const et = etudiants.find(e => e.id === etudiantId);
            if (!et) return;
            const avg = getStudentAverage(etudiantId);
            const rank = getClassRank(etudiantId);
            const mention = getMention(avg);
            const filtered = getFilteredEtudiants();
            const classEvals = evaluations.filter(ev => ev.annee === currentYear && ev.classe === currentClass);
            const win = window.open('', '_blank', 'width=850,height=950');
            win.document.write(`<html><head><title>Bulletin - ${et.nom} | CEJEC</title>
            <style>
              *{margin:0;padding:0;box-sizing:border-box}body{font-family:Georgia,serif;padding:35px;max-width:780px;margin:auto;color:#1a1f2b;font-size:14px}.header{text-align:center;border-bottom:3px solid #0A4D8C;padding-bottom:18px;margin-bottom:22px}.header .logo{font-size:2rem;font-weight:800;color:#0A4D8C}.header h1{font-size:1.3rem;color:#073864;margin:5px 0}.header p{font-size:.75rem;color:#5b6675;margin:3px 0}.info{display:flex;justify-content:space-between;margin-bottom:18px;padding:14px;background:#f4f8fd;border-radius:8px;flex-wrap:wrap;gap:10px;font-size:.78rem}table{width:100%;border-collapse:collapse;margin:14px 0;font-size:.72rem}th{background:#0A4D8C;color:white;padding:9px 8px;text-align:left;font-size:.68rem}td{padding:7px;border-bottom:1px solid #e5ebf2}.summary{display:flex;justify-content:space-around;padding:14px;background:#f0f7ff;border-radius:8px;flex-wrap:wrap;gap:10px}.summary-item{text-align:center}.summary-item .label{font-size:.68rem;color:#5b6675}.summary-item .value{font-size:1.4rem;font-weight:800;color:#0A4D8C}.footer{margin-top:30px;display:flex;justify-content:space-between;font-size:.68rem;border-top:1px solid #e5ebf2;padding-top:18px;flex-wrap:wrap;gap:18px}.signature{text-align:center}.signature-line{margin-top:40px;border-top:1px solid #1a1f2b;width:160px;margin-left:auto;margin-right:auto}@media print{body{padding:18px}}</style></head><body>
            <div class="header"><div class="logo">🏫 CEJEC</div><h1>BULLETIN DE NOTES</h1><p>Année : ${currentYear} | Classe : ${currentClass}</p><p>Émis le ${new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}</p></div>
            <div class="info"><div><strong>Élève :</strong> ${et.nom}</div><div><strong>Matricule :</strong> ${et.matricule}</div><div><strong>Tél :</strong> ${et.telephone}</div></div>
            <table><thead><tr><th>Matière</th><th>Coef</th><th>Moy.</th><th>Appréciation</th></tr></thead><tbody>
            ${matieres.map(mat=>{const mAvg=getMatiereAverage(etudiantId,mat);const m=mAvg!==null?getMention(mAvg):{text:'-',class:''};const totalCoef=classEvals.filter(ev=>ev.matiere===mat).reduce((s,ev)=>s+ev.coef,0);return `<tr><td>${mat}</td><td style="text-align:center">${totalCoef}</td><td style="text-align:center;font-weight:700">${mAvg!==null?mAvg.toFixed(1):'-'}/100</td><td>${m.text}</td></tr>`;}).join('')}
            </tbody></table>
            <div class="summary"><div class="summary-item"><div class="label">Moyenne</div><div class="value">${avg.toFixed(2)}/100</div></div><div class="summary-item"><div class="label">Rang</div><div class="value">${rank}/${filtered.length}</div></div><div class="summary-item"><div class="label">Mention</div><div class="value" style="color:#065f46">${mention.text}</div></div></div>
            <div class="footer"><div class="signature"><div class="signature-line"></div>Professeur</div><div class="signature"><div class="signature-line"></div>Direction</div><div class="signature"><div class="signature-line"></div>Parent/Tuteur</div></div>
            <p style="text-align:center;margin-top:18px;font-size:.6rem;color:#8b95a5">CEJEC ERP · Document officiel</p></body></html>`);
            win.document.close();
            setTimeout(() => win.print(), 400);
        }

        function generateAllBulletins() { const filtered = getFilteredEtudiants(); if (filtered.length === 0) { showToast(
                    'Aucun élève', 'error'); return; }
            showToast('Génération de ' + filtered.length + ' bulletins...', 'info');
            filtered.forEach((et, i) => setTimeout(() => generateBulletin(et.id), i * 700)); }

        function printStudent(etudiantId) { generateBulletin(etudiantId); }

        function exportToCSV() {
            const filtered = getFilteredEtudiants();
            if (filtered.length === 0) { showToast('Aucune donnée à exporter', 'error'); return; }
            const classEvals = evaluations.filter(ev => ev.annee === currentYear && ev.classe === currentClass);
            let csv = '';
            csv += '═══ CEJEC ERP - EXPORT REGISTRE DES NOTES ═══\n';
            csv += `Année Académique: ${currentYear}\nClasse: ${currentClass}\n`;
            csv += `Date: ${new Date().toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'})}\n`;
            csv += `Élèves: ${filtered.length} | Notes: ${classEvals.length}\n`;
            csv += '══════════════════════════════════════════════\n\n';
            csv += 'N°;Élève;Matricule;' + matieres.join(';') + ';Moyenne;Rang;Mention;Statut\n';
            const avgsList = filtered.map(e => ({ id: e.id, avg: getStudentAverage(e.id) })).sort((a, b) => b.avg - a.avg);
            const rankMap = {};
            avgsList.forEach((a, i) => rankMap[a.id] = i + 1);
            filtered.forEach((et, idx) => {
                const row = [idx + 1, et.nom, et.matricule];
                matieres.forEach(mat => { const avg = getMatiereAverage(et.id, mat);
                    row.push(avg !== null ? avg.toFixed(1) : 'N/A'); });
                const avg = getStudentAverage(et.id);
                row.push(avg > 0 ? avg.toFixed(2) : 'N/A', rankMap[et.id] || filtered.length, getMention(avg).text,
                    avg >= 50 ? 'Admis' : 'Échec');
                csv += row.join(';') + '\n';
            });
            csv += '\n═══ STATISTIQUES ═══\n';
            const allAvgs = filtered.map(e => getStudentAverage(e.id)).filter(a => a > 0);
            if (allAvgs.length > 0) {
                csv += `Moyenne de classe: ${(allAvgs.reduce((a,b)=>a+b,0)/allAvgs.length).toFixed(2)}/100\n`;
                csv += `Taux de réussite: ${Math.round((allAvgs.filter(a=>a>=50).length/allAvgs.length)*100)}%\n`;
                csv += `Meilleure note: ${Math.max(...allAvgs)} | Note basse: ${Math.min(...allAvgs)}\n`;
            }
            csv += '\n═══ MOYENNES PAR MATIÈRE ═══\nMatière;Moyenne;Nb Notes\n';
            matieres.forEach(mat => {
                const matNotes = [];
                filtered.forEach(et => { const mAvg = getMatiereAverage(et.id, mat); if (mAvg !== null) matNotes.push(
                        mAvg); });
                csv += `${mat};${matNotes.length>0?(matNotes.reduce((a,b)=>a+b,0)/matNotes.length).toFixed(2):0};${classEvals.filter(ev=>ev.matiere===mat).length}\n`;
            });
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `CEJEC_Notes_${currentClass}_${currentYear.replace('-','_')}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('✅ Export CSV complet téléchargé', 'success');
        }

        function openYearModal() {
            document.getElementById('existingYears').innerHTML = academicyears.map(y =>
                `<span class="badge badge-blue" style="cursor:pointer;margin:3px;font-size:0.75rem" onclick="switchYear('${y}')">${y} ${y===currentYear?'✅':''}</span>`
                ).join(' ');
            document.getElementById('yearModal').classList.add('open');
        }

        function closeYearModal() { document.getElementById('yearModal').classList.remove('open'); }

        function addYear() { const input = document.getElementById('newYearInput').value.trim(); if (input && !
                academicyears.includes(input)) { academicyears.push(input);
                updateYearFilter();
                closeYearModal();
                showToast('Année ' + input + ' ajoutée', 'success'); } else if (input) { showToast(
                'Cette année existe déjà', 'error'); } }

        function switchYear(year) { currentYear = year;
            document.getElementById('filterYear').value = year;
            closeYearModal();
            renderTable();
            showToast('Année: ' + year, 'info'); }

        function updateYearFilter() { document.getElementById('filterYear').innerHTML = academicyears.map(y =>
                `<option value="${y}" ${y===currentYear?'selected':''}>${y}</option>`).join(''); }

        function openClassModal() {
            document.getElementById('existingClasses').innerHTML = classes.map(c =>
                `<span class="badge badge-purple" style="cursor:pointer;margin:3px;font-size:0.75rem" onclick="switchClass('${c}')">${c} ${c===currentClass?'✅':''}</span>`
                ).join(' ');
            document.getElementById('classModal').classList.add('open');
        }

        function closeClassModal() { document.getElementById('classModal').classList.remove('open'); }

        function addClass() { const input = document.getElementById('newClassInput').value.trim().toUpperCase(); if (
                input && !classes.includes(input)) { classes.push(input);
                updateClassFilter();
                closeClassModal();
                showToast('Classe ' + input + ' ajoutée', 'success'); } else if (input) { showToast(
                'Cette classe existe déjà', 'error'); } }

        function switchClass(cls) { currentClass = cls; refreshCurrentCourses();
            document.getElementById('filterClass').value = cls;
            closeClassModal();
            renderTable();
            showToast('Classe: ' + cls, 'info'); }

        function updateClassFilter() { document.getElementById('filterClass').innerHTML = classes.map(c =>
                `<option value="${c}" ${c===currentClass?'selected':''}>${c}</option>`).join(''); }

        function closeConfirmModal() { document.getElementById('confirmModal').classList.remove('open'); }

        function applyFilters() { const yearVal = document.getElementById('filterYear').value; const classVal = document
                .getElementById('filterClass').value; if (yearVal && yearVal !== currentYear) currentYear = yearVal; if (
                    classVal && classVal !== currentClass) { currentClass = classVal; refreshCurrentCourses(); }
            renderTable(); }

        addYear = () => showToast('Les années académiques ne sont pas encore gérées par le backend.', 'info');
        addClass = () => showToast('Créez une classe depuis la gestion des classes.', 'info');
        archiveStudent = () => showToast('L’archivage doit être effectué depuis la fiche de l’élève.', 'info');
        async function init() { try { await loadRealData(); } catch (error) { console.error('Chargement des notes impossible', error); etudiants = []; evaluations = []; matieres = []; showToast('Impossible de charger les données réelles.', 'error'); }
            updateYearFilter();
            updateClassFilter();
            renderTable();
            document.querySelectorAll('.modal-overlay').forEach(overlay => { overlay.addEventListener('click',
                    function(e) { if (e.target === this) this.classList.remove('open'); }); });
            document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { document.querySelectorAll(
                        '.modal-overlay.open').forEach(m => m.classList.remove('open'));
                    closePanel(); } });
            let resizeTimeout;
            window.addEventListener('resize', () => { clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => { if (chartInstances['bar']) chartInstances['bar'].resize(); if (
                        chartInstances['pie']) chartInstances['pie'].resize(); }, 250); }); }
        init();
