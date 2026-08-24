    (function() {
      // ----- DATA -----
      let etudiantsListe = [
        { id: 'ETU-001', nom: 'Pierre Antoine', sexe: 'M', cours: 'Entrepreneuriat', statut: 'Actif', moyenne: 92, presences: 95, solde: 0, nouvelInscrit: false },
        { id: 'ETU-002', nom: 'Marie Joseph', sexe: 'F', cours: 'Marketing', statut: 'Actif', moyenne: 78, presences: 88, solde: 15000, nouvelInscrit: false },
        { id: 'ETU-003', nom: 'Jameson Pierre', sexe: 'M', cours: 'Leadership', statut: 'Actif', moyenne: 65, presences: 72, solde: 5000, nouvelInscrit: false },
        { id: 'ETU-004', nom: 'Mireille Dumont', sexe: 'F', cours: 'Entrepreneuriat', statut: 'Diplômé', moyenne: 95, presences: 98, solde: 0, nouvelInscrit: false },
        { id: 'ETU-005', nom: 'Frantz Louis', sexe: 'M', cours: 'Droit des Affaires', statut: 'Suspendu', moyenne: 45, presences: 30, solde: 25000, nouvelInscrit: false },
        { id: 'ETU-006', nom: 'Sophie Laurent', sexe: 'F', cours: 'Marketing', statut: 'Actif', moyenne: 88, presences: 94, solde: 0, nouvelInscrit: true },
        { id: 'ETU-007', nom: 'Jean Baptiste', sexe: 'M', cours: 'Leadership', statut: 'Diplômé', moyenne: 91, presences: 96, solde: 0, nouvelInscrit: false },
        { id: 'ETU-008', nom: 'Rose Michel', sexe: 'F', cours: 'Entrepreneuriat', statut: 'Actif', moyenne: 85, presences: 90, solde: 8000, nouvelInscrit: false },
        { id: 'ETU-009', nom: 'Marc Arthur', sexe: 'M', cours: 'GRH', statut: 'Actif', moyenne: 72, presences: 80, solde: 12000, nouvelInscrit: true },
        { id: 'ETU-010', nom: 'Nathalie Pierre', sexe: 'F', cours: 'Marketing', statut: 'Diplômé', moyenne: 94, presences: 97, solde: 0, nouvelInscrit: false },
        { id: 'ETU-011', nom: 'David Marcelin', sexe: 'M', cours: "Plan d'Affaires", statut: 'Actif', moyenne: 81, presences: 89, solde: 0, nouvelInscrit: true },
        { id: 'ETU-012', nom: 'Chantal Bijou', sexe: 'F', cours: 'Art Oratoire', statut: 'Actif', moyenne: 76, presences: 85, solde: 22000, nouvelInscrit: false }
      ];

      let coursCEJEC = ['Entrepreneuriat', "Plan d'Affaires", 'Sociologie des Affaires', 'Éducation Technologique', 'Développement Personnel', 'Marketing', 'Droit des Affaires', 'Lois du Succès', 'GRH', 'Leadership', 'Correspondance Admin', 'Art Oratoire'];
      let coursStats = coursCEJEC.map(c => ({ nom: c, etudiants: 0, reussite: 0, abandon: 0 }));
      let partenaires = [
        { nom: 'Digicel', type: 'Technologie', contrats: 3, stages: 12 },
        { nom: 'Banque Nationale', type: 'Finance', contrats: 2, stages: 8 },
        { nom: 'Fondation Espoir', type: 'ONG', contrats: 1, stages: 5 },
        { nom: 'Université Quisqueya', type: 'Éducation', contrats: 2, stages: 10 },
        { nom: 'BRANA', type: 'Industrie', contrats: 1, stages: 6 }
      ];
      let evenements = [
        { nom: 'Journée Portes Ouvertes', date: '15/06/2026', participants: 250, cout: 50000, retombees: 'Élevées' },
        { nom: 'Conférence Entrepreneuriat', date: '22/06/2026', participants: 150, cout: 35000, retombees: 'Moyennes' },
        { nom: 'Cérémonie de Remise Diplômes', date: '30/06/2026', participants: 400, cout: 120000, retombees: 'Très Élevées' },
        { nom: 'Atelier Leadership', date: '05/07/2026', participants: 80, cout: 25000, retombees: 'Bonnes' }
      ];
      let employesRH = [
        { nom: 'Jean-Marc Dubois', fonction: 'Administrateur', presences: 22, absences: 0, conges: 2, salaire: 95000 },
        { nom: 'Jacques Mentor', fonction: 'Professeur', presences: 20, absences: 1, conges: 3, salaire: 75000 },
        { nom: 'Marie Louis', fonction: 'Secrétaire', presences: 21, absences: 0, conges: 1, salaire: 65000 },
        { nom: 'Carline Étienne', fonction: 'Comptable', presences: 22, absences: 0, conges: 0, salaire: 70000 },
        { nom: 'Rose Michel', fonction: 'Professeur', presences: 19, absences: 2, conges: 1, salaire: 72000 }
      ];

      let currentPage = 'academique';
      let currentFilter = 'mois';
      let chartInstances = {};
      let invoices = [];
      let payments = [];

      const reportList = data => Array.isArray(data) ? data : (data.results || []);
      async function reportApi(path) {
        const token = localStorage.getItem('authToken');
        const response = await fetch('https://gestion-scolaire-backend.onrender.com/api/v1' + path, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
        if (!response.ok) throw new Error('API_ERROR_' + response.status);
        return response.json();
      }
      function courseStat(course) {
        const enrolled = Number(course.seats_taken || 0);
        return { nom: course.name, etudiants: enrolled, reussite: 0, abandon: 0 };
      }
      function monthlyAmounts(items, dateField) {
        const buckets = new Map();
        items.forEach(item => { const date = item[dateField]; if (!date) return; const key = date.slice(0, 7); buckets.set(key, (buckets.get(key) || 0) + Number(item.amount || 0)); });
        return [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6);
      }
      function financialSeries() {
        const revenue = monthlyAmounts(payments.filter(payment => payment.status === 'completed'), 'paid_at');
        return { labels: revenue.map(([month]) => month), revenus: revenue.map(([, amount]) => amount), depenses: revenue.map(() => 0) };
      }
      async function loadReportData() {
        try {
          const [studentsData, coursesData, teachersData, invoicesData, paymentsData, companiesData, eventsData, internshipsData] = await Promise.all([
            reportApi('/students/students/'), reportApi('/courses/'), reportApi('/teachers/'), reportApi('/finance/invoices/'), reportApi('/finance/payments/'), reportApi('/projects/companies/'), reportApi('/events/events/'), reportApi('/projects/internships/')
          ]);
          const students = reportList(studentsData);
          const courses = reportList(coursesData);
          invoices = reportList(invoicesData); payments = reportList(paymentsData);
          const invoicesByStudent = new Map(invoices.map(invoice => [String(invoice.student), invoice]));
          etudiantsListe = students.map(student => { const invoice = invoicesByStudent.get(String(student.id)); return { id: student.registration_number || student.id, nom: student.full_name, sexe: '—', cours: student.school_class_name || student.specialization_name || '—', statut: student.status, moyenne: 0, presences: 0, solde: Number(invoice ? invoice.balance_due : 0), nouvelInscrit: false }; });
          coursCEJEC = courses.map(course => course.name); coursStats = courses.map(courseStat);
          employesRH = reportList(teachersData).map(teacher => ({ nom: teacher.full_name, fonction: 'Professeur', presences: 0, absences: 0, conges: 0, salaire: 0 }));
          const internships = reportList(internshipsData);
          partenaires = reportList(companiesData).map(company => ({ nom: company.name, type: company.sector || '—', contrats: 0, stages: internships.filter(internship => internship.company === company.id).length }));
          evenements = reportList(eventsData).map(event => ({ nom: event.name, date: event.start_datetime ? new Date(event.start_datetime).toLocaleDateString('fr-FR') : '—', participants: event.confirmed_participants_count || 0, cout: 0, retombees: event.status }));
          renderPage(currentPage);
        } catch (error) { showToast('Chargement des rapports impossible : ' + error.message, 'error'); }
      }

      // ----- TOAST SYSTEM -----
      function showToast(msg, type = 'success') {
        const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warning: 'fa-exclamation-triangle' };
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${msg}`;
        document.getElementById('toastContainer').appendChild(el);
        setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100px)'; el.style.transition = 'all .3s'; setTimeout(() => el.remove(), 300); }, 3000);
      }

      // ----- DATE FILTER -----
      function initDateFilter() {
        const trigger = document.getElementById('dateTrigger');
        const dropdown = document.getElementById('dateDropdown');
        const display = document.getElementById('selectedDisplay');
        if (!trigger || !dropdown) return;
        trigger.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); });
        dropdown.querySelectorAll('.option-item').forEach(item => {
          item.addEventListener('click', function(e) {
            e.stopPropagation();
            const value = this.dataset.value;
            currentFilter = value;
            dropdown.querySelectorAll('.option-item').forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            if (!this.querySelector('.check-icon')) { const icon = document.createElement('i'); icon.className = 'fas fa-check check-icon'; this.prepend(icon); }
            const texts = { semaine: 'Cette semaine', mois: 'Ce mois-ci', trimestre: 'Ce trimestre', annee: 'Cette année' };
            display.textContent = texts[value] || 'Ce mois-ci';
            dropdown.classList.remove('show');
            refreshAll();
            showToast(`Filtre appliqué : ${texts[value]}`, 'info');
          });
        });
        document.addEventListener('click', () => dropdown.classList.remove('show'));
      }

      // ----- GLOBAL EXPORT (6 SECTIONS) -----
      document.addEventListener('click', function(e) {
        const btn = document.getElementById('exportBtn');
        const dd = document.getElementById('exportDropdown');
        if (btn && btn.contains(e.target)) { dd.classList.toggle('show'); } else if (dd && !dd.contains(e.target)) { dd.classList.remove('show'); }
      });
      document.getElementById('exportDropdown')?.addEventListener('click', function(e) {
        const item = e.target.closest('.dropdown-item');
        if (item) {
          const format = item.getAttribute('data-format');
          if (format === 'pdf') exportFullPDF();
          else if (format === 'excel') exportFullExcel();
          this.classList.remove('show');
        }
      });

      // Définition des 6 sections pour l'export global
      function getSectionsData() {
        const sections = [];
        // Section 1: Académique
        const acadRows = etudiantsListe.map(e => [
          e.id, e.nom + (e.nouvelInscrit ? ' (Nouveau)' : ''), e.sexe, e.cours, e.statut,
          e.moyenne + '%', e.presences + '%', (e.solde || 0) > 0 ? (e.solde).toLocaleString() + ' HTG' : 'Soldé'
        ]);
        sections.push({
          title: 'Registre Académique',
          headers: ['Matricule', 'Nom complet', 'Sexe', 'Cours', 'Statut', 'Moyenne', 'Présences', 'Solde'],
          rows: acadRows
        });
        // Section 2: Financier
        const revenusMensuels = [185000, 220000, 250000, 280000, 300000, 285000];
        const depensesMensuels = [120000, 140000, 155000, 170000, 180000, 175000];
        const mois = ['Septembre', 'Octobre', 'Novembre', 'Décembre', 'Janvier', 'Février'];
        const finRows = revenusMensuels.map((r, i) => [
          mois[i] + ' 2025', r.toLocaleString() + ' HTG', depensesMensuels[i].toLocaleString() + ' HTG',
          (r - depensesMensuels[i]).toLocaleString() + ' HTG', Math.round((r - depensesMensuels[i]) / r * 100) + '%'
        ]);
        sections.push({
          title: 'Détail Financier',
          headers: ['Mois', 'Revenus', 'Dépenses', 'Bénéfices', 'Marge'],
          rows: finRows
        });
        // Section 3: RH
        const rhRows = employesRH.map(e => [
          e.nom, e.fonction, e.presences + 'j', e.absences + 'j', e.conges + 'j', e.salaire.toLocaleString() + ' HTG'
        ]);
        sections.push({
          title: 'Rapport RH',
          headers: ['Employé', 'Fonction', 'Présences', 'Absences', 'Congés', 'Salaire'],
          rows: rhRows
        });
        // Section 4: Formations
        const formRows = coursStats.map(c => [c.nom, c.etudiants.toString(), c.reussite + '%', c.abandon + '%']);
        sections.push({
          title: 'Formations CEJEC',
          headers: ['Cours', 'Étudiants', 'Réussite', 'Abandon'],
          rows: formRows
        });
        // Section 5: Partenariats
        const partRows = partenaires.map(p => [p.nom, p.type, p.contrats.toString(), p.stages.toString()]);
        sections.push({
          title: 'Partenariats',
          headers: ['Partenaire', 'Type', 'Contrats', 'Stages'],
          rows: partRows
        });
        // Section 6: Événements
        const evRows = evenements.map(ev => [ev.nom, ev.date, ev.participants.toString(), ev.cout.toLocaleString() + ' HTG', ev.retombees]);
        sections.push({
          title: 'Événements',
          headers: ['Nom', 'Date', 'Participants', 'Coût', 'Retombées'],
          rows: evRows
        });
        return sections;
      }

      function exportFullPDF() {
        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
          const sections = getSectionsData();
          sections.forEach((section, index) => {
            if (index > 0) doc.addPage();
            doc.setFontSize(16);
            doc.setTextColor(10, 77, 140);
            doc.text('CEJEC - ' + section.title, 14, 15);
            doc.setFontSize(9);
            doc.setTextColor(90, 100, 110);
            doc.text('Rapport exporté le ' + new Date().toLocaleDateString('fr-FR'), 14, 22);
            doc.autoTable({
              head: [section.headers],
              body: section.rows,
              startY: 28,
              theme: 'grid',
              styles: { fontSize: 8, cellPadding: 3 },
              headStyles: { fillColor: [10, 77, 140], textColor: 255, fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [244, 248, 253] }
            });
          });
          doc.save('rapport_cejec_complet_' + new Date().toISOString().split('T')[0] + '.pdf');
          showToast('PDF 6 pages exporté avec succès', 'success');
        } catch (e) {
          console.error(e);
          showToast('Erreur export PDF: ' + e.message, 'error');
        }
      }

      function exportFullExcel() {
        try {
          const wb = XLSX.utils.book_new();
          const sections = getSectionsData();
          sections.forEach((section, index) => {
            const sheetData = [section.headers, ...section.rows];
            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            const colWidths = section.headers.map((h, i) => ({ wch: Math.max(h.length + 5, ...section.rows.map(r => String(r[i] || '').length + 5)) }));
            ws['!cols'] = colWidths;
            XLSX.utils.book_append_sheet(wb, ws, section.title.substring(0, 31));
          });
          XLSX.writeFile(wb, 'rapport_cejec_complet_' + new Date().toISOString().split('T')[0] + '.xlsx');
          showToast('Excel 6 feuilles exporté avec succès', 'success');
        } catch (e) {
          console.error(e);
          showToast('Erreur export Excel: ' + e.message, 'error');
        }
      }

      function exportCurrentTablePDF() {
        try {
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
          doc.setFontSize(14);
          doc.text('Rapport CEJEC', 14, 15);
          const table = document.querySelector('table');
          if (table) { doc.autoTable({ html: table, startY: 22, theme: 'grid', styles: { fontSize: 7 }, headStyles: { fillColor: [10, 77, 140] } }); doc.save('rapport_cejec_section.pdf'); showToast('PDF exporté', 'success'); }
        } catch (e) { showToast('Erreur PDF', 'error'); }
      }
      function exportCurrentTableExcel() {
        try {
          const table = document.querySelector('table');
          if (table) { const wb = XLSX.utils.table_to_book(table); XLSX.writeFile(wb, 'rapport_cejec_section.xlsx'); showToast('Excel exporté', 'success'); }
        } catch (e) { showToast('Erreur Excel', 'error'); }
      }

      // ----- NAVIGATION -----
      document.querySelectorAll('#navRH button').forEach(btn => {
        btn.addEventListener('click', function() {
          document.querySelectorAll('#navRH button').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          currentPage = this.dataset.page;
          renderPage(currentPage);
        });
      });

      function destroyAllCharts() {
        Object.keys(chartInstances).forEach(k => { if (chartInstances[k]) try { chartInstances[k].destroy(); } catch (e) {} });
        chartInstances = {};
      }

      function renderPage(page) {
        const mc = document.getElementById('mainContent');
        destroyAllCharts();
        switch (page) {
          case 'academique': mc.innerHTML = renderAcademique(); setupSectionTabs('acadTabs'); setTimeout(initAcademiqueCharts, 200); break;
          case 'financier': mc.innerHTML = renderFinancier(); setTimeout(initFinancierCharts, 200); break;
          case 'rh': mc.innerHTML = renderRH(); break;
          case 'formations': mc.innerHTML = renderFormations(); setTimeout(initFormationsCharts, 200); break;
          case 'partenariats': mc.innerHTML = renderPartenariats(); break;
          case 'evenements': mc.innerHTML = renderEvenements(); break;
          default: mc.innerHTML = renderAcademique(); setupSectionTabs('acadTabs'); setTimeout(initAcademiqueCharts, 200);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      function setupSectionTabs(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.querySelectorAll('.section-tab').forEach(tab => {
          tab.addEventListener('click', function() {
            container.querySelectorAll('.section-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterAcademiqueTable(this.dataset.filter);
          });
        });
      }
      function filterAcademiqueTable(filter) {
        const tbody = document.getElementById('acadTbody');
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(row => {
          const statut = row.getAttribute('data-statut');
          const isNew = row.getAttribute('data-new') === 'true';
          if (filter === 'all') { row.style.display = ''; } else if (filter === 'nouveaux') { row.style.display = isNew ? '' : 'none'; } else if (filter === 'dettes') {
            const solde = parseInt(row.getAttribute('data-solde') || '0');
            row.style.display = solde > 0 ? '' : 'none';
          } else { row.style.display = statut === filter ? '' : 'none'; }
        });
      }
      window.searchTable = function(val) {
        const tbody = document.getElementById('acadTbody');
        if (!tbody) return;
        const term = val.toLowerCase();
        tbody.querySelectorAll('tr').forEach(row => { row.style.display = row.innerText.toLowerCase().includes(term) ? '' : 'none'; });
      };

      // ----- ACADEMIQUE -----
      function initAcademiqueCharts() {
        const ctx1 = document.getElementById('acadInscriptionChart');
        if (ctx1 && !chartInstances['acadInscription']) {
          chartInstances['acadInscription'] = new Chart(ctx1, {
            type: 'line', data: { labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'], datasets: [{ label: 'Inscriptions', data: [200, 250, 300, 350, 380, 420, 450, 450], borderColor: '#0A4D8C', backgroundColor: 'rgba(10,77,140,0.1)', fill: true, tension: 0.4, borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false }
          });
        }
        const ctx2 = document.getElementById('acadReussiteChart');
        if (ctx2 && !chartInstances['acadReussite']) {
          chartInstances['acadReussite'] = new Chart(ctx2, {
            type: 'line', data: { labels: ['2019', '2020', '2021', '2022', '2023', '2024'], datasets: [{ label: 'Taux réussite %', data: [75, 78, 80, 82, 85, 88], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, borderWidth: 2 }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 60, max: 100 } } }
          });
        }
      }
      function renderAcademique() {
        const nouveauxCount = etudiantsListe.filter(e => e.nouvelInscrit).length;
        const detteTotal = etudiantsListe.reduce((s, e) => s + (e.solde || 0), 0);
        const detteCount = etudiantsListe.filter(e => (e.solde || 0) > 0).length;
        let rows = etudiantsListe.map(e => `
          <tr data-statut="${e.statut}" data-new="${e.nouvelInscrit}" data-solde="${e.solde || 0}">
            <td><span class="pill pill-muted">${e.id}</span></td>
            <td class="emp-name">${e.nom} ${e.nouvelInscrit ? '<span class="pill pill-info" style="margin-left:6px;"><i class="fas fa-star"></i> Nouveau</span>' : ''}</td>
            <td>${e.sexe}</td><td>${e.cours}</td>
            <td><span class="pill ${e.statut==='Actif'?'pill-success':e.statut==='Diplômé'?'pill-info':'pill-danger'}">${e.statut}</span></td>
            <td>${e.moyenne}%</td><td>${e.presences}%</td>
            <td style="font-weight:600; color:${(e.solde||0) > 0 ? 'var(--red)' : 'var(--success)'}">${(e.solde||0) > 0 ? (e.solde).toLocaleString() + ' HTG' : 'Soldé'}</td>
          </tr>`).join('');
        return `
          <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
            <div class="stat-card"><div class="stat-info"><span>Total étudiants</span><h2>${etudiantsListe.length}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-user-graduate"></i></div></div>
            <div class="stat-card"><div class="stat-info"><span>Nouveaux inscrits</span><h2>${nouveauxCount}</h2></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-user-plus"></i></div></div>
            <div class="stat-card"><div class="stat-info"><span>Dette totale</span><h2>${detteTotal.toLocaleString()} HTG</h2></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-money-bill-wave"></i></div></div>
            <div class="stat-card"><div class="stat-info"><span>Comptes débiteurs</span><h2>${detteCount}</h2></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-exclamation-triangle"></i></div></div>
          </div>
          <div class="charts-row">
            <div class="chart-box"><h3><i class="fas fa-chart-line"></i> Évolution des inscriptions</h3><div class="chart-wrap"><canvas id="acadInscriptionChart"></canvas></div></div>
            <div class="chart-box"><h3><i class="fas fa-percent"></i> Taux de réussite par année</h3><div class="chart-wrap"><canvas id="acadReussiteChart"></canvas></div></div>
          </div>
          <div class="alert-box alert-info"><i class="fas fa-info-circle"></i> <strong>3 nouveaux étudiants</strong> inscrits cette semaine</div>
          <div class="section-tabs" id="acadTabs">
            <button class="section-tab active" data-filter="all"><i class="fas fa-list"></i> Tous</button>
            <button class="section-tab" data-filter="Actif"><i class="fas fa-check-circle"></i> Actifs</button>
            <button class="section-tab" data-filter="Diplômé"><i class="fas fa-graduation-cap"></i> Diplômés</button>
            <button class="section-tab" data-filter="Suspendu"><i class="fas fa-ban"></i> Suspendus</button>
            <button class="section-tab" data-filter="nouveaux"><i class="fas fa-star"></i> Nouveaux</button>
            <button class="section-tab" data-filter="dettes"><i class="fas fa-exclamation-circle"></i> En dette</button>
          </div>
          <div class="card">
            <div class="card-header"><h2><i class="fas fa-graduation-cap"></i> Registre Académique Complet</h2><div class="btn-group">
              <button class="btn btn-sm btn-outline" onclick="exportCurrentTablePDF()"><i class="fas fa-file-pdf"></i> PDF</button>
              <button class="btn btn-sm btn-outline" onclick="exportCurrentTableExcel()"><i class="fas fa-file-excel"></i> Excel</button>
              <button class="btn btn-sm btn-outline" onclick="window.print()"><i class="fas fa-print"></i> Imprimer</button>
            </div></div>
            <div class="search-box"><i class="fas fa-search"></i><input placeholder="Rechercher par nom, matricule ou cours..." oninput="searchTable(this.value)"></div>
            <div class="table-wrap"><table><thead><tr><th>Matricule</th><th>Nom complet</th><th>Sexe</th><th>Cours</th><th>Statut</th><th>Moyenne</th><th>Présences</th><th>Solde</th></tr></thead><tbody id="acadTbody">${rows}</tbody></table></div>
          </div>`;
      }

      // ----- RH -----
      function renderRH() {
        let rows = employesRH.map(e => `
          <tr><td class="emp-name">${e.nom}</td><td>${e.fonction}</td><td><span class="pill pill-success">${e.presences}j</span></td><td><span class="pill ${e.absences>0?'pill-danger':'pill-muted'}">${e.absences}j</span></td><td><span class="pill pill-info">${e.conges}j</span></td><td>${e.salaire.toLocaleString()} HTG</td></tr>`).join('');
        return `
          <div class="stats-grid" style="grid-template-columns:repeat(4,1fr)">
            <div class="stat-card"><div class="stat-info"><span>Personnel total</span><h2>38</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-users"></i></div></div>
            <div class="stat-card"><div class="stat-info"><span>Professeurs</span><h2>12</h2></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-chalkboard-teacher"></i></div></div>
            <div class="stat-card"><div class="stat-info"><span>Présents</span><h2>35</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>
            <div class="stat-card"><div class="stat-info"><span>Masse salariale</span><h2>950K</h2></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-money-bill-wave"></i></div></div>
          </div>
          <div class="card">
            <div class="card-header"><h2><i class="fas fa-users"></i> Rapport RH</h2><div class="btn-group">
              <button class="btn btn-sm btn-outline" onclick="exportCurrentTablePDF()">PDF</button>
              <button class="btn btn-sm btn-outline" onclick="exportCurrentTableExcel()">Excel</button>
              <button class="btn btn-sm btn-outline" onclick="window.print()">Imprimer</button>
            </div></div>
            <div class="table-wrap"><table><thead><tr><th>Employé</th><th>Fonction</th><th>Présences</th><th>Absences</th><th>Congés</th><th>Salaire</th></tr></thead><tbody>${rows}</tbody></table></div>
          </div>`;
      }

      // ----- FINANCIER -----
      function renderFinancier() {
        const series = financialSeries(); const revenusMensuels = series.revenus; const depensesMensuels = series.depenses;
        let rows = revenusMensuels.map((r, i) => `
          <tr><td>${series.labels[i]}</td><td>${r.toLocaleString()} HTG</td><td>${depensesMensuels[i].toLocaleString()} HTG</td><td style="font-weight:800;color:var(--success)">${(r-depensesMensuels[i]).toLocaleString()} HTG</td><td><span class="pill ${r ? 'pill-success' : 'pill-warning'}">${r ? Math.round((r-depensesMensuels[i])/r*100) : 0}%</span></td></tr>`).join('');
        const totalRevenus = revenusMensuels.reduce((a, b) => a + b, 0);
        const totalDepenses = depensesMensuels.reduce((a, b) => a + b, 0);
        const totalBenefices = totalRevenus - totalDepenses;
        return `
          <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)">
            <div class="stat-card"><div class="stat-info"><span>Revenus totaux</span><h2>${(totalRevenus/1000).toFixed(0)}K</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-coins"></i></div></div>
            <div class="stat-card"><div class="stat-info"><span>Dépenses</span><h2>${(totalDepenses/1000).toFixed(0)}K</h2></div><div class="stat-icon" style="color:var(--red)"><i class="fas fa-arrow-down"></i></div></div>
            <div class="stat-card"><div class="stat-info"><span>Bénéfices</span><h2>${(totalBenefices/1000).toFixed(0)}K</h2></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-chart-line"></i></div></div>
          </div>
          <div class="charts-row">
            <div class="chart-box"><h3><i class="fas fa-chart-bar"></i> Revenus mensuels</h3><div class="chart-wrap"><canvas id="finRevChart"></canvas></div></div>
            <div class="chart-box"><h3><i class="fas fa-chart-line"></i> Comparaison Revenus/Dépenses</h3><div class="chart-wrap"><canvas id="finCompChart"></canvas></div></div>
          </div>
          <div class="alert-box alert-warning"><i class="fas fa-exclamation-triangle"></i> <strong>${invoices.filter(invoice => invoice.status !== 'paid').length} facture(s) non soldée(s)</strong> — Vérifier la comptabilité</div>
          <div class="card">
            <div class="card-header"><h2><i class="fas fa-file-invoice-dollar"></i> Détail Financier</h2><div class="btn-group">
              <button class="btn btn-sm btn-outline" onclick="exportCurrentTablePDF()">PDF</button>
              <button class="btn btn-sm btn-outline" onclick="exportCurrentTableExcel()">Excel</button>
              <button class="btn btn-sm btn-outline" onclick="window.print()">Imprimer</button>
            </div></div>
            <div class="table-wrap"><table><thead><tr><th>Mois</th><th>Revenus</th><th>Dépenses</th><th>Bénéfices</th><th>Marge</th></tr></thead><tbody>${rows}</tbody></table></div>
          </div>`;
      }
      function initFinancierCharts() {
        const series = financialSeries();
        const ctx1 = document.getElementById('finRevChart');
        if (ctx1 && !chartInstances['finRev']) chartInstances['finRev'] = new Chart(ctx1, { type: 'bar', data: { labels: series.labels, datasets: [{ label: 'Revenus (HTG)', data: series.revenus, backgroundColor: 'rgba(10,77,140,0.7)', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false } });
        const ctx2 = document.getElementById('finCompChart');
        if (ctx2 && !chartInstances['finComp']) chartInstances['finComp'] = new Chart(ctx2, { type: 'line', data: { labels: series.labels, datasets: [{ label: 'Revenus', data: series.revenus, borderColor: '#10b981', borderWidth: 2, tension: 0.3 }, { label: 'Dépenses', data: series.depenses, borderColor: '#D62828', borderWidth: 2, tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false } });
      }

      // ----- FORMATIONS -----
      function renderFormations() {
        let rows = coursStats.map(c => `<tr><td class="fw-600">${c.nom}</td><td>${c.etudiants}</td><td><div style="display:flex;align-items:center;gap:8px">${c.reussite}%<div style="flex:1;height:6px;background:#e5e7eb;border-radius:10px;overflow:hidden"><div style="width:${c.reussite}%;height:100%;background:var(--success);border-radius:10px"></div></div></div></td><td><span class="pill ${c.abandon>5?'pill-danger':'pill-success'}">${c.abandon}%</span></td></tr>`).join('');
        return `
          <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)"><div class="stat-card"><div class="stat-info"><span>Cours actifs</span><h2>${coursCEJEC.length}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-book-open"></i></div></div><div class="stat-card"><div class="stat-info"><span>Taux réussite moyen</span><h2>85%</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-chart-line"></i></div></div><div class="stat-card"><div class="stat-info"><span>Taux abandon</span><h2>4.2%</h2></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-exclamation-triangle"></i></div></div></div>
          <div class="charts-row"><div class="chart-box"><h3><i class="fas fa-chart-bar"></i> Étudiants par cours</h3><div class="chart-wrap"><canvas id="coursBarChart"></canvas></div></div><div class="chart-box"><h3><i class="fas fa-percent"></i> Réussite par cours</h3><div class="chart-wrap"><canvas id="coursReussiteChart"></canvas></div></div></div>
          <div class="card"><div class="card-header"><h2><i class="fas fa-list"></i> Les 12 Cours CEJEC</h2><div class="btn-group"><button class="btn btn-sm btn-outline" onclick="exportCurrentTablePDF()">PDF</button><button class="btn btn-sm btn-outline" onclick="exportCurrentTableExcel()">Excel</button></div></div><div class="table-wrap"><table><thead><tr><th>Cours</th><th>Étudiants</th><th>Réussite</th><th>Abandon</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
      }
      function initFormationsCharts() {
        const ctx1 = document.getElementById('coursBarChart');
        if (ctx1 && !chartInstances['coursBar']) chartInstances['coursBar'] = new Chart(ctx1, { type: 'bar', data: { labels: coursCEJEC.slice(0, 8), datasets: [{ label: 'Étudiants', data: coursStats.slice(0, 8).map(c => c.etudiants), backgroundColor: 'rgba(10,77,140,0.7)', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y' } });
        const ctx2 = document.getElementById('coursReussiteChart');
        if (ctx2 && !chartInstances['coursReussite']) chartInstances['coursReussite'] = new Chart(ctx2, { type: 'bar', data: { labels: coursCEJEC.slice(0, 8), datasets: [{ label: 'Réussite %', data: coursStats.slice(0, 8).map(c => c.reussite), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 50, max: 100 } } } });
      }

      // ----- PARTENARIATS -----
      function renderPartenariats() {
        let rows = partenaires.map(p => `<tr><td class="fw-600">${p.nom}</td><td><span class="pill pill-info">${p.type}</span></td><td>${p.contrats}</td><td>${p.stages}</td></tr>`).join('');
        return `
          <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)"><div class="stat-card"><div class="stat-info"><span>Partenaires</span><h2>${partenaires.length}</h2></div><div class="stat-icon" style="color:var(--blue)"><i class="fas fa-handshake"></i></div></div><div class="stat-card"><div class="stat-info"><span>Contrats actifs</span><h2>${partenaires.reduce((s,p)=>s+p.contrats,0)}</h2></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-file-contract"></i></div></div><div class="stat-card"><div class="stat-info"><span>Stages</span><h2>${partenaires.reduce((s,p)=>s+p.stages,0)}</h2></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-briefcase"></i></div></div></div>
          <div class="card"><div class="card-header"><h2><i class="fas fa-handshake"></i> Partenariats</h2><div class="btn-group"><button class="btn btn-sm btn-outline" onclick="exportCurrentTablePDF()">PDF</button><button class="btn btn-sm btn-outline" onclick="exportCurrentTableExcel()">Excel</button></div></div><div class="table-wrap"><table><thead><tr><th>Partenaire</th><th>Type</th><th>Contrats</th><th>Stages</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
      }

      // ----- EVENEMENTS -----
      function renderEvenements() {
        let rows = evenements.map(ev => `<tr><td class="fw-600">${ev.nom}</td><td>${ev.date}</td><td>${ev.participants}</td><td>${ev.cout.toLocaleString()} HTG</td><td><span class="pill ${ev.retombees.includes('Très')?'pill-success':ev.retombees.includes('Bonnes')?'pill-info':'pill-warning'}">${ev.retombees}</span></td></tr>`).join('');
        return `
          <div class="stats-grid" style="grid-template-columns:repeat(3,1fr)"><div class="stat-card"><div class="stat-info"><span>Événements</span><h2>${evenements.length}</h2></div><div class="stat-icon" style="color:var(--purple)"><i class="fas fa-calendar-star"></i></div></div><div class="stat-card"><div class="stat-info"><span>Participants</span><h2>${evenements.reduce((s,e)=>s+e.participants,0)}</h2></div><div class="stat-icon" style="color:var(--info)"><i class="fas fa-users"></i></div></div><div class="stat-card"><div class="stat-info"><span>Budget total</span><h2>${evenements.reduce((s,e)=>s+e.cout,0).toLocaleString()}</h2></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-coins"></i></div></div></div>
          <div class="card"><div class="card-header"><h2><i class="fas fa-calendar-star"></i> Événements</h2><div class="btn-group"><button class="btn btn-sm btn-outline" onclick="exportCurrentTablePDF()">PDF</button><button class="btn btn-sm btn-outline" onclick="exportCurrentTableExcel()">Excel</button></div></div><div class="table-wrap"><table><thead><tr><th>Nom</th><th>Date</th><th>Participants</th><th>Coût</th><th>Retombées</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
      }

      async function refreshAll() { await loadReportData(); showToast('Données actualisées (filtre: ' + currentFilter + ')', 'info'); }

      // ----- INIT -----
      document.addEventListener('DOMContentLoaded', () => {
        initDateFilter();
        loadReportData();
        document.querySelector('#navRH button[data-page="academique"]').classList.add('active');
        console.log('CEJEC Rapports & Analytics prêt - Export 6 sections fonctionnel.');
      });
    })();
