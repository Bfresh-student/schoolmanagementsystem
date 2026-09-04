
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

// Recherche globale : les champs d'en-tête interrogent l'API, pas les
// données de démonstration éventuellement présentes dans une page.
document.addEventListener("DOMContentLoaded", function () {
    const requestSearch = async (query) => {
        if (window.GlobalSearchAPI) return GlobalSearchAPI.search(query);
        const endpoint = "https://schoolmanagementsystem-production-6624.up.railway.app/api/v1/auth/users/global-search/?q=" + encodeURIComponent(query);
        const execute = (token) => fetch(endpoint, { headers: token ? { Authorization: "Bearer " + token } : {} });
        let response = await execute(localStorage.getItem("authToken"));
        if (response.status === 401 && localStorage.getItem("refreshToken")) {
            const refresh = await fetch("https://schoolmanagementsystem-production-6624.up.railway.app/api/v1/auth/users/refresh/", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refresh: localStorage.getItem("refreshToken") }),
            });
            if (refresh.ok) {
                const tokens = await refresh.json();
                localStorage.setItem("authToken", tokens.access);
                response = await execute(tokens.access);
            }
        }
        if (!response.ok) throw new Error("Recherche indisponible");
        return response.json();
    };

    document.querySelectorAll(".header-center .input-group").forEach((group) => {
        const input = group.querySelector("input");
        const button = group.querySelector(".btn-search");
        if (!input || input.dataset.globalSearchBound) return;
        input.dataset.globalSearchBound = "true";
        group.style.position = "relative";
        const results = document.createElement("div");
        results.setAttribute("role", "listbox");
        results.style.cssText = "display:none;position:absolute;z-index:3000;top:calc(100% + 6px);left:0;right:0;max-height:320px;overflow:auto;background:#fff;border:1px solid #dbe4ee;border-radius:10px;box-shadow:0 12px 28px rgba(15,23,42,.18);padding:6px";
        group.append(results);
        let timer;
        const render = (items, query) => {
            results.replaceChildren();
            if (!items.length) {
                const empty = document.createElement("div");
                empty.textContent = `Aucun résultat pour « ${query} »`;
                empty.style.cssText = "padding:12px;color:#64748b;font-size:.9rem";
                results.append(empty);
            }
            items.forEach((item) => {
                const row = document.createElement("a");
                row.href = item.href + "?search=" + encodeURIComponent(query);
                row.style.cssText = "display:block;padding:9px 10px;border-radius:7px;text-decoration:none;color:#172033";
                const title = document.createElement("strong");
                title.textContent = item.title;
                const detail = document.createElement("span");
                detail.textContent = `${item.type} · ${item.subtitle || ""}`;
                detail.style.cssText = "display:block;font-size:.78rem;color:#64748b;margin-top:2px";
                row.append(title, detail);
                results.append(row);
            });
            results.style.display = "block";
        };
        const search = async () => {
            const query = input.value.trim();
            if (query.length < 2) { results.style.display = "none"; return; }
            try {
                const payload = await requestSearch(query);
                render(payload.results || [], query);
            } catch (error) {
                results.style.display = "none";
                console.error("Recherche globale impossible", error);
            }
        };
        input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(search, 250); });
        button?.addEventListener("click", (event) => { event.preventDefault(); clearTimeout(timer); search(); });
        document.addEventListener("click", (event) => { if (!group.contains(event.target)) results.style.display = "none"; });
    });
});
