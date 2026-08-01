document.addEventListener("DOMContentLoaded", () => {
    // ========== AI CHAT CEJEC - CONCIERGE IA PRO ==========
    const targetContainer = document.getElementById("orion-concierge-sistem");
    if (!targetContainer) return;

    targetContainer.innerHTML = `
        <div class="chat-wrapper-float" id="chatWrapperFloat">
            <div class="chat-header-bot">
                <div class="bot-profile">
                    <div class="bot-avatar">
                        <i class="fa-solid fa-graduation-cap"></i>
                        <span class="online-dot"></span>
                    </div>
                    <div class="bot-info">
                        <h3>CEJEC IA</h3>
                        <span class="status-badge">En ligne</span>
                    </div>
                </div>
                <div class="header-actions">
                    <button class="header-action-btn" id="btnExpand" title="Agrandir / Réduire">
                        <i class="fa-solid fa-expand"></i>
                    </button>
                    <button class="header-action-btn" id="btnNewChat" title="Nouvelle conversation">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                    <button class="header-action-btn" id="btnHistory" title="Historique">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </button>
                    <button class="close-chat-btn" id="closeChatBtn" title="Fermer">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            
            <div class="chat-body-float" id="chatBodyFloat">
                <div class="msg-card welcome-card">
                    <div class="sparkle-badge">
                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                    </div>
                    <div class="msg-content">
                        <h4>
                            <i class="fa-solid fa-hand-peace"></i> Bonjour ! Bienvenue au CEJEC
                        </h4>
                        <p>Je suis votre <strong>Concierge IA du CEJEC</strong>, votre assistant intelligent pour toutes vos questions sur le Centre d'Études des Jeunes en Entrepreneuriat et Commerce.</p>
                        
                        <div class="feature-grid">
                            <div class="feature-item" data-topic="etudiants">
                                <i class="fa-solid fa-user-graduate"></i>
                                <span><strong>Étudiants</strong></span>
                            </div>
                            <div class="feature-item" data-topic="admissions">
                                <i class="fa-solid fa-file-signature"></i>
                                <span><strong>Admissions</strong></span>
                            </div>
                            <div class="feature-item" data-topic="promotions">
                                <i class="fa-solid fa-layer-group"></i>
                                <span><strong>Promotions</strong></span>
                            </div>
                            <div class="feature-item" data-topic="cours">
                                <i class="fa-solid fa-book-open"></i>
                                <span><strong>Cours</strong></span>
                            </div>
                            <div class="feature-item" data-topic="professeurs">
                                <i class="fa-solid fa-chalkboard-user"></i>
                                <span><strong>Professeurs</strong></span>
                            </div>
                            <div class="feature-item" data-topic="diplomes">
                                <i class="fa-solid fa-certificate"></i>
                                <span><strong>Diplômes</strong></span>
                            </div>
                            <div class="feature-item" data-topic="finances">
                                <i class="fa-solid fa-sack-dollar"></i>
                                <span><strong>Finances</strong></span>
                            </div>
                            <div class="feature-item" data-topic="rapports">
                                <i class="fa-solid fa-chart-bar"></i>
                                <span><strong>Rapports</strong></span>
                            </div>
                            <div class="feature-item" data-topic="projets">
                                <i class="fa-solid fa-lightbulb"></i>
                                <span><strong>Projets</strong></span>
                            </div>
                            <div class="feature-item" data-topic="evenements">
                                <i class="fa-solid fa-calendar-star"></i>
                                <span><strong>Événements</strong></span>
                            </div>
                            <div class="feature-item" data-topic="actualites">
                                <i class="fa-solid fa-newspaper"></i>
                                <span><strong>Actualités</strong></span>
                            </div>
                            <div class="feature-item" data-topic="entreprise">
                                <i class="fa-solid fa-building-columns"></i>
                                <span><strong>CEJEC</strong></span>
                            </div>
                        </div>
                        
                        <p class="prompt-text">
                            <i class="fa-solid fa-arrow-pointer"></i> Cliquez sur un sujet ou posez votre question ci-dessous
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="chat-suggestions-float" id="chatSuggestions">
                <button class="chip-suggestion" data-query="Comment s'inscrire au CEJEC ?">
                    <i class="fa-solid fa-pen-to-square"></i> Comment s'inscrire ?
                </button>
                <button class="chip-suggestion" data-query="Quels sont les cours disponibles ?">
                    <i class="fa-solid fa-list-check"></i> Cours disponibles
                </button>
                <button class="chip-suggestion" data-query="Comment obtenir mon diplôme ?">
                    <i class="fa-solid fa-scroll"></i> Obtenir son diplôme
                </button>
                <button class="chip-suggestion" data-query="Quels sont les frais de scolarité ?">
                    <i class="fa-solid fa-coins"></i> Frais de scolarité
                </button>
            </div>
            
            <div class="chat-footer-float">
                <div class="input-wrapper">
                    <i class="fa-solid fa-pen input-icon"></i>
                    <input 
                        type="text" 
                        placeholder="Posez votre question sur le CEJEC..." 
                        id="chatInputFloat"
                        autocomplete="off"
                    >
                    <button class="input-clear-btn" id="inputClearBtn" title="Effacer" style="display:none;">
                        <i class="fa-solid fa-delete-left"></i>
                    </button>
                </div>
                <button class="send-btn-float" id="btnSendFloat" title="Envoyer">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            </div>
        </div>
        
        <button class="fab-btn-float" id="fabToggleFloat" title="Assistant CEJEC">
            <i class="fa-solid fa-wand-magic-sparkles" id="fabIconFloat"></i>
            <span class="fab-pulse"></span>
        </button>
    `;

    // ========== ÉLÉMENTS DOM ==========
    const fabToggleFloat = document.getElementById("fabToggleFloat");
    const chatWrapperFloat = document.getElementById("chatWrapperFloat");
    const fabIconFloat = document.getElementById("fabIconFloat");
    const closeChatBtn = document.getElementById("closeChatBtn");
    const chatInputFloat = document.getElementById("chatInputFloat");
    const btnSendFloat = document.getElementById("btnSendFloat");
    const inputClearBtn = document.getElementById("inputClearBtn");
    const chatBodyFloat = document.getElementById("chatBodyFloat");
    const btnNewChat = document.getElementById("btnNewChat");
    const btnHistory = document.getElementById("btnHistory");
    const btnExpand = document.getElementById('btnExpand');

    // ========== SISTÈM ISTORIK ==========
    const STORAGE_KEY = 'cejec_chat_history';
    const MAX_HISTORY = 50;

    let chatHistory = [];
    let currentSessionId = null;
    let currentSessionMessages = [];
    let isHistoryViewOpen = false;

    function loadHistory() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                chatHistory = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Error loading chat history:', e);
            chatHistory = [];
        }
    }

    function saveHistory() {
        try {
            if (!chatHistory || chatHistory.length === 0) {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(chatHistory));
            }
        } catch (e) {
            console.warn('Error saving chat history:', e);
        }
    }

    function createNewSession() {
        currentSessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        currentSessionMessages = [];
        
        chatHistory.unshift({
            id: currentSessionId,
            date: new Date().toISOString(),
            title: 'Nouveau conversation',
            preview: 'Comment puis-je vous aider ?',
            messages: []
        });
        
        if (chatHistory.length > MAX_HISTORY) {
            chatHistory = chatHistory.slice(0, MAX_HISTORY);
        }
        
        saveHistory();
        return currentSessionId;
    }

    function saveMessageToCurrentSession(text, sender) {
        if (!currentSessionId) {
            createNewSession();
        }
        
        const message = {
            text: text,
            sender: sender,
            timestamp: new Date().toISOString()
        };
        
        currentSessionMessages.push(message);
        
        const sessionIndex = chatHistory.findIndex(h => h.id === currentSessionId);
        if (sessionIndex !== -1) {
            chatHistory[sessionIndex].messages = [...currentSessionMessages];
            
            if (sender === 'user' && currentSessionMessages.filter(m => m.sender === 'user').length === 1) {
                chatHistory[sessionIndex].title = text.substring(0, 40) + (text.length > 40 ? '...' : '');
            }
            chatHistory[sessionIndex].preview = text;
            chatHistory[sessionIndex].date = new Date().toISOString();
        }
        
        saveHistory();
    }

    function loadSession(sessionId) {
        const session = chatHistory.find(h => h.id === sessionId);
        if (!session) return false;
        
        currentSessionId = session.id;
        currentSessionMessages = [...session.messages];
        
        clearChatDisplay();
        
        session.messages.forEach(msg => {
            restoreMessage(msg.text, msg.sender);
        });
        
        return true;
    }

    function deleteSession(sessionId) {
        const index = chatHistory.findIndex(h => h.id === sessionId);
        if (index === -1) return false;
        
        chatHistory.splice(index, 1);
        
        if (currentSessionId === sessionId) {
            clearChatDisplay();
            ensureWelcomeCard();
            
            currentSessionId = null;
            currentSessionMessages = [];
            
            if (chatHistory.length > 0) {
                createNewSession();
            }
        }
        
        saveHistory();
        
        return true;
    }

    function clearChatDisplay() {
        const allCards = chatBodyFloat.querySelectorAll('.msg-card');
        allCards.forEach(card => {
            if (!card.classList.contains('welcome-card')) {
                card.remove();
            }
        });
    }

    function ensureWelcomeCard() {
        if (!chatBodyFloat.querySelector('.welcome-card')) {
            const welcomeCard = document.createElement('div');
            welcomeCard.className = 'msg-card welcome-card';
            welcomeCard.innerHTML = `
                <div class="sparkle-badge">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                </div>
                <div class="msg-content">
                    <h4><i class="fa-solid fa-hand-peace"></i> Bonjour ! Bienvenue au CEJEC</h4>
                    <p>Comment puis-je vous aider aujourd'hui ?</p>
                </div>
            `;
            chatBodyFloat.insertBefore(welcomeCard, chatBodyFloat.firstChild);
        }
    }

    function restoreMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg-card ${sender}-message`;
        
        if (sender === 'user') {
            msgDiv.innerHTML = `
                <div class="msg-content user-content">
                    <p>${text}</p>
                    <span class="msg-time">--:--</span>
                </div>
                <div class="user-avatar">
                    <i class="fa-solid fa-user"></i>
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="bot-avatar-mini">
                    <i class="fa-solid fa-graduation-cap"></i>
                </div>
                <div class="msg-content bot-content">
                    <div class="bot-response">${text}</div>
                    <span class="msg-time">--:--</span>
                </div>
            `;
        }
        
        chatBodyFloat.appendChild(msgDiv);
    }

    // ========== FONKSYON NETWAYAJ TÈKS POU APERÇU ==========
    
    function cleanPreviewText(htmlText) {
        if (!htmlText) return '';
        
        let cleanText = htmlText.replace(/<[^>]*>/g, ' ');
        cleanText = cleanText.replace(/\s+/g, ' ').trim();
        
        if (cleanText.length > 60) {
            cleanText = cleanText.substring(0, 60) + '...';
        }
        
        return cleanText;
    }
    
    function cleanTitleText(htmlText) {
        if (!htmlText) return 'Nouveau conversation';
        
        let cleanText = htmlText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        
        if (cleanText.length > 40) {
            cleanText = cleanText.substring(0, 40) + '...';
        }
        
        return cleanText || 'Nouveau conversation';
    }

    // ========== VUE ISTORIK ANDEDAN CHAT LA ==========
    
    function openHistoryView() {
        if (isHistoryViewOpen) return;
        
        isHistoryViewOpen = true;
        
        const chatMessages = chatBodyFloat.querySelectorAll('.msg-card');
        chatMessages.forEach(msg => msg.style.display = 'none');
        
        chatWrapperFloat.classList.add('showing-history');
        
        const historyView = document.createElement('div');
        historyView.className = 'history-view';
        historyView.id = 'historyView';
        
        historyView.innerHTML = `
            <div class="history-view-header">
                <h3>
                    <i class="fa-solid fa-clock-rotate-left" style="color: #0a4d8c;"></i>
                    Historique des conversations
                </h3>
                <button class="history-view-back-btn" id="historyViewBackBtn" title="Retour">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
            </div>
            <div class="history-view-list" id="historyViewList"></div>
            <div class="history-view-actions">
                <button class="history-view-btn history-view-btn-primary" id="btnNewConversationView">
                    <i class="fa-solid fa-plus"></i> Nouvelle conversation
                </button>
                <button class="history-view-btn history-view-btn-danger" id="btnClearAllHistoryView">
                    <i class="fa-solid fa-trash-can"></i> Tout efase
                </button>
            </div>
        `;
        
        chatBodyFloat.appendChild(historyView);
        
        renderHistoryViewList();
        setupHistoryViewEvents();
        
        chatBodyFloat.scrollTop = 0;
    }
    
    function closeHistoryView() {
        if (!isHistoryViewOpen) return;
        
        const historyView = document.getElementById('historyView');
        if (!historyView) return;
        
        historyView.classList.add('closing');
        
        setTimeout(() => {
            chatWrapperFloat.classList.remove('showing-history');
            historyView.remove();
            
            const chatMessages = chatBodyFloat.querySelectorAll('.msg-card');
            chatMessages.forEach(msg => msg.style.display = '');
            
            isHistoryViewOpen = false;
        }, 280);
    }
    
    function setupHistoryViewEvents() {
        const backBtn = document.getElementById('historyViewBackBtn');
        const btnNewConv = document.getElementById('btnNewConversationView');
        const btnClearAll = document.getElementById('btnClearAllHistoryView');
        
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                closeHistoryView();
            });
        }
        
        if (btnNewConv) {
            btnNewConv.addEventListener('click', () => {
                closeHistoryView();
                
                const messages = chatBodyFloat.querySelectorAll('.msg-card:not(.welcome-card)');
                messages.forEach(msg => msg.remove());
                
                ensureWelcomeCard();
                createNewSession();
                
                chatInputFloat.value = '';
                inputClearBtn.style.display = 'none';
                
                setTimeout(() => chatInputFloat.focus(), 350);
                
                showToast('Nouvelle conversation créée', 'success');
            });
        }
        
        if (btnClearAll) {
            btnClearAll.addEventListener('click', () => {
                if (confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique ? Cette action est irréversible.')) {
                    chatHistory = [];
                    localStorage.removeItem(STORAGE_KEY);
                    currentSessionId = null;
                    currentSessionMessages = [];
                    
                    clearChatDisplay();
                    ensureWelcomeCard();
                    
                    renderHistoryViewList();
                    
                    showToast('Historique supprimé avec succès', 'success');
                }
            });
        }
    }
    
    function renderHistoryViewList() {
        const container = document.getElementById('historyViewList');
        if (!container) return;
        
        if (!chatHistory || chatHistory.length === 0) {
            container.innerHTML = `
                <div class="history-view-empty">
                    <i class="fa-solid fa-inbox"></i>
                    <p>Aucune conversation dans l'historique</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = chatHistory.map(session => {
            const date = new Date(session.date);
            const timeStr = formatTimeAgo(date);
            const isActive = session.id === currentSessionId;
            
            const cleanTitle = cleanTitleText(session.title);
            const cleanPreview = cleanPreviewText(session.preview);
            
            const lastMessage = session.messages.length > 0 ? session.messages[session.messages.length - 1] : null;
            const isUserMessage = lastMessage && lastMessage.sender === 'user';
            
            return `
                <div class="history-view-item ${isActive ? 'active' : ''}" data-session-id="${session.id}">
                    <div class="history-view-item-icon">
                        <i class="fa-solid fa-message"></i>
                    </div>
                    <div class="history-view-item-content">
                        <div class="history-view-item-title">${escapeHtml(cleanTitle)}</div>
                        <div class="history-view-item-preview">
                            ${isUserMessage ? '<i class="fa-solid fa-user" style="font-size:0.65rem;color:#94a3b8;margin-right:4px;"></i>' : '<i class="fa-solid fa-graduation-cap" style="font-size:0.65rem;color:#0a4d8c;margin-right:4px;"></i>'}
                            ${escapeHtml(cleanPreview)}
                        </div>
                    </div>
                    <span class="history-view-item-time">${timeStr}</span>
                    <button class="history-view-item-delete" data-delete-id="${session.id}" title="Supprimer">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.history-view-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.history-view-item-delete')) return;
                
                const sessionId = item.dataset.sessionId;
                if (loadSession(sessionId)) {
                    closeHistoryView();
                    showToast('Conversation chargée', 'success');
                }
            });
        });
        
        container.querySelectorAll('.history-view-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const sessionId = btn.dataset.deleteId;
                
                const deleted = deleteSession(sessionId);
                
                if (deleted) {
                    renderHistoryViewList();
                    showToast('Conversation supprimée', 'success');
                }
            });
        });
    }

    function formatTimeAgo(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Maintenant';
        if (minutes < 60) return `Il y a ${minutes} min`;
        if (hours < 24) return `Il y a ${hours}h`;
        if (days < 7) return `Il y a ${days}j`;
        
        return date.toLocaleDateString('fr-FR', { 
            day: 'numeric', 
            month: 'short' 
        });
    }

    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // ========== BASE DE CONNAISSANCES CEJEC ==========
    const knowledgeBase = {
        etudiants: {
            keywords: ['étudiant', 'inscrit', 'inscription', 'élève', 'effectif', 'classe', 'groupe'],
            response: `<i class="fa-solid fa-user-graduate"></i> <strong>Étudiants du CEJEC</strong><br><br>
                Le CEJEC compte actuellement <strong>482 étudiants</strong> répartis dans nos différentes promotions. Chaque étudiant bénéficie d'un suivi personnalisé avec :
                <br>• <strong>Carnet de bord numérique</strong> pour suivre sa progression
                <br>• <strong>Accès à la plateforme e-learning</strong> 24/7
                <br>• <strong>Mentorat individuel</strong> avec des professionnels
                <br>• <strong>Évaluation continue</strong> des compétences
                <br><br>Souhaitez-vous des informations sur une promotion spécifique ?`
        },
        admissions: {
            keywords: ['admission', 'inscrire', 'inscription', 'dossier', 'candidature', 'postuler', 'admis'],
            response: `<i class="fa-solid fa-file-signature"></i> <strong>Admissions au CEJEC</strong><br><br>
                <strong>Conditions d'admission :</strong>
                <br>• Diplôme de fin d'études secondaires (Baccalauréat)
                <br>• Dossier de candidature complet
                <br>• Lettre de motivation
                <br>• Entretien de sélection
                <br>• Frais d'inscription : <strong>150 USD</strong>
                <br><br><strong>Prochaines sessions :</strong>
                <br>• Septembre 2026
                <br>• Janvier 2027
                <br><br>Le processus d'admission est ouvert toute l'année. Voulez-vous télécharger le formulaire ?`
        },
        promotions: {
            keywords: ['promotion', 'niveau', 'année', 'licence', 'master', 'doctorat', 'cycle'],
            response: `<i class="fa-solid fa-layer-group"></i> <strong>Promotions Actives</strong><br><br>
                Le CEJEC propose <strong>6 promotions</strong> :
                <br>• <strong>Licence 1</strong> - Fondamentaux du commerce
                <br>• <strong>Licence 2</strong> - Techniques entrepreneuriales
                <br>• <strong>Licence 3</strong> - Stratégie d'entreprise
                <br>• <strong>Master 1</strong> - Management avancé
                <br>• <strong>Master 2</strong> - Leadership & Innovation
                <br>• <strong>Formation Continue</strong> - Professionnels en activité
                <br><br>Effectif total : <strong>482 étudiants</strong>. Quelle promotion vous intéresse ?`
        },
        cours: {
            keywords: ['cours', 'module', 'matière', 'programme', 'formation', 'enseigner', 'apprendre'],
            response: `<i class="fa-solid fa-book-open"></i> <strong>Cours & Programme</strong><br><br>
                Notre catalogue compte <strong>52 cours</strong> répartis en <strong>12 modules</strong> :
                <br>1. Comptabilité & Finance
                <br>2. Marketing Digital
                <br>3. Droit des Affaires
                <br>4. Gestion des Ressources Humaines
                <br>5. Leadership Entrepreneurial
                <br>6. Innovation & Créativité
                <br>7. Économie & Développement
                <br>8. Commerce International
                <br>9. Gestion de Projet
                <br>10. Informatique de Gestion
                <br>11. Éthique Professionnelle
                <br>12. Stage Pratique
                <br><br>Quel module souhaitez-vous explorer ?`
        },
        professeurs: {
            keywords: ['professeur', 'enseignant', 'formateur', 'prof', 'instructeur', 'équipe pédagogique'],
            response: `<i class="fa-solid fa-chalkboard-user"></i> <strong>Corps Professoral</strong><br><br>
                Le CEJEC dispose de <strong>34 professeurs</strong> qualifiés :
                <br>• <strong>12 Professeurs permanents</strong> (docteurs et experts)
                <br>• <strong>18 Chargés de cours</strong> (professionnels en activité)
                <br>• <strong>4 Conférenciers invités</strong> (experts internationaux)
                <br><br>Tous nos formateurs sont certifiés et possèdent une expérience significative en entreprise. Souhaitez-vous consulter un CV spécifique ?`
        },
        diplomes: {
            keywords: ['diplôme', 'certificat', 'graduation', 'diplômé', 'certifier', 'reconnaissance', 'accréditation'],
            response: `<i class="fa-solid fa-certificate"></i> <strong>Diplômes & Certifications</strong><br><br>
                Le CEJEC a délivré <strong>120 diplômes</strong> cette année :
                <br>• <strong>Licence en Entrepreneuriat</strong> (Bac+3) - Reconnu MENFP
                <br>• <strong>Master en Commerce</strong> (Bac+5) - Reconnu MCI
                <br>• <strong>Certificat Professionnel</strong> - Spécialisations
                <br>• <strong>Attestation de Formation</strong> - Modules courts
                <br><br>Taux de réussite : <strong>94.2%</strong>. Voulez-vous vérifier l'éligibilité d'un diplôme ?`
        },
        finances: {
            keywords: ['financ', 'paiement', 'frais', 'scolarité', 'bourse', 'échéance', 'facture', 'coût', 'prix', 'argent'],
            response: `<i class="fa-solid fa-sack-dollar"></i> <strong>Finances & Paiements</strong><br><br>
                <strong>Frais de scolarité 2026 :</strong>
                <br>• Licence : <strong>2,500 USD/an</strong>
                <br>• Master : <strong>3,500 USD/an</strong>
                <br>• Formation Continue : <strong>1,800 USD/module</strong>
                <br><br><strong>Modalités de paiement :</strong>
                <br>• Paiement comptant (-10% de remise)
                <br>• Paiement en 3 versements
                <br>• Paiement mensuel (sur 10 mois)
                <br><br>Revenus du mois : <strong>14,250 USD</strong>. Bourses disponibles sur demande.`
        },
        rapports: {
            keywords: ['rapport', 'statistique', 'analyse', 'performance', 'évaluation', 'bulletin', 'résultat', 'note'],
            response: `<i class="fa-solid fa-chart-bar"></i> <strong>Rapports & Analyses</strong><br><br>
                Générez vos rapports en un clic :
                <br>• <strong>Rapport Académique</strong> - Performances par promotion
                <br>• <strong>Rapport de Présence</strong> - Taux quotidien/mensuel
                <br>• <strong>Rapport Financier</strong> - Revenus & dépenses
                <br>• <strong>Rapport d'Inscriptions</strong> - Évolution des effectifs
                <br>• <strong>Bulletins individuels</strong> - Par étudiant
                <br><br>Quel type de rapport souhaitez-vous consulter ?`
        },
        projets: {
            keywords: ['projet', 'incubateur', 'startup', 'création', 'entreprise', 'business', 'entrepreneur'],
            response: `<i class="fa-solid fa-lightbulb"></i> <strong>Projets Entrepreneuriaux</strong><br><br>
                <strong>18 projets incubés</strong> cette année :
                <br>• <strong>Incubateur CEJEC</strong> - Accompagnement complet
                <br>• <strong>Financement</strong> - Jusqu'à 5,000 USD par projet
                <br>• <strong>Mentorat</strong> - Entrepreneurs expérimentés
                <br>• <strong>Réseautage</strong> - Accès au réseau d'affaires
                <br><br>Taux de croissance : <strong>+35%</strong>. Vous avez un projet à soumettre ?`
        },
        evenements: {
            keywords: ['événement', 'conférence', 'séminaire', 'atelier', 'soutenance', 'calendrier', 'agenda'],
            response: `<i class="fa-solid fa-calendar-star"></i> <strong>Événements à Venir</strong><br><br>
                <strong>Juin 2026 :</strong>
                <br>• 15 Juin - Soutenance de Projet
                <br>• 18-20 Juin - Séminaire Stratégique
                <br>• 24 Juin - Examens Mi-Session
                <br>• 30 Juin - Remise de Diplômes
                <br><br><strong>Prochainement :</strong>
                <br>• Conférence Innovation & Tech
                <br>• Atelier Création d'Entreprise
                <br>• Forum des Partenaires
                <br><br>Voulez-vous vous inscrire à un événement ?`
        },
        actualites: {
            keywords: ['actualité', 'news', 'nouvelle', 'publication', 'article', 'blog', 'information'],
            response: `<i class="fa-solid fa-newspaper"></i> <strong>Actualités du CEJEC</strong><br><br>
                <strong>42 publications</strong> cette année. Dernières actualités :
                <br>• Lancement officiel de la Médiathèque Numérique
                <br>• Nouveau partenariat avec la Chambre de Commerce
                <br>• Résultats exceptionnels aux examens nationaux
                <br>• Visite des investisseurs internationaux
                <br><br>Restez informé en vous abonnant à notre newsletter !`
        },
        entreprise: {
            keywords: ['cejec', 'centre', 'histoire', 'mission', 'valeur', 'fondateur', 'équipe', 'siège', 'contact'],
            response: `<i class="fa-solid fa-building-columns"></i> <strong>Le CEJEC</strong><br><br>
                <strong>Centre d'Études des Jeunes en Entrepreneuriat et Commerce</strong>
                <br><br><strong>Mission :</strong> Former la nouvelle génération d'entrepreneurs haïtiens en combinant excellence académique et pratique professionnelle.
                <br><br><strong>Valeurs :</strong>
                <br>• Excellence | Innovation | Intégrité
                <br>• Leadership | Collaboration | Impact Social
                <br><br><strong>Contact :</strong>
                <br>• Téléphone : +509 4808 8452 / 3354 0425                                
                <br>• Email : contact@cejec.edu.ht
                <br>• Site web : www.cejec.edu.ht`
        }
    };

    // ========== FONCTIONS UTILITAIRES ==========
    
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const toastWidth = vw < 480 ? '85vw' : 'auto';
        
        const iconMap = {
            success: 'fa-circle-check',
            error: 'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };
        
        const colorMap = {
            success: '#059669',
            error: '#d62828',
            warning: '#d97706',
            info: '#0a4d8c'
        };
        
        toast.style.cssText = `
            position: fixed;
            bottom: clamp(20px, 3vw, 30px);
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: ${colorMap[type] || '#1e293b'};
            color: white;
            padding: clamp(10px, 1.2vw, 14px) clamp(16px, 2vw, 24px);
            border-radius: 14px;
            font-size: clamp(0.75rem, 0.9vw, 0.9rem);
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 12px 30px rgba(0,0,0,0.2);
            transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            font-family: 'Plus Jakarta Sans', 'Poppins', sans-serif;
            width: ${toastWidth};
            text-align: center;
            max-width: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        `;
        
        toast.innerHTML = `<i class="fa-solid ${iconMap[type] || iconMap.info}"></i> ${message}`;
        document.body.appendChild(toast);
        
        requestAnimationFrame(() => {
            toast.style.transform = "translateX(-50%) translateY(0)";
        });
        
        setTimeout(() => {
            toast.style.transform = "translateX(-50%) translateY(100px)";
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    function addMessageToChat(text, sender = 'user') {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg-card ${sender}-message`;
        
        const now = new Date();
        const timeStr = now.getHours().toString().padStart(2, '0') + ':' + 
                       now.getMinutes().toString().padStart(2, '0');
        
        if (sender === 'user') {
            msgDiv.innerHTML = `
                <div class="msg-content user-content">
                    <p>${text}</p>
                    <span class="msg-time">${timeStr} <i class="fa-solid fa-check-double"></i></span>
                </div>
                <div class="user-avatar">
                    <i class="fa-solid fa-user"></i>
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="bot-avatar-mini">
                    <i class="fa-solid fa-graduation-cap"></i>
                </div>
                <div class="msg-content bot-content">
                    <div class="bot-response">${text}</div>
                    <span class="msg-time">${timeStr}</span>
                </div>
            `;
        }
        
        chatBodyFloat.appendChild(msgDiv);
        chatBodyFloat.scrollTop = chatBodyFloat.scrollHeight;
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'msg-card bot-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="bot-avatar-mini">
                <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <div class="msg-content bot-content">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        chatBodyFloat.appendChild(typingDiv);
        chatBodyFloat.scrollTop = chatBodyFloat.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingDiv = document.getElementById('typingIndicator');
        if (typingDiv) typingDiv.remove();
    }

    function getBotResponse(question) {
        const q = question.toLowerCase().trim();
        
        for (const [topic, data] of Object.entries(knowledgeBase)) {
            for (const keyword of data.keywords) {
                if (q.includes(keyword)) {
                    return data.response;
                }
            }
        }
        
        return `<i class="fa-solid fa-circle-info"></i> <strong>Excellente question !</strong><br><br>
            Pour mieux vous répondre, voici les sujets que je maîtrise :
            <br>• <strong>Étudiants</strong> - Effectifs, inscriptions, suivi
            <br>• <strong>Admissions</strong> - Procédures, conditions, frais
            <br>• <strong>Promotions</strong> - Niveaux, cycles, programmes
            <br>• <strong>Cours</strong> - Modules, matières, planning
            <br>• <strong>Professeurs</strong> - Corps professoral, CV
            <br>• <strong>Diplômes</strong> - Certifications, reconnaissances
            <br>• <strong>Finances</strong> - Frais, paiements, bourses
            <br>• <strong>Rapports</strong> - Statistiques, analyses
            <br>• <strong>Projets</strong> - Incubateur, entrepreneuriat
            <br>• <strong>Événements</strong> - Calendrier, conférences
            <br>• <strong>Actualités</strong> - News, publications
            <br><br>Pouvez-vous préciser votre demande ?`;
    }

    function handleSendMessage() {
        const message = chatInputFloat.value.trim();
        if (!message) {
            showToast("Veuillez saisir votre question", "warning");
            return;
        }
        
        if (!currentSessionId) {
            createNewSession();
        }
        
        saveMessageToCurrentSession(message, 'user');
        
        addMessageToChat(message, 'user');
        
        // Netwaye input apre envoyé
        chatInputFloat.value = '';
        inputClearBtn.style.display = 'none';
        
        showTypingIndicator();
        
        setTimeout(() => {
            removeTypingIndicator();
            const response = getBotResponse(message);
            
            saveMessageToCurrentSession(response, 'bot');
            
            addMessageToChat(response, 'bot');
        }, 1200 + Math.random() * 1800);
    }

    function clearChat() {
        const messages = chatBodyFloat.querySelectorAll('.msg-card:not(.welcome-card)');
        messages.forEach(msg => msg.remove());
        
        ensureWelcomeCard();
        createNewSession();
        
        showToast("Nouvelle conversation démarrée", "success");
    }

    // ========== GESTIONNAIRES INPUT ==========
    
    /**
     * Mete ajou vizibilite bouton efase input la
     * Bouton an parèt sèlman si gen tèks nan input la
     */
    function updateClearButtonVisibility() {
        if (chatInputFloat.value.length > 0) {
            inputClearBtn.style.display = 'flex';
        } else {
            inputClearBtn.style.display = 'none';
        }
    }

    // ========== GESTIONNAIRES D'ÉVÉNEMENTS ==========

    function openChat() {
        chatWrapperFloat.classList.add("active");
        fabIconFloat.className = "fa-solid fa-xmark";
        fabToggleFloat.style.transform = "rotate(90deg)";
        setTimeout(() => chatInputFloat.focus(), 400);
    }

    function closeChat() {
        // Si historique ouvert, fèmen li d'abord
        if (isHistoryViewOpen) {
            closeHistoryView();
        }
        
        // Retire klas "active" pou kache chat la
        chatWrapperFloat.classList.remove("active");
        
        // 🔑 RETIRE MODE AGRANDI SI LI TE AGRANDI
        // Sa ap fè FAB bouton an re-parèt
        if (chatWrapperFloat.classList.contains("chat-expanded")) {
            chatWrapperFloat.classList.remove("chat-expanded");
            
            // Remet icon expand nan header la
            const icon = btnExpand.querySelector("i");
            if (icon) {
                icon.classList.remove("fa-compress");
                icon.classList.add("fa-expand");
                btnExpand.title = "Agrandir";
            }
        }
        
        // Remet icon FAB bouton an
        fabIconFloat.className = "fa-solid fa-wand-magic-sparkles";
        fabToggleFloat.style.transform = "rotate(0deg)";
        
        // 🔑 ASIRE FAB BOUTON AN VIZIB
        fabToggleFloat.style.opacity = "1";
        fabToggleFloat.style.visibility = "visible";
        fabToggleFloat.style.pointerEvents = "auto";
        fabToggleFloat.style.transform = "rotate(0deg) scale(1)";
    }

    // ========== INITIALISATION HISTORIK ==========
    function initHistorySystem() {
        loadHistory();
        
        if (!currentSessionId && chatHistory.length > 0) {
            createNewSession();
        } else if (!currentSessionId) {
            createNewSession();
        }
    }
    
    initHistorySystem();

    // ========== ÉVÉNEMENTS ==========

    fabToggleFloat.addEventListener("click", () => {
        chatWrapperFloat.classList.contains("active") ? closeChat() : openChat();
    });

    closeChatBtn.addEventListener("click", closeChat);

    btnNewChat.addEventListener("click", () => {
        if (isHistoryViewOpen) {
            closeHistoryView();
            setTimeout(() => {
                clearChat();
            }, 300);
        } else {
            clearChat();
        }
    });

    btnHistory.addEventListener('click', () => {
        if (isHistoryViewOpen) {
            closeHistoryView();
        } else {
            openHistoryView();
        }
    });

    btnExpand.addEventListener("click", () => {
        chatWrapperFloat.classList.toggle("chat-expanded");
        const icon = btnExpand.querySelector("i");
        if (chatWrapperFloat.classList.contains("chat-expanded")) {
            icon.classList.remove("fa-expand");
            icon.classList.add("fa-compress");
            btnExpand.title = "Réduire";
        } else {
            icon.classList.remove("fa-compress");
            icon.classList.add("fa-expand");
            btnExpand.title = "Agrandir";
        }
    });    

    document.querySelectorAll('.feature-item').forEach(item => {
        item.addEventListener('click', () => {
            const topic = item.dataset.topic;
            if (topic && knowledgeBase[topic]) {
                const query = item.querySelector('strong').textContent;
                chatInputFloat.value = `Parle-moi des ${query.toLowerCase()}`;
                updateClearButtonVisibility();
                handleSendMessage();
            }
        });
    });

    document.querySelectorAll(".chip-suggestion").forEach(chip => {
        chip.addEventListener("click", () => {
            const query = chip.dataset.query;
            if (query) {
                chatInputFloat.value = query;
                updateClearButtonVisibility();
                handleSendMessage();
            }
            
            chip.style.transform = 'scale(0.95)';
            setTimeout(() => chip.style.transform = 'scale(1)', 150);
        });
    });

    // Bouton envoyé
    btnSendFloat.addEventListener("click", handleSendMessage);

    // Envoyer avec Entrée
    chatInputFloat.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // 🔧 BOUTON EFASE INPUT - Efase tout tèks la epi fokale
    inputClearBtn.addEventListener("click", () => {
        chatInputFloat.value = '';
        chatInputFloat.focus();
        updateClearButtonVisibility();
    });
    
    // 🔧 INPUT EVENTS - Mete ajou bouton efase a chak fwa tèks chanje
    chatInputFloat.addEventListener("input", () => {
        updateClearButtonVisibility();
    });
    
    // 🔧 Touche "Backspace" nan input - si vid, kache bouton
    chatInputFloat.addEventListener("keyup", () => {
        updateClearButtonVisibility();
    });
    
    // 🔧 Lè input pèdi fokis, verifye si bouton dwe rete ou kache
    chatInputFloat.addEventListener("blur", () => {
        // Retade yon ti kras pou evite konfli ak klik sou bouton
        setTimeout(() => {
            updateClearButtonVisibility();
        }, 150);
    });

    // Fermer avec la touche Échap
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (isHistoryViewOpen) {
                closeHistoryView();
            } else if (chatWrapperFloat.classList.contains("active")) {
                closeChat();
            }
        }
    });

    // ========== INITIALISATION ==========
    
    // Verifikasyon inisyal bouton efase a
    updateClearButtonVisibility();
    
    setTimeout(() => {
        fabToggleFloat.classList.add('initial-pulse');
        setTimeout(() => fabToggleFloat.classList.remove('initial-pulse'), 2000);
    }, 2000);

    console.log('%c✨ CEJEC Concierge IA %cinitialisé avec succès',
        'color: #0a4d8c; font-weight: bold; font-size: 14px;',
        'color: #5b6675;');
});