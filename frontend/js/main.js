import authService from './auth.service.js'

const app = document.getElementById('app')

// Login Page
function showLoginPage() {
  app.innerHTML = `
    <div class="container">
      <h1>Connexion</h1>
      <form id="loginForm">
        <input type="email" id="email" placeholder="Email" required />
        <input type="password" id="password" placeholder="Mot de passe" required />
        <button type="submit">Se connecter</button>
        <a href="#" id="goToRegister">Créer un compte</a>
      </form>
      <div id="message"></div>
    </div>
  `

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value
    const password = document.getElementById('password').value
    const messageDiv = document.getElementById('message')

    const result = await authService.login(email, password)
    if (result.success) {
      showDashboard()
    } else {
      messageDiv.className = 'error'
      messageDiv.textContent = result.error
    }
  })

  document.getElementById('goToRegister').addEventListener('click', (e) => {
    e.preventDefault()
    showRegisterPage()
  })
}

// Dashboard
async function showDashboard() {
  const user = authService.getUser()
  app.innerHTML = `
    <div class="container">
      <h1>Tableau de bord</h1>
      <p>Bienvenue, ${user.full_name}!</p>
      <button id="logoutBtn">Se déconnecter</button>
      <button id="profileBtn">Mon profil</button>
    </div>
  `

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await authService.logout()
    showLoginPage()
  })

  document.getElementById('profileBtn').addEventListener('click', showProfilePage)
}

// Register Page
function showRegisterPage() {
  app.innerHTML = `
    <div class="container">
      <h1>Inscription</h1>
      <form id="registerForm">
        <input type="text" id="firstName" placeholder="Prénom" required />
        <input type="text" id="lastName" placeholder="Nom" required />
        <input type="email" id="email" placeholder="Email" required />
        <input type="password" id="password" placeholder="Mot de passe" required />
        <input type="password" id="passwordConfirm" placeholder="Confirmer mot de passe" required />
        <button type="submit">S'inscrire</button>
        <a href="#" id="goToLogin">Déjà inscrit? Se connecter</a>
      </form>
      <div id="message"></div>
    </div>
  `

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault()
    const messageDiv = document.getElementById('message')

    const result = await authService.register(
      document.getElementById('email').value,
      document.getElementById('firstName').value,
      document.getElementById('lastName').value,
      document.getElementById('password').value,
      document.getElementById('passwordConfirm').value,
      'STUDENT'
    )

    if (result.success) {
      messageDiv.className = 'success'
      messageDiv.textContent = 'Inscription réussie! Vous pouvez vous connecter.'
      setTimeout(() => showLoginPage(), 2000)
    } else {
      messageDiv.className = 'error'
      messageDiv.textContent = result.error
    }
  })

  document.getElementById('goToLogin').addEventListener('click', (e) => {
    e.preventDefault()
    showLoginPage()
  })
}

// Profile Page
async function showProfilePage() {
  try {
    const profile = await authService.getProfile()
    app.innerHTML = `
      <div class="container">
        <h1>Mon Profil</h1>
        <p>Email: ${profile.email}</p>
        <p>Nom complet: ${profile.full_name}</p>
        <p>Rôle: ${profile.role}</p>
        <button id="backBtn">Retour</button>
      </div>
    `
    document.getElementById('backBtn').addEventListener('click', showDashboard)
  } catch (error) {
    alert('Erreur: ' + error.message)
  }
}

// Init
if (authService.isAuthenticated()) {
  showDashboard()
} else {
  showLoginPage()
}