/**
 * user-profile.js
 * Script partagé — lit l'utilisateur connecté depuis localStorage
 * et remplit tous les éléments de profil dans la sidebar/header.
 *
 * Éléments mis à jour automatiquement :
 *   .user-name      → nom complet
 *   .user-name2     → nom complet (sidebar footer)
 *   .user-role2     → rôle lisible en français
 *   .avatar2        → initiales
 *   .user-email     → email (span avec class user-email)
 *   span (enfant direct de .user-info) → email dans header
 */

(function () {
  'use strict';

  const ROLE_LABELS = {
    ADMIN: 'Administrateur',
    DIRECTOR: 'Directeur',
    TEACHER: 'Professeur',
    STUDENT: 'Étudiant(e)',
    SECRETARY: 'Secrétaire',
    ACCOUNTANT: 'Comptable',
    STAFF: 'Personnel',
    PARENT: 'Parent',
  };

  /** Retourne les initiales (max 2 lettres) d'un nom complet */
  function getInitials(name) {
    if (!name) return '??';
    return name
      .trim()
      .split(/\s+/)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /** Lit l'objet utilisateur stocké par auth.js au login */
  function getStoredUser() {
    try {
      const raw = localStorage.getItem('authUser');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    // Fallback: decode JWT
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return null;
      const payload = token.split('.')[1];
      const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      const decoded = JSON.parse(json);
      return decoded.user || decoded || null;
    } catch (_) {}
    return null;
  }

  /** Met à jour tous les éléments de profil dans la page */
  async function populateUserProfile() {
    let user = getStoredUser();
    
    // Si on a décodé un JWT mais qu'il manque le role ou le full_name, on tente de le fetch
    if (user && (!user.full_name && !user.role)) {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const resp = await fetch('https://gestion-scolaire-backend.onrender.com/api/v1/auth/users/me/', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resp.ok) {
            user = await resp.json();
            // On le sauvegarde pour la prochaine fois
            localStorage.setItem('authUser', JSON.stringify(user));
          }
        } catch (e) {
          console.warn("Could not fetch user profile", e);
        }
      }
    }

    if (!user) return;

    // Construire le nom d'affichage
    const fullName =
      user.full_name ||
      (user.first_name || user.last_name ? [user.first_name, user.last_name].filter(Boolean).join(' ') : null) ||
      user.username ||
      user.email ||
      'Utilisateur';

    const email = user.email || '';
    const roleLabel = ROLE_LABELS[user.role] || user.role || 'Utilisateur';
    const initials = getInitials(fullName);

    // --- Header supérieur (.user-name + span email) ---
    document.querySelectorAll('.user-name').forEach((el) => {
      el.textContent = fullName;
    });

    const phone = user.phone || 'Non renseigné';

    // Email dans la zone .user-info (span enfant direct)
    document.querySelectorAll('.user-info').forEach((el) => {
      const span = el.querySelector('span:not(.user-phone)');
      if (span) {
          span.textContent = email;
          span.style.display = 'block';
      }
      
      // Inject or update the phone number
      let phoneEl = el.querySelector('.user-phone');
      if (!phoneEl) {
          phoneEl = document.createElement('span');
          phoneEl.className = 'user-phone';
          phoneEl.style.fontSize = '0.85em';
          phoneEl.style.opacity = '0.8';
          phoneEl.style.display = 'block'; // Make it stack below the email
          phoneEl.style.marginTop = '2px';
          el.appendChild(phoneEl);
      }
      phoneEl.textContent = phone !== 'Non renseigné' ? phone : '';
      
      const strong = el.querySelector('strong');
      if (strong && strong.textContent.trim() === 'CEJEC') {
          // On peut optionnellement y mettre le rôle ou le nom. On va mettre le rôle pour que ce soit clair.
          strong.textContent = roleLabel;
      }
    });

    // Classe dédiée .user-email
    document.querySelectorAll('.user-email').forEach((el) => {
      el.textContent = email;
    });

    // --- Sidebar footer (.user-name2 / .user-role2 / .avatar2) ---
    document.querySelectorAll('.user-name2').forEach((el) => {
      el.textContent = fullName;
    });

    document.querySelectorAll('.user-role2').forEach((el) => {
      el.textContent = roleLabel;
    });

    // Initiales dans l'avatar
    document.querySelectorAll('.avatar2').forEach((el) => {
      el.textContent = initials;
    });

    // Avatar dans le header supérieur (classe avatar sans chiffre)
    document.querySelectorAll('.avatar:not(.avatar2)').forEach((el) => {
      // On remplace le texte seulement s'il semble être un initial par défaut ou vide
      if (el.textContent.trim().length <= 2) {
        el.textContent = initials;
      }
    });
  }

  // Exécuter dès que le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateUserProfile);
  } else {
    populateUserProfile();
  }

  // Exposer pour usage manuel si besoin
  window.populateUserProfile = populateUserProfile;
})();
