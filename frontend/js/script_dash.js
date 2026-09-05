document.addEventListener("DOMContentLoaded", async () => {
            
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

            // Aucun chiffre de démonstration : les séries sont remplies après
            // le chargement de /dashboard/stats/.
            document.querySelectorAll('.kpi-value').forEach(el => { el.textContent = '—'; });
            createSparkline('spark-1', [], '#0a4d8c');
            createSparkline('spark-3', [], '#0a4d8c');
            createSparkline('spark-4', [], '#0a4d8c');
            createSparkline('spark-5', [], '#10b981');
            createSparkline('spark-6', [], '#10b981');
            createSparkline('spark-8', [], '#10b981');
            createSparkline('spark-9', [], '#d62828');

            // 2. Graphique Mixte - Responsive
            const mixedCanvas = document.getElementById('mixedChart');
            let mixedChart = null;
            
            if (mixedCanvas) {
                const mixedCtx = mixedCanvas.getContext('2d');
                mixedChart = new Chart(mixedCtx, {
                    type: 'bar',
                    data: {
                        labels: [],
                        datasets: [
                            {
                                label: 'Nouvelles Inscriptions',
                                data: [],
                                backgroundColor: 'rgba(10, 77, 140, 0.85)',
                                borderRadius: 6,
                                yAxisID: 'y',
                                maxBarThickness: 50
                            },
                            {
                                label: 'Taux de Performance (%)',
                                data: [],
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
                                min: 0,
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
                        labels: [],
                        datasets: [{
                            data: [],
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
                        labels: [],
                        datasets: [{
                            label: 'Présence effective (%)',
                            data: [],
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
                                min: 0,
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
            let eventsDatabase = [];
            try {
                const rawEvents = await apiClientRequest('/events/events/?page_size=1000');
                const evtList = Array.isArray(rawEvents) ? rawEvents : (rawEvents.results || []);
                eventsDatabase = evtList.map(e => {
                    const meta = e.calendar_metadata || {};
                    const start = e.start_datetime || meta.dateDebut;
                    const end = e.end_datetime || meta.dateFin || start;
                    return {
                        id: e.id,
                        title: e.name || 'Événement sans titre',
                        start: String(start || '').slice(0, 10),
                        end: String(end || start || '').slice(0, 10),
                        allDay: true,
                        backgroundColor: meta.couleur === 'blue' ? '#0a4d8c' : (meta.couleur === 'red' ? '#d62828' : (meta.couleur === 'green' ? '#10b981' : (meta.couleur === 'orange' ? '#f97316' : '#8b5cf6'))),
                        borderColor: 'transparent',
                        description: e.description || '',
                        time: e.start_datetime ? `${String(e.start_datetime).slice(11, 16)} - ${String(e.end_datetime || '').slice(11, 16)}` : 'Toute la journée',
                        icon: meta.cat === 'Cours' ? 'fa-solid fa-book' : 'fa-solid fa-calendar-check',
                        location: e.location || '',
                        participants: meta.resp || ''
                    };
                }).filter(event => event.start);
            } catch (err) {
                console.error("Erreur chargement événements", err);
            }

            // Les notifications persistées par le backend sont la source du
            // journal. Les rappels d'événements apparaissent donc ici et dans
            // la notification native lorsque le navigateur l'autorise.
            const activityList = document.getElementById('recentActivityList');
            const notificationBadge = document.querySelector('.badge44');
            const notifiedIds = new Set(JSON.parse(sessionStorage.getItem('cejec_notified_ids') || '[]'));
            const relativeTime = (value) => {
                const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
                if (seconds < 60) return "À l'instant";
                if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
                if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
                return new Date(value).toLocaleDateString('fr-FR');
            };
            const renderActivities = (notifications) => {
                if (!activityList) return;
                activityList.replaceChildren();
                if (!notifications.length) {
                    const empty = document.createElement('p');
                    empty.textContent = 'Aucune activité récente.';
                    activityList.append(empty);
                    return;
                }
                notifications.slice(0, 5).forEach(notification => {
                    const item = document.createElement('div');
                    item.className = `activity-item ${notification.priority === 'urgent' || notification.priority === 'high' ? 'red-item' : 'green-item'}`;
                    item.innerHTML = '<div class="activity-indicator"></div><div class="activity-details"><p></p><span></span></div>';
                    item.querySelector('p').textContent = notification.title;
                    item.querySelector('span').textContent = `${relativeTime(notification.created_at)} · ${notification.content}`;
                    activityList.append(item);
                });
            };
            const refreshNotifications = async () => {
                try {
                    const response = await apiClientRequest('/notifications/notifications/?page_size=20');
                    const notifications = Array.isArray(response) ? response : (response.results || []);
                    renderActivities(notifications);
                    const unread = notifications.filter(item => !item.is_read);
                    if (notificationBadge) notificationBadge.textContent = unread.length;
                    unread.filter(item => item.trigger_type === 'event_reminder').forEach(item => {
                        if (notifiedIds.has(item.id) || !('Notification' in window) || Notification.permission !== 'granted') return;
                        new Notification(item.title, { body: item.content, icon: 'images/logo.png' });
                        notifiedIds.add(item.id);
                    });
                    sessionStorage.setItem('cejec_notified_ids', JSON.stringify([...notifiedIds].slice(-100)));
                } catch (error) {
                    console.error('Erreur chargement notifications', error);
                }
            };
            document.querySelector('.notification-bell')?.addEventListener('click', async () => {
                if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
                refreshNotifications();
            });
            await refreshNotifications();
            window.setInterval(refreshNotifications, 60000);

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
                window.location.href = 'incubateur_calendrier.html#eventModal';
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
                // FullCalendar interprète ``end`` comme exclusif pour les
                // événements "all day". La date de fin métier, elle, est
                // inclusive : on ajoute donc un jour uniquement à sa copie
                // d'affichage, sans fausser le filtre du modal.
                const calendarEvents = eventsDatabase.map(event => {
                    const exclusiveEnd = new Date(event.end + 'T00:00:00');
                    exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
                    return { ...event, end: exclusiveEnd.toISOString().slice(0, 10) };
                });
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
                    events: calendarEvents,
                    height: 'auto',
                    contentHeight: 'auto',
                    selectable: true,
                    selectMirror: true,
                    dayMaxEvents: window.innerWidth <= 480 ? 1 : 2,
                    dateClick: function(info) {
                        openEventModal(info.dateStr);
                    },
                    eventClick: function(info) {
                        redirectToEventDetail(info.event.id);
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

            // Charger les KPIs depuis le backend
            async function loadDashboardStats() {
                try {
                    const data = await apiClientRequest('/dashboard/stats/');
                    
                    const updateKpiByTitle = (titleKey, value) => {
                        const normalizedKey = titleKey.toLowerCase().trim();
                        document.querySelectorAll('.kpi-title').forEach(el => {
                            const elText = el.textContent.toLowerCase().trim();
                            if (elText.includes(normalizedKey)) {
                                const valueEl = el.closest('.kpi-card')?.querySelector('.kpi-value');
                                if (valueEl) valueEl.textContent = value;
                            }
                        });
                    };
                    
                    updateKpiByTitle('tudiants', data.students_count); // matches étudiants or étudiants
                    updateKpiByTitle('promotions', data.students_count);
                    updateKpiByTitle('professeurs', data.teachers_count);
                    updateKpiByTitle('cours', data.courses_count);
                    updateKpiByTitle('revenus', Number(data.revenue_month || 0).toLocaleString('fr-FR') + ' HTG');
                    updateKpiByTitle('ussite', data.success_rate + '%'); // Taux de réussite
                    updateKpiByTitle('dipl', data.diplomas_delivered); // Diplômes
                    updateKpiByTitle('projets', data.projects_count);
                    updateKpiByTitle('actualit', data.articles_count); // Publications & Actualités
                    
                    createSparkline('spark-1', data.student_history || [], '#0a4d8c');
                    createSparkline('spark-3', data.teacher_history || [], '#0a4d8c');
                    createSparkline('spark-4', data.course_history || [], '#0a4d8c');
                    createSparkline('spark-5', data.revenue_history || [], '#10b981');
                    createSparkline('spark-6', data.success_rate_history || [], '#10b981');
                    createSparkline('spark-8', data.projects_history || [], '#10b981');
                    createSparkline('spark-9', data.articles_history || [], '#d62828');

                    if (mixedChart) {
                        mixedChart.data.labels = data.month_labels || [];
                        mixedChart.data.datasets[0].data = data.student_history || [];
                        mixedChart.data.datasets[1].data = data.success_rate_history || [];
                        mixedChart.update();
                    }
                    if (donutChart) {
                        donutChart.data.labels = data.promotion_distribution?.labels || [];
                        donutChart.data.datasets[0].data = data.promotion_distribution?.data || [];
                        donutChart.update();
                    }
                    if (attendanceChart) {
                        attendanceChart.data.labels = data.attendance_history?.labels || [];
                        attendanceChart.data.datasets[0].data = data.attendance_history?.data || [];
                        attendanceChart.update();
                    }
                } catch (e) {
                    console.warn('Impossible de charger les statistiques du tableau de bord:', e);
                }
            }
            loadDashboardStats();


            console.log('✅ Dashboard CEJEC 100% responsive initialisé');
            console.log('📊 Graphiques Chart.js responsives');
            console.log('📅 Calendrier interactif - Redirection vers incubateur_calendrier.html');
            console.log('📱 Optimisé de 320px à 4K');
            console.log('🔗 Titre cliquable avec href="incubateur_calendrier.html"');

        });
