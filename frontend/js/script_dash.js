        document.addEventListener("DOMContentLoaded", () => {
            
            // Configuration globale de Chart.js pour la responsivité
            Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
            Chart.defaults.color = '#64748b';
            Chart.defaults.responsive = true;
            Chart.defaults.maintainAspectRatio = false;
            
            // Configuration responsive des polices Chart.js
            const updateChartFontSize = () => {
                const width = window.innerWidth;
                let fontSize = 12;
                if (width <= 320) fontSize = 8;
                else if (width <= 360) fontSize = 9;
                else if (width <= 480) fontSize = 10;
                else if (width <= 768) fontSize = 11;
                
                Chart.defaults.font.size = fontSize;
            };
            
            updateChartFontSize();
            window.addEventListener('resize', () => {
                updateChartFontSize();
            });

            // 1. Sparklines - Mini graphiques responsives
            const createSparkline = (id, data, color) => {
                const canvas = document.getElementById(id);
                if (!canvas) return null;
                
                const ctx = canvas.getContext('2d');
                
                // Nettoyer le canvas existant
                const existingChart = Chart.getChart(canvas);
                if (existingChart) {
                    existingChart.destroy();
                }
                
                return new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: data.map((_, i) => i),
                        datasets: [{
                            data: data,
                            borderColor: color,
                            borderWidth: 2,
                            pointRadius: 0,
                            hoverRadius: 0,
                            fill: false,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false }, 
                            tooltip: { enabled: false } 
                        },
                        scales: { 
                            x: { display: false }, 
                            y: { display: false } 
                        },
                        animation: {
                            duration: 1000,
                            easing: 'easeInOutQuart'
                        }
                    }
                });
            };

            // Création des sparklines
            createSparkline('spark-1', [30, 45, 38, 55, 48, 62, 70], '#0a4d8c');
            createSparkline('spark-2', [5, 6, 6, 6, 6, 6, 6], '#073864');
            createSparkline('spark-3', [28, 29, 30, 30, 32, 34, 34], '#0a4d8c');
            createSparkline('spark-4', [40, 42, 45, 44, 48, 50, 52], '#0a4d8c');
            createSparkline('spark-5', [8000, 10000, 9000, 11000, 13000, 12000, 14250], '#10b981');
            createSparkline('spark-6', [91, 92, 92, 93, 93, 94, 94.2], '#10b981');
            createSparkline('spark-7', [90, 95, 100, 105, 110, 120, 120], '#0a4d8c');
            createSparkline('spark-8', [8, 10, 11, 13, 14, 16, 18], '#10b981');
            createSparkline('spark-9', [45, 44, 46, 43, 44, 41, 42], '#d62828');

            // 2. Graphique Mixte - Responsive
            const mixedCanvas = document.getElementById('mixedChart');
            let mixedChart = null;
            
            if (mixedCanvas) {
                const mixedCtx = mixedCanvas.getContext('2d');
                mixedChart = new Chart(mixedCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil'],
                        datasets: [
                            {
                                label: 'Nouvelles Inscriptions',
                                data: [65, 82, 74, 91, 85, 110, 125],
                                backgroundColor: 'rgba(10, 77, 140, 0.85)',
                                borderRadius: 6,
                                yAxisID: 'y',
                                maxBarThickness: 50
                            },
                            {
                                label: 'Taux de Performance (%)',
                                data: [88, 89, 91, 90, 93, 92, 94],
                                type: 'line',
                                borderColor: '#d62828',
                                borderWidth: 3,
                                fill: false,
                                tension: 0.3,
                                yAxisID: 'y1',
                                pointRadius: 4,
                                pointHoverRadius: 6
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false
                        },
                        plugins: {
                            legend: { 
                                position: 'bottom', 
                                labels: { 
                                    boxWidth: 12, 
                                    usePointStyle: true,
                                    padding: 20,
                                    font: {
                                        size: Chart.defaults.font.size
                                    }
                                } 
                            },
                            tooltip: {
                                enabled: true
                            }
                        },
                        scales: {
                            x: { 
                                grid: { display: false },
                                ticks: {
                                    font: {
                                        size: Chart.defaults.font.size
                                    }
                                }
                            },
                            y: { 
                                position: 'left', 
                                title: { 
                                    display: true, 
                                    text: 'Inscriptions',
                                    font: {
                                        size: Chart.defaults.font.size
                                    }
                                },
                                ticks: {
                                    font: {
                                        size: Chart.defaults.font.size
                                    }
                                }
                            },
                            y1: { 
                                position: 'right', 
                                min: 70, 
                                max: 100, 
                                title: { 
                                    display: true, 
                                    text: 'Pourcentage',
                                    font: {
                                        size: Chart.defaults.font.size
                                    }
                                }, 
                                grid: { display: false },
                                ticks: {
                                    font: {
                                        size: Chart.defaults.font.size
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // 3. Graphique Donut - Responsive
            const donutCanvas = document.getElementById('donutChart');
            let donutChart = null;
            
            if (donutCanvas) {
                const donutCtx = donutCanvas.getContext('2d');
                donutChart = new Chart(donutCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Sciences Comptables', 'Entrepreneuriat', 'Gestion des Affaires', 'Informatique Pro'],
                        datasets: [{
                            data: [40, 30, 20, 10],
                            backgroundColor: ['#0a4d8c', '#073864', '#e8f1fa', '#d62828'],
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { 
                                position: 'bottom', 
                                labels: { 
                                    padding: 15, 
                                    boxWidth: 10, 
                                    usePointStyle: true,
                                    font: {
                                        size: Chart.defaults.font.size
                                    }
                                } 
                            }
                        },
                        cutout: '75%'
                    }
                });
            }

            // 4. Graphique Présences - Responsive
            const attendanceCanvas = document.getElementById('attendanceChart');
            let attendanceChart = null;
            
            if (attendanceCanvas) {
                const attendanceCtx = attendanceCanvas.getContext('2d');
                attendanceChart = new Chart(attendanceCtx, {
                    type: 'line',
                    data: {
                        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
                        datasets: [{
                            label: 'Présence effective (%)',
                            data: [94, 96, 95, 93, 91, 88],
                            borderColor: '#0a4d8c',
                            backgroundColor: 'rgba(10, 77, 140, 0.06)',
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2.5,
                            pointRadius: 4,
                            pointHoverRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false } 
                        },
                        scales: {
                            x: { 
                                grid: { display: false },
                                ticks: {
                                    font: {
                                        size: Chart.defaults.font.size
                                    }
                                }
                            },
                            y: { 
                                min: 80, 
                                max: 100,
                                ticks: {
                                    font: {
                                        size: Chart.defaults.font.size
                                    },
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            // ============================================
            // BASE DE DONNÉES DES ÉVÉNEMENTS
            // ============================================
            const eventsDatabase = [
                {
                    id: 1,
                    title: 'Soutenance de Projet',
                    start: '2026-06-15',
                    end: '2026-06-15',
                    allDay: true,
                    backgroundColor: '#0a4d8c',
                    borderColor: '#0a4d8c',
                    description: 'Présentation des projets de fin d\'études devant le jury académique.',
                    time: 'Toute la journée',
                    icon: 'fa-solid fa-presentation-screen',
                    location: 'Salle de Conférence A',
                    participants: 'Tous les étudiants de dernière année'
                },
                {
                    id: 2,
                    title: 'Séminaire Stratégique',
                    start: '2026-06-18',
                    end: '2026-06-20',
                    allDay: true,
                    backgroundColor: '#073864',
                    borderColor: '#073864',
                    description: 'Séminaire de planification stratégique pour l\'année académique 2026-2027.',
                    time: 'Du 18 au 20 juin',
                    icon: 'fa-solid fa-people-arrows',
                    location: 'Hôtel Montana',
                    participants: 'Direction et corps professoral'
                },
                {
                    id: 3,
                    title: 'Examens Mi-Session',
                    start: '2026-06-24',
                    end: '2026-06-24',
                    allDay: true,
                    backgroundColor: '#d62828',
                    borderColor: '#d62828',
                    description: 'Examens de mi-session pour toutes les promotions. Vérifiez votre horaire.',
                    time: '8:00 - 16:00',
                    icon: 'fa-solid fa-file-pen',
                    location: 'Toutes les salles de classe',
                    participants: 'Tous les étudiants'
                },
                {
                    id: 4,
                    title: 'Remise de Diplômes',
                    start: '2026-06-30',
                    end: '2026-06-30',
                    allDay: true,
                    backgroundColor: '#10b981',
                    borderColor: '#10b981',
                    description: 'Cérémonie officielle de remise des diplômes pour la promotion sortante.',
                    time: '10:00 - 14:00',
                    icon: 'fa-solid fa-graduation-cap',
                    location: 'Auditorium Principal',
                    participants: 'Étudiants, familles et invités'
                },
                {
                    id: 5,
                    title: 'Atelier Entrepreneuriat',
                    start: '2026-06-16',
                    end: '2026-06-16',
                    allDay: false,
                    backgroundColor: '#8b5cf6',
                    borderColor: '#8b5cf6',
                    description: 'Atelier pratique sur la création d\'entreprise et le business plan.',
                    time: '14:00 - 17:00',
                    icon: 'fa-solid fa-lightbulb',
                    location: 'Salle Incubateur',
                    participants: 'Étudiants entrepreneurs'
                },
                {
                    id: 6,
                    title: 'Conférence Innovation',
                    start: '2026-06-22',
                    end: '2026-06-22',
                    allDay: false,
                    backgroundColor: '#f59e0b',
                    borderColor: '#f59e0b',
                    description: 'Conférence sur l\'innovation technologique dans les pays en développement.',
                    time: '9:00 - 12:00',
                    icon: 'fa-solid fa-microchip',
                    location: 'Amphithéâtre B',
                    participants: 'Ouvert au public'
                },
                {
                    id: 7,
                    title: 'Réunion Pédagogique',
                    start: '2026-06-25',
                    end: '2026-06-25',
                    allDay: false,
                    backgroundColor: '#06b6d4',
                    borderColor: '#06b6d4',
                    description: 'Réunion mensuelle du corps professoral pour le suivi pédagogique.',
                    time: '13:00 - 15:00',
                    icon: 'fa-solid fa-chalkboard-user',
                    location: 'Salle des Professeurs',
                    participants: 'Corps professoral'
                }
            ];

            // ============================================
            // FONCTIONS DU MODAL AVEC REDIRECTION
            // ============================================
            const modalOverlay = document.getElementById('eventModal');
            const modalDateTitle = document.getElementById('modalDateTitle');
            const modalBody = document.getElementById('modalBody');
            const closeModalBtn = document.getElementById('closeModalBtn');
            const closeModalFooterBtn = document.getElementById('closeModalFooterBtn');
            const addEventBtn = document.getElementById('addEventBtn');

            // Formater la date en français
            function formatDateFrench(dateStr) {
                const date = new Date(dateStr + 'T00:00:00');
                const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                return date.toLocaleDateString('fr-FR', options);
            }

            // Obtenir les événements d'une date spécifique
            function getEventsForDate(dateStr) {
                return eventsDatabase.filter(event => {
                    const eventStart = new Date(event.start + 'T00:00:00');
                    const eventEnd = new Date(event.end + 'T00:00:00');
                    const targetDate = new Date(dateStr + 'T00:00:00');
                    return targetDate >= eventStart && targetDate <= eventEnd;
                });
            }

            // Rediriger vers la page de détail de l'événement
            function redirectToEventDetail(eventId) {
                // Redirection vers la page incubateur_calendrier.html avec l'ID de l'événement
                window.location.href = 'incubateur_calendrier.html#event-' + eventId;
            }

            // Ouvrir le modal avec les événements
            function openEventModal(dateStr) {
                const events = getEventsForDate(dateStr);
                const formattedDate = formatDateFrench(dateStr);
                
                modalDateTitle.textContent = formattedDate;
                
                if (events.length === 0) {
                    modalBody.innerHTML = `
                        <div class="modal-date-info">
                            <i class="fa-regular fa-calendar"></i>
                            <span>${formattedDate}</span>
                        </div>
                        <div class="no-events">
                            <i class="fa-regular fa-calendar-xmark"></i>
                            <p>Aucun événement prévu pour cette date.</p>
                            <p style="font-size: 0.8125rem; margin-top: 0.25rem; color: var(--muted);">
                                Cliquez sur "Nouvel événement" pour en ajouter un.
                            </p>
                        </div>
                    `;
                } else {
                    let eventsHTML = `
                        <div class="modal-date-info">
                            <i class="fa-regular fa-calendar"></i>
                            <span>${formattedDate} · ${events.length} événement(s)</span>
                        </div>
                        <div class="event-list">
                    `;
                    
                    events.forEach(event => {
                        const iconClass = event.icon || 'fa-regular fa-calendar-check';
                        eventsHTML += `
                            <div class="event-item" onclick="window.location.href='incubateur_calendrier.html#event-${event.id}'" 
                                 title="Cliquez pour voir les détails de : ${event.title}"
                                 role="button" tabindex="0" 
                                 onkeydown="if(event.key==='Enter')window.location.href='incubateur_calendrier.html#event-${event.id}'">
                                <div class="event-color-dot" style="background-color: ${event.backgroundColor};" aria-hidden="true"></div>
                                <div class="event-content">
                                    <h4><i class="${iconClass}" style="color: ${event.backgroundColor};"></i> ${event.title}</h4>
                                    <div class="event-time">
                                        <i class="fa-regular fa-clock"></i> ${event.time}
                                    </div>
                                    ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                                </div>
                                <i class="fa-solid fa-arrow-right event-link-icon" aria-hidden="true"></i>
                            </div>
                        `;
                    });
                    
                    eventsHTML += '</div>';
                    modalBody.innerHTML = eventsHTML;
                }
                
                modalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
                closeModalBtn.focus();
            }

            // Fermer le modal
            function closeEventModal() {
                modalOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }

            // Écouteurs pour fermer le modal
            closeModalBtn.addEventListener('click', closeEventModal);
            closeModalFooterBtn.addEventListener('click', closeEventModal);
            
            modalOverlay.addEventListener('click', function(e) {
                if (e.target === modalOverlay) {
                    closeEventModal();
                }
            });

            // Bouton "Nouvel événement"
            addEventBtn.addEventListener('click', function() {
                // Rediriger vers la page du calendrier avec ancre pour nouvel événement
                window.location.href = 'incubateur_calendrier.html#nouvel-evenement';
            });

            // Touche Échap
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
                    closeEventModal();
                }
            });

            // ============================================
            // INITIALISATION FULLCALENDAR
            // ============================================
            const calendarEl = document.getElementById('fullCalendar');
            if (calendarEl) {
                const calendar = new FullCalendar.Calendar(calendarEl, {
                    initialView: 'dayGridMonth',
                    locale: 'fr',
                    headerToolbar: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek'
                    },
                    buttonText: {
                        today: 'Aujourd\'hui',
                        month: 'Mois',
                        week: 'Semaine'
                    },
                    events: eventsDatabase,
                    height: 'auto',
                    contentHeight: 'auto',
                    selectable: true,
                    selectMirror: true,
                    dayMaxEvents: window.innerWidth <= 480 ? 1 : 2,
                    dateClick: function(info) {
                        openEventModal(info.dateStr);
                    },
                    eventClick: function(info) {
                        const eventId = parseInt(info.event.id);
                        if (eventId) {
                            // Redirection vers la page incubateur_calendrier.html avec ancre
                            window.location.href = 'incubateur_calendrier.html#rendercalendrier-' + eventId;
                        }
                    },
                    windowResize: function() {
                        this.setOption('dayMaxEvents', window.innerWidth <= 480 ? 1 : 2);
                    }
                });
                calendar.render();
            }

            // ============================================
            // GESTION DU REDIMENSIONNEMENT
            // ============================================
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    updateChartFontSize();
                    
                    // Mettre à jour les graphiques
                    [mixedChart, donutChart, attendanceChart].forEach(chart => {
                        if (chart && chart.resize) {
                            chart.resize();
                        }
                    });
                }, 250);
            });

            console.log('✅ Dashboard CEJEC 100% responsive initialisé');
            console.log('📊 Graphiques Chart.js responsives');
            console.log('📅 Calendrier interactif - Redirection vers incubateur_calendrier.html');
            console.log('📱 Optimisé de 320px à 4K');
            console.log('🔗 Titre cliquable avec href="incubateur_calendrier.html"');

        });