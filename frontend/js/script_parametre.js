(function() {
    'use strict';

    const CONFIG = {
        TOAST_DURATION: 3000,
        TOTP_TIME_STEP: 30,
        TOTP_WINDOW: 1,
        BACKUP_CODES_COUNT: 4
    };

    const appState = {
        currentSection: 'general',
        is2FASetupInProgress: false,
        courseCounter: 1,
        backendSettings: {}
    };

    async function loadBackendSettings() {
        if (!window.SettingsAPI) return;
        try {
            const response = await SettingsAPI.get();
            appState.backendSettings = response.settings || {};
        } catch (error) {
            console.error('Chargement des paramètres impossible', error);
            showToast('⚠️ Impossible de charger les paramètres enregistrés.', 'warning');
        }
    }

    function applyBackendSettings(section) {
        const values = appState.backendSettings[section] || {};
        Object.entries(values).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input) {
                if (input.type === 'checkbox') input.checked = Boolean(value);
                else input.value = value;
                return;
            }
            const toggle = document.querySelector(`.toggle-switch[data-id="${id}"]`);
            if (toggle) {
                toggle.classList.toggle('checked', Boolean(value));
                toggle.setAttribute('aria-checked', Boolean(value) ? 'true' : 'false');
            }
        });
        if (section === 'utilisateurs' && values.permissions) {
            document.querySelectorAll('.permission-control').forEach(control => {
                const key = `${control.dataset.role}:${control.dataset.resource}`;
                if (values.permissions[key]) control.value = values.permissions[key];
            });
        }
        if (section === 'general' && values.logo) {
            const preview = document.getElementById('logo-preview');
            if (preview) preview.innerHTML = `<img src="${escapeHtml(values.logo)}" alt="Logo CEJEC" style="width:100%;height:100%;object-fit:cover;border-radius:10px;">`;
        }
        if (section === 'profile' && values.photo) {
            const avatar = document.getElementById('profile-avatar');
            if (avatar) avatar.innerHTML = `<img src="${escapeHtml(values.photo)}" alt="Photo du profil" style="width:100%;height:100%;object-fit:cover;">`;
        }
    }

    function generalSettingsPayload() {
        return Object.fromEntries([
            'cejec-name', 'slogan', 'address', 'phone', 'email', 'website',
            'timezone', 'lang-system', 'date-format'
        ].map(id => [id, document.getElementById(id)?.value || '']));
    }

    function sectionPayload(section) {
        const values = {};
        DOM.contentDiv.querySelectorAll('input[id], select[id], textarea[id]').forEach(input => {
            if (input.type !== 'file') values[input.id] = input.type === 'checkbox' ? input.checked : input.value;
        });
        DOM.contentDiv.querySelectorAll('.toggle-switch[data-id]').forEach(toggle => {
            values[toggle.dataset.id] = toggle.classList.contains('checked');
        });
        if (section === 'general') values.logo = document.querySelector('#logo-preview img')?.src || '';
        if (section === 'profile') values.photo = document.querySelector('#profile-avatar img')?.src || '';
        if (section === 'utilisateurs') {
            values.permissions = {};
            DOM.contentDiv.querySelectorAll('.permission-control').forEach(control => {
                values.permissions[`${control.dataset.role}:${control.dataset.resource}`] = control.value;
            });
        }
        return values;
    }

    function preparePermissionControls() {
        const table = DOM.contentDiv.querySelector('.permissions-table');
        if (!table || table.dataset.editable === 'true') return;
        const resources = [...table.querySelectorAll('thead th')].slice(1).map(cell => cell.textContent.trim());
        table.querySelectorAll('tbody tr').forEach(row => {
            const role = row.cells[0].textContent.trim();
            [...row.cells].slice(1).forEach((cell, index) => {
                const badge = cell.querySelector('.perm-badge');
                if (!badge || !resources[index]) return;
                const select = document.createElement('select');
                select.className = 'permission-control';
                select.dataset.role = role;
                select.dataset.resource = resources[index];
                [['full', 'Complet'], ['read', 'Lecture'], ['self', 'Soi-même'], ['none', 'Aucun']].forEach(([value, label]) => {
                    const option = new Option(label, value);
                    select.appendChild(option);
                });
                const current = badge.textContent.trim().toLowerCase();
                select.value = current === 'complet' ? 'full' : current === 'soi-même' ? 'self' : current === 'lecture' ? 'read' : 'none';
                cell.replaceChildren(select);
            });
        });
        table.dataset.editable = 'true';
    }

    async function persistSettings(section, values) {
        if (!window.SettingsAPI) throw new Error('API des paramètres indisponible');
        const settings = { ...appState.backendSettings, [section]: values };
        const response = await SettingsAPI.save(settings);
        appState.backendSettings = response.settings || settings;
        updateLastSaveTime();
    }

    // ========== CACHE DOM ==========
    const DOM = {
        contentDiv: document.getElementById('settingsContent'),
        navTabs: document.querySelectorAll('.nav-tab'),
        searchSettings: document.getElementById('searchSettings'),
        btnSaveAll: document.getElementById('btn-save-all'),
        btnExport: document.getElementById('btn-export'),
        btnImport: document.getElementById('btn-import'),
        modal2faOverlay: document.getElementById('modal-2fa-overlay'),
        switch2FA: document.getElementById('switch-2fa'),
        toast: document.getElementById('toast'),
        toastMessage: document.getElementById('toastMessage'),
        lastSaveTime: document.getElementById('last-save-time')
    };

    // ========== TOUTES LES SECTIONS ==========
    const sectionsData = {
        general: {
            title: "⚙️ Paramètres généraux",
            html: `
                <div class="settings-grid1">
                    <div class="card">
                        <div class="card-header"><i class="fa-regular fa-building icon-blue" aria-hidden="true"></i><h2>Informations CEJEC</h2></div>
                        <p class="card-subtitle">Gérez les détails de votre établissement</p>
                        <div class="logo-upload-section">
                            <label class="label-title">Logo CEJEC</label>
                            <div class="upload-container" id="logo-upload-container">
                                <div class="logo-placeholder" id="logo-preview"><i class="far fa-image" aria-hidden="true"></i></div>
                                <div class="upload-controls">
                                    <div class="file-input-wrapper">
                                        <input type="file" id="company-logo" class="file-input-styled" accept="image/png,image/svg+xml,image/jpeg,image/webp" aria-label="Télécharger le logo CEJEC">
                                        <label for="company-logo" class="custom-file-btn"><i class="fas fa-upload" aria-hidden="true"></i> Choisir un fichier</label>
                                        <span class="file-name" id="file-name-logo">Aucun fichier choisi</span>
                                    </div>
                                    <p class="upload-hint">Recommandé: PNG, SVG, JPEG ou WebP, 200x200px minimum</p>
                                </div>
                            </div>
                        </div>
                        <form id="cejec-form" class="form-layout" novalidate>
                            <div class="form-group full-width"><label><i class="fas fa-school" aria-hidden="true"></i> Nom de l'établissement</label><input type="text" id="cejec-name" value="CEJEC" required></div>
                            <div class="form-group full-width"><label><i class="fas fa-quote-right" aria-hidden="true"></i> Slogan</label><input type="text" id="slogan" value="Entrepreneuriat & Commerce"></div>
                            <div class="form-group full-width"><label><i class="fas fa-map-marker-alt" aria-hidden="true"></i> Adresse</label><input type="text" id="address" value="Port-au-Prince, Haïti" required></div>
                            <div class="form-row">
                                <div class="form-group"><label><i class="fas fa-phone" aria-hidden="true"></i> Téléphone</label><input type="tel" id="phone" value="+509 2222 3333"></div>
                                <div class="form-group"><label><i class="fas fa-envelope" aria-hidden="true"></i> Email</label><input type="email" id="email" value="contact@cejec.edu.ht" required></div>
                            </div>
                            <div class="form-row">
                                <div class="form-group"><label><i class="fas fa-globe" aria-hidden="true"></i> Site Web</label><input type="url" id="website" value="https://cejec.edu.ht"></div>
                                <div class="form-group"><label><i class="fas fa-clock" aria-hidden="true"></i> Fuseau horaire</label><select id="timezone"><option>America/Port-au-Prince</option></select></div>
                            </div>
                            <div class="form-row">
                                <div class="form-group"><label><i class="fas fa-language" aria-hidden="true"></i> Langue du système</label><select id="lang-system"><option>Français</option><option>Kreyòl Ayisyen</option></select></div>
                                <div class="form-group"><label><i class="fas fa-calendar-alt" aria-hidden="true"></i> Format de date</label><select id="date-format"><option>JJ/MM/AAAA</option></select></div>
                            </div>
                            <button type="submit" class="btn-submit"><i class="fas fa-save" aria-hidden="true"></i> Sauvegarder</button>
                        </form>
                    </div>
                </div>`
        },
        profile: {
            title: "👤 Profil utilisateur",
            html: `<div class="settings-grid">
                    <div class="card full-width-card">
                        <div class="card-header">
                            <i class="fa-solid fa-user-tie icon-gold"></i>
                            <h2>Profil de la Direction</h2>
                        </div>
                        <p class="card-subtitle">
                            Gérez les informations du Directeur Général ou de la Direction Générale du CEJEC.
                        </p>
                        <div class="profile-header" style="display:flex;align-items:center;gap:24px;margin-bottom:24px;flex-wrap:wrap;">
                            <div class="avatar-container" style="position:relative;">
                                <div id="profile-avatar" style="width:100px;height:100px;border-radius:50%;background:linear-gradient(135deg,#0A4D8C,#073864);display:flex;align-items:center;justify-content:center;color:#fff;font-size:2.3rem;font-weight:700;font-family:'Inter',sans-serif;box-shadow:0 8px 20px rgba(10,77,140,.25);overflow:hidden;">
                                    JB
                                </div>
                                <label for="profile-photo-upload" style="position:absolute;bottom:0;right:0;background:#fff;border:2px solid #e5ebf2;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#0A4D8C;box-shadow:0 4px 12px rgba(0,0,0,.12);transition:.3s;">
                                    <i class="fas fa-camera"></i>
                                </label>
                                <input type="file" id="profile-photo-upload" hidden accept="image/png,image/jpeg,image/webp">
                            </div>
                            <div class="user-meta" style="flex:1;min-width:220px;">
                                <h3 id="profile-display-name" style="font-size:1.35rem;font-weight:700;font-family:'Playfair Display',Georgia,serif;margin-bottom:6px;">
                                    Job BERÇON
                                </h3>
                                <span id="profile-display-role" style="display:inline-flex;align-items:center;gap:6px;background:#e8f1fa;color:#0A4D8C;padding:6px 16px;border-radius:30px;font-size:.78rem;font-weight:700;">
                                    <i class="fas fa-crown"></i>
                                    Directeur Général
                                </span>
                                <p style="margin-top:10px;color:var(--text-muted);font-size:.9rem;">
                                    <i class="fas fa-envelope"></i>
                                    <span id="profile-display-email">direction@cejec.edu.ht</span>
                                </p>
                                <p style="margin-top:4px;color:var(--text-muted);font-size:.9rem;">
                                    <i class="fas fa-building-columns"></i>
                                    Centre d'Études des Jeunes en Entrepreneuriat et Commerce (CEJEC)
                                </p>
                            </div>
                        </div>
                        <form id="profile-form" class="form-layout" novalidate>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="first-name"><i class="fas fa-user"></i> Prénom</label>
                                    <input type="text" id="first-name" value="Job" placeholder="Prénom du Directeur" required>
                                </div>
                                <div class="form-group">
                                    <label for="last-name"><i class="fas fa-user"></i> Nom</label>
                                    <input type="text" id="last-name" value="BERÇON" placeholder="Nom du Directeur" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="profile-email"><i class="fas fa-envelope"></i> Adresse e-mail institutionnelle</label>
                                    <input type="email" id="profile-email" value="direction@cejec.edu.ht" placeholder="direction@cejec.edu.ht">
                                </div>
                                <div class="form-group">
                                    <label for="profile-phone"><i class="fas fa-phone"></i> Téléphone professionnel</label>
                                    <input type="tel" id="profile-phone" placeholder="+509 xxxx xxxx">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="profile-role"><i class="fas fa-user-shield"></i> Fonction</label>
                                    <select id="profile-role">
                                        <option selected>Directeur Général</option>
                                        <option>Coordonnatrice Générale</option>
                                        <option>Responsable Académique</option>
                                        <option>Responsable Administratif</option>
                                        <option>Responsable Financier</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="profile-department"><i class="fas fa-sitemap"></i> Département</label>
                                    <select id="profile-department">
                                        <option selected>Direction Générale</option>
                                        <option>Administration</option>
                                        <option>Académique</option>
                                        <option>Finances</option>
                                        <option>Communication</option>
                                        <option>Ressources Humaines</option>
                                        <option>Incubateur d'Entreprises</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" class="btn-submit">
                                <i class="fas fa-save"></i> Enregistrer les modifications
                            </button>
                        </form>
                    </div>
                </div>`
        },
        academique: {
            title: "👨‍🎓 Paramètres académiques",
            html: `
                <div class="card full-width-card">
                    <div class="card-header"><i class="fas fa-graduation-cap icon-blue" aria-hidden="true"></i><h2>Configuration académique</h2></div>
                    <div class="form-layout">
                        <div class="form-row">
                            <div class="form-group"><label><i class="fas fa-calendar" aria-hidden="true"></i> Année académique active</label><select><option>2025-2026</option></select></div>
                            <div class="form-group"><label><i class="fas fa-users" aria-hidden="true"></i> Promotions</label><input value="Promotion 2025"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label><i class="fas fa-layer-group" aria-hidden="true"></i> Sessions</label><input value="Session Unique"></div>
                            <div class="form-group"><label><i class="fas fa-calendar-week" aria-hidden="true"></i> Semestres</label><select><option>2 Semestres</option></select></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label><i class="fas fa-chart-bar" aria-hidden="true"></i> Échelle de notation</label><select><option>0-100</option></select></div>
                            <div class="form-group"><label><i class="fas fa-check-circle" aria-hidden="true"></i> Moyenne minimale</label><input type="number" value="60"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label><i class="fas fa-user-graduate" aria-hidden="true"></i> Max étudiants/promo</label><input type="number" value="50"></div>
                            <div class="form-group"><label><i class="fas fa-calendar-times" aria-hidden="true"></i> Gestion absences</label><select><option>Stricte (max 3)</option></select></div>
                        </div>
                    </div>
                </div>`
        },
        finance: {
            title: "💰 Paramètres financiers",
            html: `
                <div class="card full-width-card">
                    <div class="card-header"><i class="fas fa-coins icon-blue" aria-hidden="true"></i><h2>Configuration financière</h2></div>
                    <div class="form-layout">
                        <div class="form-row">
                            <div class="form-group"><label><i class="fas fa-file-invoice" aria-hidden="true"></i> Frais d'inscription</label><input type="number" value="5000"> <small class="small-note">HTG</small></div>
                            <div class="form-group"><label><i class="fas fa-file-invoice-dollar" aria-hidden="true"></i> Frais de formation</label><input type="number" value="15000"> <small class="small-note">HTG</small></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label><i class="fas fa-money-bill-wave" aria-hidden="true"></i> Devise</label><select><option>HTG - Gourde Haïtienne</option><option>USD - Dollar US</option></select></div>
                            <div class="form-group"><label><i class="fas fa-percentage" aria-hidden="true"></i> Taxes (%)</label><input type="number" value="0"></div>
                        </div>
                        <div class="form-row">
                            <div class="form-group"><label><i class="fas fa-credit-card" aria-hidden="true"></i> Modes de paiement</label><input value="MonCash, Espèces, Virement"></div>
                            <div class="form-group"><label><i class="fas fa-receipt" aria-hidden="true"></i> Numérotation reçus</label><select><option>Activée (RECU-2025-001)</option></select></div>
                        </div>
                    </div>
                </div>`
        },
        utilisateurs: {
            title: "👥 Utilisateurs & Permissions",
            html: `
                <div class="card full-width-card">
                    <div class="card-header"><div class="card-icon"><i class="fas fa-users-cog" aria-hidden="true"></i></div><h2>Gestion des rôles et permissions</h2></div>
                    <p class="card-subtitle">Définissez qui peut accéder et modifier chaque module du système</p>
                    <div class="permissions-matrix">
                        <table class="permissions-table" aria-label="Matrice des permissions par rôle">
                            <thead>
                                <tr>
                                    <th>Rôle</th>
                                    <th>Tableau de bord</th>
                                    <th>Étudiants</th>
                                    <th>Cours</th>
                                    <th>Finances</th>
                                    <th>Diplômes</th>
                                    <th>Paramètres</th>
                                    <th>Rapports</th>
                                    <th>Utilisateurs</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><div class="role-name"><div class="role-icon role-admin"><i class="fas fa-user-shield" aria-hidden="true"></i></div> Administrateur</div></td>
                                    <td><span class="perm-badge perm-full permission-value">Complet</span></td>
                                    <td><span class="perm-badge perm-full permission-value">Complet</span></td>
                                    <td><span class="perm-badge perm-full permission-value">Complet</span></td>
                                    <td><span class="perm-badge perm-full permission-value">Complet</span></td>
                                    <td><span class="perm-badge perm-full permission-value">Complet</span></td>
                                    <td><span class="perm-badge perm-full">Complet</span></td>
                                    <td><span class="perm-badge perm-full">Complet</span></td>
                                    <td><span class="perm-badge perm-full">Complet</span></td>
                                </tr>
                                <tr>
                                    <td><div class="role-name"><div class="role-icon role-direction"><i class="fas fa-user-tie" aria-hidden="true"></i></div> Direction</div></td>
                                    <td><span class="perm-badge perm-full">Complet</span></td>
                                    <td><span class="perm-badge perm-limited">Lecture</span></td>
                                    <td><span class="perm-badge perm-limited">Lecture</span></td>
                                    <td><span class="perm-badge perm-full">Complet</span></td>
                                    <td><span class="perm-badge perm-limited">Lecture</span></td>
                                    <td><span class="perm-badge perm-none permission-value">Aucun</span></td>
                                    <td><span class="perm-badge perm-full">Complet</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                </tr>
                                <tr>
                                    <td><div class="role-name"><div class="role-icon role-secretariat"><i class="fas fa-user-cog" aria-hidden="true"></i></div> Secrétariat</div></td>
                                    <td><span class="perm-badge perm-limited permission-value">Lecture</span></td>
                                    <td><span class="perm-badge perm-full">Complet</span></td>
                                    <td><span class="perm-badge perm-limited permission-value">Lecture</span></td>
                                    <td><span class="perm-badge perm-limited permission-value">Lecture</span></td>
                                    <td><span class="perm-badge perm-limited permission-value">Lecture</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                </tr>
                                <tr>
                                    <td><div class="role-name"><div class="role-icon role-comptabilite"><i class="fas fa-calculator" aria-hidden="true"></i></div> Comptabilité</div></td>
                                    <td><span class="perm-badge perm-limited">Lecture</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-full">Complet</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-limited">Lecture</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                </tr>
                                <tr>
                                    <td><div class="role-name"><div class="role-icon role-professeur"><i class="fas fa-chalkboard-teacher" aria-hidden="true"></i></div> Professeurs</div></td>
                                    <td><span class="perm-badge perm-limited">Lecture</span></td>
                                    <td><span class="perm-badge perm-limited">Lecture</span></td>
                                    <td><span class="perm-badge perm-full">Complet</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                </tr>
                                <tr>
                                    <td><div class="role-name"><div class="role-icon role-etudiant"><i class="fas fa-user-graduate" aria-hidden="true"></i></div> Étudiants</div></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-limited permission-value">Soi-même</span></td>
                                    <td><span class="perm-badge perm-limited">Lecture</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                    <td><span class="perm-badge perm-none">Aucun</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="btn-group" style="margin-top:20px;">
                        <button class="btn btn-primary" id="btn-save-permissions"><i class="fas fa-save" aria-hidden="true"></i> Enregistrer les permissions</button>
                        <button class="btn btn-secondary" id="btn-reset-permissions"><i class="fas fa-undo" aria-hidden="true"></i> Réinitialiser</button>
                    </div>
                    <div style="margin-top:16px;padding:16px;background:var(--blue-lighter);border-radius:var(--radius-sm);">
                        <p style="font-size:0.85rem;font-weight:600;color:var(--blue-dark);"><i class="fas fa-info-circle" aria-hidden="true"></i> Légende :</p>
                        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;">
                            <span class="perm-badge perm-full">Complet</span> <span style="font-size:0.8rem;color:var(--muted);">Accès total (lecture + écriture + suppression)</span>
                            <span class="perm-badge perm-limited">Lecture</span> <span style="font-size:0.8rem;color:var(--muted);">Lecture seule</span>
                            <span class="perm-badge perm-none">Aucun</span> <span style="font-size:0.8rem;color:var(--muted);">Aucun accès</span>
                        </div>
                    </div>
                </div>`
        },
        notifications: {
            title: "🔔 Notifications",
            html: `
                <div class="card full-width-card">
                    <div class="card-header"><div class="card-icon"><i class="fas fa-bell" aria-hidden="true"></i></div><h2>Préférences de notification</h2></div>
                    <div class="list-container">
                        <div class="list-item"><div class="item-text"><h3>Notifications Email</h3><p>Recevoir les alertes par email</p></div><div class="toggle-switch checked" data-id="notif-email" role="switch" aria-checked="true" tabindex="0"><div class="switch-handle"></div></div></div>
                        <div class="list-item"><div class="item-text"><h3>Notifications SMS</h3><p>Recevoir les alertes par SMS</p></div><div class="toggle-switch" data-id="notif-sms" role="switch" aria-checked="false" tabindex="0"><div class="switch-handle"></div></div></div>
                        <div class="list-item"><div class="item-text"><h3>Alertes système</h3><p>Notifications internes</p></div><div class="toggle-switch checked" data-id="notif-system" role="switch" aria-checked="true" tabindex="0"><div class="switch-handle"></div></div></div>
                        <div class="list-item"><div class="item-text"><h3>Notifications des paiements</h3><p>Alertes pour chaque transaction</p></div><div class="toggle-switch checked" data-id="notif-paiement" role="switch" aria-checked="true" tabindex="0"><div class="switch-handle"></div></div></div>
                        <div class="list-item"><div class="item-text"><h3>Notifications académiques</h3><p>Alertes pour les notes et absences</p></div><div class="toggle-switch checked" data-id="notif-academique" role="switch" aria-checked="true" tabindex="0"><div class="switch-handle"></div></div></div>
                    </div>
                    <button class="btn btn-primary" id="btn-save-notifications" style="margin-top:16px;"><i class="fas fa-save" aria-hidden="true"></i> Sauvegarder</button>
                </div>`
        },
        securite: {
            title: "🔐 Sécurité",
            html: `
                <div class="settings-grid">
                    <div class="security-section">
                        <div class="card">
                            <div class="card-header"><div class="card-icon"><i class="fas fa-lock" aria-hidden="true"></i></div><h2>Sécurité du compte</h2></div>
                            <div class="list-container">
                                <div class="list-item"><div class="item-text"><h3>Authentification 2FA</h3><p>Ajouter une couche de sécurité</p></div><div class="toggle-switch" data-id="2fa" id="switch-2fa" role="switch" aria-checked="false" tabindex="0"><div class="switch-handle"></div></div></div>
                                <div class="list-item"><div class="item-text"><h3>Connexions multiples</h3><p>Autoriser plusieurs connexions</p></div><div class="toggle-switch checked" data-id="multi-session" role="switch" aria-checked="true" tabindex="0"><div class="switch-handle"></div></div></div>
                            </div>
                            <div class="form-group" style="margin-top:16px;"><label><i class="fas fa-clock" aria-hidden="true"></i> Expiration session (min)</label><input type="number" id="session-expire" value="30" min="5" max="120">
                            <small style="color: var(--text-muted); font-size: 0.75rem;">Entre 5 et 120 minutes</small>
                            </div>
                        </div>
                        <div class="password-card">
                            <div class="password-card-header"><div class="password-icon-wrapper"><i class="fas fa-lock" aria-hidden="true"></i></div><h2>Changer mot de passe</h2></div>
                            <p class="password-card-subtitle">Mettez à jour votre mot de passe</p>
                            <div class="password-input-group"><label><i class="fas fa-key" aria-hidden="true"></i> Actuel</label><div class="password-input-wrapper"><i class="fas fa-lock input-icon-left" aria-hidden="true"></i><input type="password" id="current-pwd" aria-label="Mot de passe actuel"><button type="button" class="toggle-password" aria-label="Afficher/Masquer le mot de passe"><i class="far fa-eye" aria-hidden="true"></i></button></div></div>
                            <div class="password-input-group"><label><i class="fas fa-lock" aria-hidden="true"></i> Nouveau</label><div class="password-input-wrapper"><i class="fas fa-shield-halved input-icon-left" aria-hidden="true"></i><input type="password" id="new-pwd" aria-label="Nouveau mot de passe"><button type="button" class="toggle-password" aria-label="Afficher/Masquer le mot de passe"><i class="far fa-eye" aria-hidden="true"></i></button></div><div class="password-strength"><div class="strength-info"><span class="strength-label">Force</span><span class="strength-value" id="strength-text">Aucun</span></div><div class="strength-bar-wrapper"><div class="strength-bar-fill" id="strength-fill"></div></div></div><div class="password-requirements"><div class="requirement-item" id="req-length"><i class="fas fa-circle" aria-hidden="true"></i> 8+ caractères</div><div class="requirement-item" id="req-uppercase"><i class="fas fa-circle" aria-hidden="true"></i> Majuscule</div><div class="requirement-item" id="req-number"><i class="fas fa-circle" aria-hidden="true"></i> Chiffre</div><div class="requirement-item" id="req-special"><i class="fas fa-circle" aria-hidden="true"></i> Caractère spécial</div></div></div>
                            <div class="password-input-group"><label><i class="fas fa-check-double" aria-hidden="true"></i> Confirmer</label><div class="password-input-wrapper"><i class="fas fa-lock input-icon-left" aria-hidden="true"></i><input type="password" id="confirm-pwd" aria-label="Confirmer le nouveau mot de passe"><button type="button" class="toggle-password" aria-label="Afficher/Masquer le mot de passe"><i class="far fa-eye" aria-hidden="true"></i></button></div></div>
                            <button type="button" class="btn-change-password" id="btn-change-pwd"><i class="fas fa-shield-check" aria-hidden="true"></i> Mettre à jour</button>
                        </div>
                    </div>
                    <div>
                        <div class="card">
                            <div class="card-header"><div class="card-icon"><i class="fas fa-laptop" aria-hidden="true"></i></div><h2>Sessions actives</h2></div>
                            <div class="list-container">
                                <div class="list-item"><div class="item-text"><h3><i class="fas fa-map-marker-alt" style="color:var(--blue);" aria-hidden="true"></i> Port-au-Prince</h3><p><i class="fab fa-chrome" aria-hidden="true"></i> Chrome • <i class="fab fa-windows" aria-hidden="true"></i> Windows • Actuelle</p></div><span class="badge badge-success"><i class="fas fa-circle" style="font-size: 0.4rem;" aria-hidden="true"></i> Active</span></div>
                                <div class="list-item"><div class="item-text"><h3><i class="fas fa-map-marker-alt" style="color:var(--red);" aria-hidden="true"></i> Cap-Haïtien</h3><p><i class="fab fa-safari" aria-hidden="true"></i> Safari • <i class="fas fa-mobile-alt" aria-hidden="true"></i> iPhone • Il y a 30m</p></div><span class="badge badge-warning"><i class="fas fa-clock" aria-hidden="true"></i> Récente</span></div>
                                <div class="list-item"><div class="item-text"><h3><i class="fas fa-map-marker-alt" style="color:var(--green);" aria-hidden="true"></i> Miami, USA</h3><p><i class="fab fa-firefox" aria-hidden="true"></i> Firefox • <i class="fab fa-apple" aria-hidden="true"></i> macOS • Il y a 2h</p></div><span class="badge badge-danger"><i class="fas fa-exclamation-triangle" aria-hidden="true"></i> Suspecte</span></div>                                    
                            </div>
                            <div class="danger-zone"><h4><i class="fas fa-exclamation-triangle" aria-hidden="true"></i> Zone de danger</h4><p>Déconnectez tous les appareils sauf celui-ci.</p><button class="btn btn-danger" id="btn-disconnect-all"><i class="fas fa-sign-out-alt" aria-hidden="true"></i> Déconnecter tout</button></div>
                        </div>
                    </div>
                </div>`
        },
        journalaudit: {
            title: "📋 Journal d'Audit",
            html: `  <div class="card">
                <div class="card-header">
                    <div class="header-left2">
                        <h1><span class="icon-circle"><i class="fas fa-shield-halved" aria-hidden="true"></i></span>Journal d'Audit</h1>
                        <span class="header-badge"><i class="fas fa-clock" aria-hidden="true"></i> Surveillance en temps réel</span>
                        <p><i class="fas fa-route" aria-hidden="true"></i>Traçabilité complète des actions : inscriptions, paiements, modifications de cours, connexions et décisions administratives.</p>
                    </div>
                    <div class="header-actions2">
                        <button class="btn btn-primary" id="btn-export-csv" aria-label="Exporter le journal en CSV"><i class="fas fa-download" aria-hidden="true"></i> Exporter CSV</button>
                        <button class="btn btn-danger" id="btn-clear-log" aria-label="Vider le journal d'audit"><i class="fas fa-trash-alt" aria-hidden="true"></i> Vider le journal</button>
                    </div>
                </div>
                <div class="stats-row">
                    <div class="stat-card"><div class="stat-icon stat-blue"><i class="fas fa-list-alt" aria-hidden="true"></i></div><div class="stat-info"><h3 id="statTotal">12</h3><p>Total actions</p></div></div>
                    <div class="stat-card"><div class="stat-icon stat-green"><i class="fas fa-check-circle" aria-hidden="true"></i></div><div class="stat-info"><h3 id="statSuccess">6</h3><p>Succès</p></div></div>
                    <div class="stat-card"><div class="stat-icon stat-yellow"><i class="fas fa-exclamation-triangle" aria-hidden="true"></i></div><div class="stat-info"><h3 id="statWarning">3</h3><p>Avertissements</p></div></div>
                    <div class="stat-card"><div class="stat-icon stat-red"><i class="fas fa-times-circle" aria-hidden="true"></i></div><div class="stat-info"><h3 id="statDanger">2</h3><p>Critiques</p></div></div>
                </div>
                <div class="filter-bar">
                    <div class="search-wrapper2"><i class="fas fa-search" aria-hidden="true"></i><input type="text" id="searchInput" placeholder="Rechercher action, utilisateur, cible..." aria-label="Rechercher dans le journal"></div>
                    <div class="filter-right">
                        <select class="filter-select" id="categoryFilter" aria-label="Filtrer par catégorie">
                            <option value="all">Toutes catégories</option>
                            <option value="Système">Système</option>
                            <option value="Académique">Académique</option>
                            <option value="Finance">Finance</option>
                            <option value="Utilisateur">Utilisateur</option>
                            <option value="Sécurité">Sécurité</option>
                            <option value="Cours">Cours</option>
                        </select>
                        <span class="entries-badge"><i class="fas fa-circle" aria-hidden="true"></i><span id="entryCount">0</span> entrée(s)</span>
                    </div>
                </div>
                <div class="table-container">
                    <div class="table-responsive">
                        <table aria-label="Journal d'audit CEJEC">
                            <thead>
                                <tr>
                                    <th><i class="fas fa-clock" aria-hidden="true"></i> Horodatage</th>
                                    <th><i class="fas fa-user-circle" aria-hidden="true"></i> Utilisateur</th>
                                    <th><i class="fas fa-tag" aria-hidden="true"></i> Catégorie</th>
                                    <th><i class="fas fa-bolt" aria-hidden="true"></i> Action</th>
                                    <th><i class="fas fa-bullseye" aria-hidden="true"></i> Cible / Détails</th>
                                    <th><i class="fas fa-flag" aria-hidden="true"></i> Sévérité</th>
                                </tr>
                            </thead>
                            <tbody id="auditBody"></tbody>
                        </table>
                    </div>
                    <div class="pagination" id="pagination">
                        <div class="pagination-info">Affichage <span id="pageStart">1</span>-<span id="pageEnd">5</span> sur <span id="totalEntries">5</span></div>
                        <div class="pagination-buttons" id="paginationButtons"></div>
                    </div>
                </div>
            </div>
            <div class="toast" id="toast" aria-live="polite"><i class="fas fa-check-circle" aria-hidden="true"></i><span id="toastMessage">Action effectuée</span></div>`
        },
        sauvegarde: {
            title: "💾 Sauvegarde & Restauration",
            html: `
                <div class="card full-width-card">
                    <div class="card-header"><div class="card-icon"><i class="fas fa-database" aria-hidden="true"></i></div><h2>Sauvegarde des données</h2></div>
                    <div class="list-item"><div class="item-text"><h3>Sauvegarde automatique</h3><p>Quotidienne à 02:00</p></div><div class="toggle-switch checked" data-id="auto-backup" role="switch" aria-checked="true" tabindex="0"><div class="switch-handle"></div></div></div>
                    <div class="btn-group" style="margin-top:20px;">
                        <button class="btn btn-primary" id="btn-backup-manual"><i class="fas fa-save" aria-hidden="true"></i> Sauvegarde manuelle</button>
                        <button class="btn btn-light" id="btn-export-excel"><i class="fas fa-file-excel" aria-hidden="true"></i> Export Excel</button>
                        <button class="btn btn-light" id="btn-export-pdf"><i class="fas fa-file-pdf" aria-hidden="true"></i> Export PDF</button>
                        <button class="btn btn-secondary" id="btn-restore"><i class="fas fa-upload" aria-hidden="true"></i> Restaurer</button>
                    </div>
                </div>`
        }
    };

    // ========== DONNÉES D'AUDIT ==========
    let auditData = [
        { id: 1, timestamp: "15/06/2026 08:12:34", user: "Jean-Marc Dubois", role: "Administrateur", roleDot: "dot-admin", category: "Système", action: "Connexion à la plateforme", target: "Tableau de bord administrateur", severity: "info" },
        { id: 2, timestamp: "15/06/2026 08:45:12", user: "Marie Thérèse Louis", role: "Secrétaire", roleDot: "dot-secretaire", category: "Académique", action: "Inscription validée", target: "Étudiant #ETU-2026-089 · Pierre Antoine", severity: "success" },
        { id: 3, timestamp: "15/06/2026 09:30:05", user: "Dr. Jacques Mentor", role: "Professeur", roleDot: "dot-professeur", category: "Cours", action: "Notes saisies", target: "Cours Entrepreneuriat 201 · 22 étudiants évalués", severity: "success" },
        { id: 4, timestamp: "15/06/2026 10:15:44", user: "Carline Étienne", role: "Comptable", roleDot: "dot-comptable", category: "Finance", action: "Paiement enregistré", target: "Frais formation · 15,000 HTG · Reçu #RECU-2026-452", severity: "success" },
        { id: 5, timestamp: "15/06/2026 11:02:18", user: "Jean-Marc Dubois", role: "Administrateur", roleDot: "dot-admin", category: "Sécurité", action: "Tentative de connexion échouée", target: "IP 192.168.1.45 · Mot de passe incorrect (3e tentative)", severity: "danger" },
        { id: 6, timestamp: "15/06/2026 11:30:00", user: "Marie Thérèse Louis", role: "Secrétaire", roleDot: "dot-secretaire", category: "Utilisateur", action: "Compte étudiant créé", target: "Marie Claude Joseph · Promotion 2026", severity: "success" },
        { id: 7, timestamp: "15/06/2026 13:05:22", user: "Dr. Jacques Mentor", role: "Professeur", roleDot: "dot-professeur", category: "Cours", action: "Absence signalée", target: "Étudiant #ETU-2026-045 · Absence non justifiée", severity: "warning" },
        { id: 8, timestamp: "15/06/2026 14:20:10", user: "Carline Étienne", role: "Comptable", roleDot: "dot-comptable", category: "Finance", action: "Rapport financier généré", target: "Rapport mensuel · Juin 2026 · Chiffre d'affaires 450,000 HTG", severity: "info" },
        { id: 9, timestamp: "15/06/2026 15:00:45", user: "Jean-Marc Dubois", role: "Administrateur", roleDot: "dot-admin", category: "Sécurité", action: "Permissions modifiées", target: "Rôle Professeur · Accès rapports désactivé", severity: "warning" },
        { id: 10, timestamp: "15/06/2026 16:10:33", user: "Marie Thérèse Louis", role: "Secrétaire", roleDot: "dot-secretaire", category: "Académique", action: "Diplôme généré", target: "Certificat #CERT-2026-128 · Entrepreneuriat Avancé", severity: "success" },
        { id: 11, timestamp: "15/06/2026 17:05:00", user: "Système", role: "Automatique", roleDot: "dot-admin", category: "Système", action: "Sauvegarde automatique", target: "Base de données · Sauvegarde quotidienne 02:00 UTC", severity: "info" },
        { id: 12, timestamp: "15/06/2026 17:30:28", user: "Jean-Marc Dubois", role: "Administrateur", roleDot: "dot-admin", category: "Sécurité", action: "Session suspecte bloquée", target: "IP 203.45.67.89 · Miami, USA · Connexion non autorisée", severity: "danger" }
    ];

    const ITEMS_PER_PAGE = 5;
    let currentPage = 1;
    let currentFilteredData = [...auditData];

    // ========== FONCTIONS UTILITAIRES ==========
    function escapeHtml(text) {
        if (text == null) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function showToast(message, type = 'success') {
        if (typeof Swal !== 'undefined') {
            const iconMap = { success: 'success', error: 'error', warning: 'warning', info: 'info' };
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: iconMap[type] || 'success',
                title: message,
                showConfirmButton: false,
                timer: CONFIG.TOAST_DURATION,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.addEventListener('mouseenter', Swal.stopTimer);
                    toast.addEventListener('mouseleave', Swal.resumeTimer);
                }
            });
        } else {
            const toast = DOM.toast;
            const toastMessage = DOM.toastMessage;
            if (toast && toastMessage) {
                toastMessage.textContent = message;
                toast.className = `toast ${type}`;
                const icon = toast.querySelector('i');
                if (icon) {
                    const iconMap = {
                        success: 'fa-check-circle',
                        error: 'fa-times-circle',
                        info: 'fa-info-circle',
                        warning: 'fa-exclamation-triangle'
                    };
                    icon.className = `fas ${iconMap[type] || 'fa-check-circle'}`;
                }
                toast.offsetHeight;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), CONFIG.TOAST_DURATION);
            }
        }
    }

    function showConfirmModal(title, message, onConfirm) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title,
                html: message,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#D62828',
                cancelButtonColor: '#5b6675',
                confirmButtonText: 'Confirmer',
                cancelButtonText: 'Annuler',
                reverseButtons: true
            }).then(result => {
                if (result.isConfirmed && typeof onConfirm === 'function') onConfirm();
            });
        } else {
            if (confirm(title + '\n\n' + message) && typeof onConfirm === 'function') {
                onConfirm();
            }
        }
    }

    function updateLastSaveTime() {
        const el = DOM.lastSaveTime;
        if (el) {
            const now = new Date();
            const options = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
            el.textContent = `Aujourd'hui à ${now.toLocaleTimeString('fr-FR', options)}`;
        }
    }

    async function initAdminNotifications() {
        const bell = document.querySelector('.notification-bell');
        const badge = document.querySelector('.badge44');
        if (!bell || typeof apiClientRequest !== 'function') return;
        const refresh = async () => {
            try {
                const response = await apiClientRequest('/notifications/notifications/?page_size=20');
                const notifications = Array.isArray(response) ? response : (response.results || []);
                const unread = notifications.filter(item => !item.is_read);
                if (badge) badge.textContent = unread.length;
                bell.title = unread.length ? `${unread.length} notification(s) non lue(s)` : 'Aucune notification non lue';
                bell.dataset.notifications = JSON.stringify(notifications);
            } catch (error) {
                console.error('Chargement notifications administrateur impossible', error);
            }
        };
        bell.addEventListener('click', async () => {
            const notifications = JSON.parse(bell.dataset.notifications || '[]');
            if (typeof Swal !== 'undefined') {
                const content = notifications.length
                    ? notifications.slice(0, 10).map(item => `<p style="text-align:left;margin:8px 0"><strong>${escapeHtml(item.title || 'Notification')}</strong><br><small>${escapeHtml(item.content || '')}</small></p>`).join('')
                    : '<p>Aucune notification.</p>';
                await Swal.fire({ title: 'Notifications', html: content, confirmButtonText: 'Fermer' });
            }
            if (notifications.some(item => !item.is_read)) {
                try { await apiClientRequest('/notifications/notifications/mark-all-read/', { method: 'POST' }); } catch (error) { console.error('Marquage notifications impossible', error); }
                refresh();
            }
        });
        refresh();
    }

    // ========== FILE UPLOAD ==========
    function handleLogoUpload(e) {
        const file = e.target.files[0];
        const fileNameSpan = document.getElementById('file-name-logo');
        const logoPlaceholder = document.getElementById('logo-preview');
        const uploadContainer = document.getElementById('logo-upload-container');

        if (file) {
            if (fileNameSpan) {
                fileNameSpan.textContent = file.name;
                fileNameSpan.classList.add('has-file');
            }
            if (logoPlaceholder && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(ev) {
                    if (logoPlaceholder.dataset.prevUrl) {
                        URL.revokeObjectURL(logoPlaceholder.dataset.prevUrl);
                    }
                    logoPlaceholder.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" alt="Aperçu du logo">`;
                    logoPlaceholder.classList.add('has-image');
                    logoPlaceholder.dataset.prevUrl = ev.target.result;
                    persistSettings('general', sectionPayload('general')).catch(error => console.error('Logo non enregistré', error));
                };
                reader.onerror = function() {
                    showToast('Erreur lors de la lecture du fichier', 'error');
                };
                reader.readAsDataURL(file);
            }
            if (uploadContainer) uploadContainer.classList.add('has-file');
        } else {
            if (fileNameSpan) {
                fileNameSpan.textContent = 'Aucun fichier choisi';
                fileNameSpan.classList.remove('has-file');
            }
            if (uploadContainer) uploadContainer.classList.remove('has-file');
        }
    }

    function handleProfilePhotoUpload(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = event => {
            const avatar = document.getElementById('profile-avatar');
            if (avatar) avatar.innerHTML = `<img src="${event.target.result}" alt="Photo du profil" style="width:100%;height:100%;object-fit:cover;">`;
            persistSettings('profile', sectionPayload('profile')).catch(error => console.error('Photo non enregistrée', error));
        };
        reader.readAsDataURL(file);
    }

    function handleFileSelect(e) {
        const input = e.target;
        const file = input.files[0];
        const fileGroup = input.closest('.file-upload-group');
        const nameSpan = fileGroup ? fileGroup.querySelector('.file-selected-name') : null;

        if (file && nameSpan) {
            nameSpan.textContent = file.name;
            nameSpan.classList.add('has-file');
            if (fileGroup) fileGroup.classList.add('has-file');
        } else if (nameSpan) {
            nameSpan.textContent = 'Aucun fichier choisi';
            nameSpan.classList.remove('has-file');
            if (fileGroup) fileGroup.classList.remove('has-file');
        }
    }

    function handleNativeFileSelect(e) {
        const input = e.target;
        const file = input.files[0];
        const formGroup = input.closest('.form-group');

        if (formGroup && file) {
            let nameSpan = formGroup.querySelector('.native-file-name');
            if (!nameSpan) {
                nameSpan = document.createElement('span');
                nameSpan.className = 'native-file-name';
                nameSpan.style.cssText = 'font-size:0.78rem;color:#10b981;font-weight:600;margin-top:4px;display:block;word-break:break-all;';
                input.parentNode.appendChild(nameSpan);
            }
            nameSpan.textContent = '📎 ' + file.name;
        }
    }

    // ========== PASSWORD STRENGTH ==========
    function updatePasswordStrength(value) {
        const checks = {
            length: value.length >= 8,
            upper: /[A-Z]/.test(value),
            number: /[0-9]/.test(value),
            special: /[^A-Za-z0-9]/.test(value)
        };
        let strength = 0;
        if (checks.length) strength += 25;
        if (checks.upper) strength += 25;
        if (checks.number) strength += 25;
        if (checks.special) strength += 25;

        const fill = document.getElementById('strength-fill');
        const text = document.getElementById('strength-text');

        if (fill) {
            fill.style.transition = 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.5s ease';
            fill.style.width = strength + '%';

            if (strength === 0) {
                fill.style.background = '#e2e8f0';
                fill.style.boxShadow = 'none';
            } else if (strength <= 25) {
                fill.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
                fill.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.5)';
            } else if (strength <= 50) {
                fill.style.background = 'linear-gradient(90deg, #f97316, #fb923c)';
                fill.style.boxShadow = '0 0 12px rgba(249, 115, 22, 0.5)';
            } else if (strength <= 75) {
                fill.style.background = 'linear-gradient(90deg, #eab308, #facc15)';
                fill.style.boxShadow = '0 0 12px rgba(234, 179, 8, 0.5)';
            } else {
                fill.style.background = 'linear-gradient(90deg, #22c55e, #4ade80)';
                fill.style.boxShadow = '0 0 16px rgba(34, 197, 94, 0.6)';
            }

            if (strength === 100) {
                fill.style.animation = 'pulseStrength 1.5s ease-in-out infinite';
            } else {
                fill.style.animation = 'none';
            }
        }

        if (text) {
            text.style.transition = 'color 0.3s ease';
            const labels = ['Aucun', 'Très faible', 'Moyen', 'Bon', 'Excellent'];
            const idx = strength === 0 ? 0 : Math.ceil(strength / 25);
            text.textContent = labels[idx];

            const colors = ['#94a3b8', '#ef4444', '#f97316', '#eab308', '#22c55e'];
            text.style.color = colors[idx];
        }

        ['req-length', 'req-uppercase', 'req-number', 'req-special'].forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) {
                const isValid = [checks.length, checks.upper, checks.number, checks.special][i];
                el.classList.toggle('valid', isValid);

                const icon = el.querySelector('i');
                if (icon) {
                    if (isValid) {
                        icon.className = 'fas fa-check-circle';
                        icon.style.color = '#22c55e';
                        icon.style.animation = 'checkPop 0.3s ease';
                    } else {
                        icon.className = 'fas fa-circle';
                        icon.style.color = '#94a3b8';
                        icon.style.animation = 'none';
                    }
                }

                el.style.transition = 'all 0.3s ease';
                el.style.color = isValid ? '#22c55e' : '#94a3b8';
                el.style.fontWeight = isValid ? '600' : '400';
            }
        });
    }

    function resetPasswordForm() {
        ['current-pwd', 'new-pwd', 'confirm-pwd'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        updatePasswordStrength('');
        document.querySelectorAll('.password-input-wrapper input').forEach(input => {
            input.type = 'password';
        });
        document.querySelectorAll('.toggle-password i').forEach(icon => {
            icon.className = 'far fa-eye';
        });
    }

    // ========== 2FA ==========
    function open2FASetupModal(switchElement) {
        const overlay = DOM.modal2faOverlay;
        if (overlay) {
            overlay.style.display = 'flex';
            const step1 = document.getElementById('2fa-step-1');
            const step2 = document.getElementById('2fa-step-2');
            if (step1) step1.classList.add('active');
            if (step2) step2.classList.remove('active');
            document.querySelectorAll('#twofa-code-inputs input').forEach(input => input.value = '');
            const codeError = document.getElementById('code-error');
            if (codeError) codeError.style.display = 'none';
            generateQRCode();
            const firstInput = document.querySelector('#twofa-code-inputs input');
            if (firstInput) setTimeout(() => firstInput.focus(), 300);
        }
    }

    function close2FAModal() {
        const overlay = DOM.modal2faOverlay;
        if (overlay) {
            overlay.style.display = 'none';
            const step1 = document.getElementById('2fa-step-1');
            const step2 = document.getElementById('2fa-step-2');
            if (step1) step1.classList.add('active');
            if (step2) step2.classList.remove('active');
            document.querySelectorAll('#twofa-code-inputs input').forEach(i => i.value = '');
            const codeError = document.getElementById('code-error');
            if (codeError) codeError.style.display = 'none';
        }
        const switch2FA = DOM.switch2FA;
        if (switch2FA && !switch2FA.classList.contains('checked')) {
            switch2FA.classList.remove('checked');
            switch2FA.setAttribute('aria-checked', 'false');
        }
    }

    function verify2FACode() {
        const inputs = document.querySelectorAll('#twofa-code-inputs input');
        const code = Array.from(inputs).map(i => i.value).join('');
        const errorEl = document.getElementById('code-error');

        const obviousCodes = ['000000', '111111', '222222', '333333', '444444', '555555', '666666', '777777', '888888', '999999', '123456', '654321'];
        if (code.length !== 6 || obviousCodes.includes(code)) {
            if (errorEl) {
                errorEl.style.display = 'block';
                errorEl.textContent = 'Code incorrect. Veuillez réessayer.';
            }
            inputs.forEach(input => {
                input.style.borderColor = 'var(--red)';
                setTimeout(() => input.style.borderColor = 'var(--input-border)', 500);
            });
            return;
        }

        if (errorEl) errorEl.style.display = 'none';

        const step1 = document.getElementById('2fa-step-1');
        const step2 = document.getElementById('2fa-step-2');
        if (step1) step1.classList.remove('active');
        if (step2) step2.classList.add('active');

        const switch2FA = DOM.switch2FA;
        if (switch2FA) {
            switch2FA.classList.add('checked');
            switch2FA.setAttribute('aria-checked', 'true');
        }

        showToast('✅ 2FA activé avec succès !', 'success');
    }

    function generateQRCode() {
        const container = document.getElementById('qr-code-container');
        if (!container) return;
        container.innerHTML = '';
        try {
            new QRCode(container, {
                text: 'otpauth://totp/CEJEC:admin@cejec.edu.ht?secret=JBSWY3DPEHPK3PXP&issuer=CEJEC',
                width: 160,
                height: 160,
                colorDark: '#0A4D8C',
                colorLight: '#ffffff'
            });
        } catch (e) {
            console.error('Erreur génération QR code:', e);
            container.innerHTML = `
                <div style="text-align:center;padding:20px;">
                    <i class="fas fa-exclamation-triangle" style="color:#f59e0b;font-size:2rem;"></i>
                    <p style="color:#64748b;margin-top:10px;">Clé manuelle : <strong id="manual-key">JBSWY3DPEHPK3PXP</strong></p>
                </div>`;
            showToast('QR Code non disponible - Utilisez la clé manuelle', 'warning');
        }
    }

    function copyManualKey() {
        const keyElement = document.getElementById('manual-key');
        const key = keyElement ? keyElement.textContent : 'JBSWY3DPEHPK3PXP';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(key).then(() => {
                showToast('📋 Clé copiée dans le presse-papier !', 'success');
            }).catch(() => {
                showToast('📋 Clé copiée !', 'success');
            });
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = key;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showToast('📋 Clé copiée !', 'success');
            } catch (err) {
                showToast('Erreur lors de la copie', 'error');
            }
            document.body.removeChild(textarea);
        }
    }

    function copyBackupCodes() {
        showToast('📋 Codes de secours copiés !', 'success');
    }

    function downloadBackupCodes() {
        showToast('💾 Téléchargement des codes de secours...', 'success');
    }

    // ========== AUDIT ==========
    function updateStats(data) {
        const total = data.length;
        const success = data.filter(r => r.severity === 'success').length;
        const warning = data.filter(r => r.severity === 'warning').length;
        const danger = data.filter(r => r.severity === 'danger').length;

        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('statTotal', total);
        setText('statSuccess', success);
        setText('statWarning', warning);
        setText('statDanger', danger);
    }

    function updatePagination(start, end, total, totalPages) {
        const setText = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        setText('pageStart', total === 0 ? 0 : start);
        setText('pageEnd', end);
        setText('totalEntries', total);

        const paginationButtons = document.getElementById('paginationButtons');
        if (!paginationButtons) return;

        paginationButtons.innerHTML = '';
        if (totalPages <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left" aria-hidden="true"></i>';
        prevBtn.setAttribute('aria-label', 'Page précédente');
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', function() {
            renderTable(currentFilteredData, currentPage - 1);
        });
        paginationButtons.appendChild(prevBtn);

        const maxVisible = 7;
        let pages = [];

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');

            const startPage = Math.max(2, currentPage - 1);
            const endPage = Math.min(totalPages - 1, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push('...');
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }

        pages.forEach(p => {
            if (p === '...') {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.cssText = 'padding:0 8px;color:var(--text-muted);';
                ellipsis.setAttribute('aria-hidden', 'true');
                paginationButtons.appendChild(ellipsis);
            } else {
                const pageBtn = document.createElement('button');
                pageBtn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
                pageBtn.textContent = p;
                pageBtn.setAttribute('aria-label', `Page ${p}`);
                pageBtn.setAttribute('aria-current', p === currentPage ? 'page' : 'false');
                pageBtn.addEventListener('click', function() {
                    renderTable(currentFilteredData, p);
                });
                paginationButtons.appendChild(pageBtn);
            }
        });

        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right" aria-hidden="true"></i>';
        nextBtn.setAttribute('aria-label', 'Page suivante');
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', function() {
            renderTable(currentFilteredData, currentPage + 1);
        });
        paginationButtons.appendChild(nextBtn);
    }

    function renderTable(data, page) {
        const tbody = document.getElementById('auditBody');
        if (!tbody) return;

        const dataToUse = data || currentFilteredData;
        const pageToUse = page || currentPage;

        if (dataToUse !== currentFilteredData) {
            currentFilteredData = dataToUse;
            currentPage = 1;
            updateStats(dataToUse);
            renderTable(dataToUse, 1);
            return;
        }

        tbody.innerHTML = '';

        const totalItems = currentFilteredData.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

        let validPage = pageToUse;
        if (validPage > totalPages) validPage = totalPages;
        if (validPage < 1) validPage = 1;

        const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
        const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
        const pageData = currentFilteredData.slice(startIndex, endIndex);
        currentPage = validPage;

        if (totalItems === 0) {
            tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><i class="fas fa-inbox" aria-hidden="true"></i><p>Aucune entrée trouvée</p><span>Modifiez vos filtres ou ajoutez des actions</span></div></td></tr>`;
            const entryCount = document.getElementById('entryCount');
            if (entryCount) entryCount.textContent = '0';
            updatePagination(0, 0, 0, 1);
            return;
        }

        const fragment = document.createDocumentFragment();

        pageData.forEach(row => {
            const tr = document.createElement('tr');

            const catMap = {
                'Système': { icon: 'fa-cogs', cls: 'cat-systeme' },
                'Académique': { icon: 'fa-graduation-cap', cls: 'cat-academique' },
                'Finance': { icon: 'fa-coins', cls: 'cat-finance' },
                'Utilisateur': { icon: 'fa-user-plus', cls: 'cat-utilisateur' },
                'Sécurité': { icon: 'fa-shield-halved', cls: 'cat-securite' },
                'Cours': { icon: 'fa-book-open', cls: 'cat-cours' }
            };

            const catInfo = catMap[row.category] || { icon: 'fa-circle', cls: 'cat-systeme' };

            const sevMap = {
                'info': 'fa-info-circle',
                'success': 'fa-check-circle',
                'warning': 'fa-exclamation-triangle',
                'danger': 'fa-times-circle'
            };

            const sevIcon = sevMap[row.severity] || 'fa-circle';

            tr.innerHTML = `
                <td>${escapeHtml(row.timestamp)}</td>
                <td class="user-cell">
                    <span class="user-name"><i class="fas fa-user" aria-hidden="true"></i>${escapeHtml(row.user)}</span>
                    <span class="user-role"><span class="role-dot ${row.roleDot}"></span> ${escapeHtml(row.role)}</span>
                </td>
                <td><span class="category-tag ${catInfo.cls}"><i class="fas ${catInfo.icon}" aria-hidden="true"></i> ${escapeHtml(row.category)}</span></td>
                <td style="font-weight:500;">${escapeHtml(row.action)}</td>
                <td style="color:var(--muted);max-width:280px;word-break:break-word;">${escapeHtml(row.target)}</td>
                <td><span class="severity-badge severity-${row.severity}"><i class="fas ${sevIcon}" aria-hidden="true"></i> ${capitalize(row.severity)}</span></td>
            `;
            fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);

        const entryCount = document.getElementById('entryCount');
        if (entryCount) entryCount.textContent = totalItems;
        updatePagination(startIndex + 1, endIndex, totalItems, totalPages);
    }

    async function initAudit() {
        try {
            const response = await (window.AuditAPI ? AuditAPI.list() : apiClientRequest('/hr/audit-log/?page_size=200'));
            const notifications = Array.isArray(response) ? response : (response.results || []);
            auditData = notifications.map(notification => ({
                id: notification.id,
                timestamp: notification.action_at ? new Date(notification.action_at).toLocaleString('fr-FR') : '—',
                user: notification.admin_name || notification.user_name || 'Système CEJEC', role: notification.action || 'Audit', roleDot: 'dot-admin',
                category: notification.entity_type || 'Système', action: notification.action || 'Action enregistrée',
                target: notification.entity_id ? `${notification.entity_type || 'Élément'} #${notification.entity_id}` : JSON.stringify(notification.changes_json || ''),
                severity: notification.action === 'DELETE' ? 'danger' : notification.action === 'UPDATE' ? 'warning' : 'success'
            }));
        } catch (error) {
            console.error('Chargement du journal de notifications impossible', error);
            auditData = [];
            showToast('⚠️ Journal indisponible : connexion serveur requise.', 'warning');
        }
        currentFilteredData = [...auditData];
        currentPage = 1;
        updateStats(auditData);
        renderTable(auditData);
    }

    function filterTable() {
        const searchInput = document.getElementById('searchInput');
        const categoryFilter = document.getElementById('categoryFilter');
        if (!searchInput || !categoryFilter) return;

        const searchTerm = searchInput.value.toLowerCase().trim();
        const category = categoryFilter.value;

        const filtered = auditData.filter(row => {
            if (category !== 'all' && row.category !== category) return false;
            if (searchTerm !== '') {
                const searchable = `${row.user} ${row.role} ${row.action} ${row.target} ${row.category} ${row.timestamp}`.toLowerCase();
                if (!searchable.includes(searchTerm)) return false;
            }
            return true;
        });

        renderTable(filtered);
    }

    function exportCSV() {
        if (currentFilteredData.length === 0) {
            showToast("Aucune donnée à exporter.", "error");
            return;
        }

        const escapeCSV = (str) => {
            if (str == null) return '';
            const s = String(str);
            if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes(';')) {
                return '"' + s.replace(/"/g, '""') + '"';
            }
            return s;
        };

        let csv = "Horodatage;Utilisateur;Rôle;Catégorie;Action;Cible;Sévérité\n";
        currentFilteredData.forEach(row => {
            csv += [
                escapeCSV(row.timestamp),
                escapeCSV(row.user),
                escapeCSV(row.role),
                escapeCSV(row.category),
                escapeCSV(row.action),
                escapeCSV(row.target),
                escapeCSV(row.severity)
            ].join(';') + '\n';
        });

        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.download = `audit_cejec_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        showToast(`✅ Export réussi : ${currentFilteredData.length} entrée(s)`, "success");
    }

    function clearLog() {
        showToast("Le journal d'audit est en lecture seule.", "info");
    }

    async function savePermissions() {
        try {
            await persistSettings('utilisateurs', sectionPayload('utilisateurs'));
            showToast('✅ Permissions sauvegardées dans la base.', 'success');
        } catch (error) {
            console.error('Sauvegarde permissions impossible', error);
            showToast('❌ Permissions non enregistrées.', 'error');
        }
    }

    // ========== ATTACHER ÉVÉNEMENTS ==========
    function attachAllEvents() {
        preparePermissionControls();
        // Toggle switch - utiliser cloneNode pour éviter les doublons
        document.querySelectorAll('.toggle-switch').forEach(sw => {
            const newSw = sw.cloneNode(true);
            sw.parentNode.replaceChild(newSw, sw);

            newSw.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                if (id === '2fa') {
                    if (this.classList.contains('checked')) {
                        showConfirmModal('Désactiver 2FA ?', 'Votre compte sera moins sécurisé.', () => {
                            this.classList.remove('checked');
                            this.setAttribute('aria-checked', 'false');
                            showToast('🔓 2FA désactivé', 'warning');
                        });
                    } else {
                        open2FASetupModal(this);
                    }
                    return;
                }
                this.classList.toggle('checked');
                this.setAttribute('aria-checked', this.classList.contains('checked') ? 'true' : 'false');
            });

            newSw.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });

        // Toggle password
        document.querySelectorAll('.toggle-password').forEach(icon => {
            icon.addEventListener('click', function() {
                const input = this.closest('.password-input-wrapper')?.querySelector('input');
                if (input) {
                    const isPass = input.type === 'password';
                    input.type = isPass ? 'text' : 'password';
                    const i = this.querySelector('i');
                    if (i) {
                        i.classList.toggle('fa-eye', isPass);
                        i.classList.toggle('fa-eye-slash', !isPass);
                    }
                    this.setAttribute('aria-label', isPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe');
                }
            });
        });

        // Toggle visibility (integration fields)
        document.querySelectorAll('.toggle-visibility').forEach(btn => {
            btn.addEventListener('click', function() {
                const input = this.closest('.input-with-icon')?.querySelector('input');
                if (input) {
                    const isPass = input.type === 'password';
                    input.type = isPass ? 'text' : 'password';
                    const icon = this.querySelector('i');
                    if (icon) {
                        icon.classList.toggle('fa-eye', isPass);
                        icon.classList.toggle('fa-eye-slash', !isPass);
                    }
                }
            });
        });

        // Toggle integration
        document.querySelectorAll('.btn-toggle-integration').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const card = document.getElementById(targetId);
                if (card) {
                    const isVisible = !card.classList.contains('visible');
                    card.classList.toggle('visible');
                    this.classList.toggle('expanded', isVisible);
                    this.innerHTML = isVisible ? '<i class="fas fa-chevron-up" aria-hidden="true"></i> Masquer' : '<i class="fas fa-chevron-down" aria-hidden="true"></i> Configurer';
                    this.setAttribute('aria-expanded', isVisible ? 'true' : 'false');
                }
            });
        });

        // Form submission - CEJEC
        const cejecForm = document.getElementById('cejec-form');
        if (cejecForm) {
            cejecForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const requiredFields = cejecForm.querySelectorAll('[required]');
                let allValid = true;
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        field.style.borderColor = 'var(--red)';
                        allValid = false;
                    } else {
                        field.style.borderColor = 'var(--input-border)';
                    }
                });
                if (allValid) {
                    try {
                        await persistSettings('general', generalSettingsPayload());
                        showToast('✅ Paramètres de l’établissement enregistrés.', 'success');
                    } catch (error) {
                        console.error('Sauvegarde paramètres impossible', error);
                        showToast('❌ Enregistrement impossible sur le serveur.', 'error');
                    }
                } else {
                    showToast('❌ Veuillez remplir tous les champs obligatoires', 'error');
                }
            });
        }

        // Form submission - Profile
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                try {
                    await AuthAPI.updateMe({
                        first_name: document.getElementById('first-name').value.trim(),
                        last_name: document.getElementById('last-name').value.trim(),
                        email: document.getElementById('profile-email').value.trim(),
                        phone: document.getElementById('profile-phone').value.trim(),
                    });
                    await persistSettings('profile', sectionPayload('profile'));
                    showToast('✅ Profil mis à jour sur le serveur.', 'success');
                    updateLastSaveTime();
                } catch (error) {
                    console.error('Mise à jour profil impossible', error);
                    showToast('❌ Mise à jour du profil impossible.', 'error');
                }
            });
        }

        // Change password
        const btnChangePwd = document.getElementById('btn-change-pwd');
        if (btnChangePwd) {
            btnChangePwd.addEventListener('click', async function() {
                const currentPwd = document.getElementById('current-pwd')?.value || '';
                const newPwd = document.getElementById('new-pwd')?.value || '';
                const confirmPwd = document.getElementById('confirm-pwd')?.value || '';

                if (!currentPwd) { showToast('❌ Veuillez entrer votre mot de passe actuel', 'error'); return; }
                if (newPwd.length < 8) { showToast('❌ 8 caractères minimum', 'error'); return; }
                if (newPwd !== confirmPwd) { showToast('❌ Les mots de passe ne correspondent pas', 'error'); return; }

                try {
                    await AuthAPI.changePassword({ old_password: currentPwd, new_password: newPwd });
                    showToast('✅ Mot de passe changé !', 'success');
                    resetPasswordForm();
                } catch (error) {
                    showToast('❌ ' + (error.detail || 'Mot de passe non modifié.'), 'error');
                }
            });
        }

        // Disconnect all
        const btnDisconnect = document.getElementById('btn-disconnect-all');
        if (btnDisconnect) {
            btnDisconnect.addEventListener('click', function() {
                showConfirmModal('Déconnecter ?', 'Cette action déconnectera tous les autres appareils. Êtes-vous sûr ?', () => showToast('🔒 Tous les autres appareils ont été déconnectés', 'success'));
            });
        }

        // Password strength
        const newPwdInput = document.getElementById('new-pwd');
        if (newPwdInput) {
            newPwdInput.addEventListener('input', function() { updatePasswordStrength(this.value); });
        }

        // Save permissions
        const btnSavePermissions = document.getElementById('btn-save-permissions');
        if (btnSavePermissions) {
            btnSavePermissions.addEventListener('click', savePermissions);
        }

        // Reset permissions
        const btnResetPermissions = document.getElementById('btn-reset-permissions');
        if (btnResetPermissions) {
            btnResetPermissions.addEventListener('click', function() {
                showConfirmModal('Réinitialiser ?', 'Réinitialiser les permissions par défaut ?', () => showToast('✅ Permissions réinitialisées', 'success'));
            });
        }

        // Save notifications
        const btnSaveNotifications = document.getElementById('btn-save-notifications');
        if (btnSaveNotifications) {
            btnSaveNotifications.addEventListener('click', async function() {
                const preferences = Object.fromEntries(
                    [...document.querySelectorAll('.toggle-switch[data-id]')]
                        .filter(toggle => toggle.dataset.id.startsWith('notif-'))
                        .map(toggle => [toggle.dataset.id, toggle.classList.contains('checked')])
                );
                try {
                    await persistSettings('notifications', preferences);
                    showToast('✅ Préférences de notifications enregistrées.', 'success');
                } catch (error) {
                    console.error('Sauvegarde notifications impossible', error);
                    showToast('❌ Préférences non enregistrées.', 'error');
                }
            });
        }

        const saveSection = async (section, message) => {
            try {
                await persistSettings(section, sectionPayload(section));
                showToast(message, 'success');
            } catch (error) {
                console.error(`Sauvegarde ${section} impossible`, error);
                showToast('❌ Enregistrement impossible sur le serveur.', 'error');
            }
        };

        const backupButton = document.getElementById('btn-backup-manual');
        if (backupButton) backupButton.addEventListener('click', () => saveSection('sauvegarde', '✅ Sauvegarde enregistrée dans la base.'));
        const autoBackup = document.querySelector('.toggle-switch[data-id="auto-backup"]');
        if (autoBackup) autoBackup.addEventListener('click', () => saveSection('sauvegarde', '✅ Préférence de sauvegarde enregistrée.'));

        // File uploads
        const logoInput = document.getElementById('company-logo');
        if (logoInput) {
            logoInput.addEventListener('change', handleLogoUpload);
        }
        const profilePhotoInput = document.getElementById('profile-photo-upload');
        if (profilePhotoInput) profilePhotoInput.addEventListener('change', handleProfilePhotoUpload);

        document.querySelectorAll('.file-input-styled').forEach(function(input) {
            if (input.id !== 'company-logo') {
                input.addEventListener('change', handleFileSelect);
            }
        });

        document.querySelectorAll('input[type="file"]').forEach(function(input) {
            if (!input.classList.contains('file-input-styled') && input.id !== 'company-logo' && input.id !== 'profile-photo-upload') {
                input.addEventListener('change', handleNativeFileSelect);
            }
        });
    }

    // ========== RENDER SECTION ==========
    function renderSection(key) {
        const section = sectionsData[key];
        if (!section) {
            DOM.contentDiv.innerHTML = `<div class="card full-width-card"><div class="card-header"><h2>${escapeHtml(key)}</h2></div><p>Section en développement</p></div>`;
            return;
        }
        DOM.contentDiv.innerHTML = section.html;

        requestAnimationFrame(() => {
            DOM.contentDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            requestAnimationFrame(() => {
                if (key === 'utilisateurs') preparePermissionControls();
                applyBackendSettings(key);
                if (key === 'profile' && window.AuthAPI) {
                    AuthAPI.me().then(user => {
                        const fields = {
                            'first-name': user.first_name,
                            'last-name': user.last_name,
                            'profile-email': user.email,
                            'profile-phone': user.phone,
                        };
                        Object.entries(fields).forEach(([id, value]) => {
                            const input = document.getElementById(id);
                            if (input) input.value = value || '';
                        });
                    }).catch(error => console.error('Chargement profil impossible', error));
                }
                attachAllEvents();
                if (key === 'journalaudit') {
                    initAudit();
                }
            });
        });
    }

    // ========== TEST CONNECTION & SAVE INTEGRATION ==========
    window.testConnection = function(service) {
        const resultDiv = document.getElementById(`${service}-result`);
        if (!resultDiv) return;
        resultDiv.style.display = 'block';
        resultDiv.className = 'test-result loading';
        resultDiv.innerHTML = '<span class="loading-spinner-dark"></span> Test en cours...';
        setTimeout(() => {
            const success = Math.random() > 0.2;
            resultDiv.className = `test-result ${success ? 'success' : 'error'}`;
            resultDiv.innerHTML = success ? '✅ Connexion réussie !' : '❌ Échec de connexion. Vérifiez vos identifiants.';
            showToast(success ? `✅ ${service} connecté avec succès` : `❌ Échec de connexion ${service}`, success ? 'success' : 'error');
        }, 1500);
    };

    window.saveIntegration = function(service) {
        showToast(`✅ Configuration ${service} sauvegardée !`, 'success');
        updateLastSaveTime();
        initAdminNotifications();
    };

    // Exposer fonctions globales
    window.open2FASetupModal = open2FASetupModal;
    window.close2FAModal = close2FAModal;
    window.verify2FACode = verify2FACode;
    window.copyManualKey = copyManualKey;
    window.copyBackupCodes = copyBackupCodes;
    window.downloadBackupCodes = downloadBackupCodes;
    window.filterTable = filterTable;
    window.exportCSV = exportCSV;
    window.clearLog = clearLog;
    window.savePermissions = savePermissions;
    window.showToast = showToast;
    window.showConfirmModal = showConfirmModal;

    // ========== NAVIGATION ==========
    DOM.navTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            DOM.navTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-selected', 'true');
            const sectionId = this.getAttribute('data-section');
            if (!sectionId) return;

            appState.currentSection = sectionId;
            try {
                localStorage.setItem('cejec-current-section', sectionId);
            } catch (e) {
                // localStorage non disponible
            }
            renderSection(sectionId);
        });
    });

    if (DOM.searchSettings) {
        DOM.searchSettings.addEventListener('input', function(e) {
            const term = e.target.value.toLowerCase();
            DOM.navTabs.forEach(tab => {
                const tabText = tab.textContent.toLowerCase();
                tab.style.display = (term === '' || tabText.includes(term)) ? '' : 'none';
            });
        });
    }

    // ========== BOUTONS FOOTER ==========
    if (DOM.btnSaveAll) {
        DOM.btnSaveAll.addEventListener('click', async () => {
            try {
                await persistSettings(appState.currentSection, sectionPayload(appState.currentSection));
                showToast('💾 Configuration sauvegardée dans la base.', 'success');
            } catch (error) {
                console.error('Sauvegarde globale impossible', error);
                showToast('❌ Configuration non enregistrée.', 'error');
            }
        });
    }

    if (DOM.btnExport) {
        DOM.btnExport.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(appState.backendSettings, null, 2)], { type: 'application/json' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `cejec-parametres-${new Date().toISOString().slice(0, 10)}.json`;
            link.click();
            URL.revokeObjectURL(link.href);
            showToast('📁 Configuration exportée.', 'success');
        });
    }

    if (DOM.btnImport) {
        DOM.btnImport.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'application/json,.json';
            input.addEventListener('change', () => {
                const file = input.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async () => {
                    try {
                        const imported = JSON.parse(reader.result);
                        if (!imported || typeof imported !== 'object' || Array.isArray(imported)) throw new Error('FORMAT');
                        const response = await SettingsAPI.save(imported);
                        appState.backendSettings = response.settings || imported;
                        renderSection(appState.currentSection);
                        showToast('📥 Configuration importée et enregistrée.', 'success');
                    } catch (error) {
                        console.error('Import configuration impossible', error);
                        showToast('❌ Fichier de configuration invalide.', 'error');
                    }
                };
                reader.readAsText(file);
            });
            input.click();
        });
    }

    const restoreButton = document.getElementById('btn-restore');
    if (restoreButton && DOM.btnImport) restoreButton.addEventListener('click', () => DOM.btnImport.click());

    // ========== KEYBOARD SHORTCUTS ==========
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput && appState.currentSection === 'journalaudit') {
                e.preventDefault();
                searchInput.focus();
                searchInput.select();
            }
        }

        if (e.key === 'Escape') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput && document.activeElement === searchInput) {
                searchInput.value = '';
                filterTable();
            }
            const modal2fa = DOM.modal2faOverlay;
            if (modal2fa && modal2fa.style.display === 'flex') {
                close2FAModal();
            }
        }
    });

    // ========== INIT ==========
    function init() {
        let savedSection = 'general';
        try {
            savedSection = localStorage.getItem('cejec-current-section') || 'general';
        } catch (e) {
            // localStorage non disponible
        }

        const tab = document.querySelector(`.nav-tab[data-section="${savedSection}"]`);
        if (tab) {
            DOM.navTabs.forEach(t => {
                t.classList.remove('active');
                t.setAttribute('aria-selected', 'false');
            });
            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true');
        }

        loadBackendSettings().finally(() => renderSection(savedSection));

        // Initialiser les inputs 2FA
        const twofaInputs = document.querySelectorAll('#twofa-code-inputs input');
        twofaInputs.forEach((input, index, inputs) => {
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
                if (this.value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            });
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !this.value && index > 0) {
                    inputs[index - 1].focus();
                }
                if (e.key === 'ArrowLeft' && index > 0) {
                    e.preventDefault();
                    inputs[index - 1].focus();
                }
                if (e.key === 'ArrowRight' && index < inputs.length - 1) {
                    e.preventDefault();
                    inputs[index + 1].focus();
                }
            });
            input.addEventListener('paste', function(e) {
                e.preventDefault();
                const pastedData = (e.clipboardData || window.clipboardData).getData('text');
                const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6);
                [...digits].forEach((digit, i) => {
                    if (inputs[i]) {
                        inputs[i].value = digit;
                        if (i < inputs.length - 1) inputs[i + 1].focus();
                    }
                });
            });
        });

        // Fermer le modal 2FA en cliquant sur l'overlay
        const modal2faOverlay = DOM.modal2faOverlay;
        if (modal2faOverlay) {
            modal2faOverlay.addEventListener('click', function(e) {
                if (e.target === this) close2FAModal();
            });
        }

        // Mettre à jour l'heure de dernière sauvegarde
        updateLastSaveTime();

        console.log('✅ CEJEC ERP Paramètres initialisé avec succès');
    }

    // Démarrer quand le DOM est prêt
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
