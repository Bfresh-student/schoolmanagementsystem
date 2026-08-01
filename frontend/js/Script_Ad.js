
function toggleUserMenu(){
    document.getElementById("userMenu").classList.toggle("show");
}

document.addEventListener("click", function(e){
    if(!e.target.closest(".user-section")){
        document.getElementById("userMenu").classList.remove("show");
    }
});

const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.overlay');

// Ouvri / fèmen lè yo klike sou bouton an
menuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('show');
    overlay.classList.toggle('active');

    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !expanded);
});

// Fèmen lè yo klike DEYÒ (sou overlay)
overlay.addEventListener('click', () => {
    sidebar.classList.remove('show');
    overlay.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
});

// Fèmen sidebar si klike nan nenpòt lòt pati nan dokiman (opsyonèl)
document.addEventListener('click', (e) => {
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('show');
        overlay.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    }
});

// Bloke pwopagasyon pou klik andedan sidebar
sidebar.addEventListener('click', (e) => {
    e.stopPropagation();
});

// Js pou 2 dropdown22 yo (Logistique ak Raport & RH)
// Seleksyone tout bouton toggle ak tout meni
const toggleBtns = document.querySelectorAll(".dropdown22-toggle");
const menus = document.querySelectorAll(".dropdown22-menu");

// Fonksyon pou ouvri yon meni espesifik
function openMenu(menu, toggleBtn) {
    menu.classList.add("show");
    // Sove id meni an ki louvri
    localStorage.setItem(`menuOpen_${menu.id}`, "true");
}

// Fonksyon pou fèmen yon meni espesifik
function closeMenu(menu, toggleBtn) {
    menu.classList.remove("show");
    // Sove id meni an ki fèmen
    localStorage.setItem(`menuOpen_${menu.id}`, "false");
}

// Fonksyon pou toggle yon meni
function toggleMenu(menu, toggleBtn) {
    if (menu.classList.contains("show")) {
        closeMenu(menu, toggleBtn);
    } else {
        // Fèmen tout lòt meni anvan ou louvri nouvo a (si ou vle yon sel meni louvri a la fwa)
        closeAllMenus();
        openMenu(menu, toggleBtn);
    }
}

// Fonksyon pou fèmen tout meni yo
function closeAllMenus() {
    menus.forEach(menu => {
        menu.classList.remove("show");
        // Mete a jour localStorage pou chak meni
        localStorage.setItem(`menuOpen_${menu.id}`, "false");
    });
}

// Ajoute event listener pou chak bouton toggle
toggleBtns.forEach((toggleBtn, index) => {
    // Jwenn meni ki koresponn ak bouton sa a (prochain .dropdown22-menu)
    const menu = toggleBtn.parentElement.querySelector(".dropdown22-menu");
    
    // Si pa jwenn meni a, eseye jwenn pa id menm si id la menm?
    // Nou bezwen asire chak meni gen yon id diferan
    
    if (menu) {
        // Ajoute event listener pou bouton an
        toggleBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleMenu(menu, toggleBtn);
        });
    }
});

// Pou fèmen meni yo si itilizatè klike deyò
document.addEventListener("click", function(event) {
    // Verifye si klike a pa sou okenn bouton toggle oswa nan okenn meni
    let clickedOnToggle = false;
    let clickedOnMenu = false;
    
    toggleBtns.forEach(toggleBtn => {
        if (toggleBtn.contains(event.target)) {
            clickedOnToggle = true;
        }
    });
    
    menus.forEach(menu => {
        if (menu.contains(event.target)) {
            clickedOnMenu = true;
        }
    });
    
    if (!clickedOnToggle && !clickedOnMenu) {
        closeAllMenus();
    }
});

// Lè paj la charge, tcheke eta chak meni
document.addEventListener("DOMContentLoaded", function() {
    // Asire chak meni gen yon id diferan
    menus.forEach((menu, idx) => {
        // Si meni a pa gen id, bay li yon id
        if (!menu.id || menu.id === "itemMenu") {
            menu.id = `menu_${idx}_${Date.now()}`;
        }
        
        // Tcheke eta meni a nan localStorage
        const menuWasOpen = localStorage.getItem(`menuOpen_${menu.id}`);
        if (menuWasOpen === "true") {
            menu.classList.add("show");
        } else {
            menu.classList.remove("show");
        }
    });
    
    // Asire chak bouton toggle gen yon id diferan tou (si ou vle)
    toggleBtns.forEach((btn, idx) => {
        if (!btn.id || btn.id === "chevrToggle") {
            btn.id = `toggle_${idx}_${Date.now()}`;
        }
    });
});