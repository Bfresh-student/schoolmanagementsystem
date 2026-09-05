function toggleUserMenu() {
  document.getElementById("userMenu").classList.toggle("show");
}

document.addEventListener("click", function (e) {
  if (!e.target.closest(".user-section")) {
    document.getElementById("userMenu").classList.remove("show");
  }
});

const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.querySelector(".sidebar");
const overlay = document.querySelector(".overlay");

// Ouvri / fèmen lè yo klike sou bouton an
menuToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  sidebar.classList.toggle("show");
  overlay.classList.toggle("active");

  const expanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", !expanded);
});

// Fèmen lè yo klike DEYÒ (sou overlay)
overlay.addEventListener("click", () => {
  sidebar.classList.remove("show");
  overlay.classList.remove("active");
  menuToggle.setAttribute("aria-expanded", "false");
});

// Fèmen sidebar si klike nan nenpòt lòt pati nan dokiman (opsyonèl)
document.addEventListener("click", (e) => {
  if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
    sidebar.classList.remove("show");
    overlay.classList.remove("active");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

// Bloke pwopagasyon pou klik andedan sidebar
sidebar.addEventListener("click", (e) => {
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
  menus.forEach((menu) => {
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
document.addEventListener("click", function (event) {
  // Verifye si klike a pa sou okenn bouton toggle oswa nan okenn meni
  let clickedOnToggle = false;
  let clickedOnMenu = false;

  toggleBtns.forEach((toggleBtn) => {
    if (toggleBtn.contains(event.target)) {
      clickedOnToggle = true;
    }
  });

  menus.forEach((menu) => {
    if (menu.contains(event.target)) {
      clickedOnMenu = true;
    }
  });

  if (!clickedOnToggle && !clickedOnMenu) {
    closeAllMenus();
  }
});

// Lè paj la charge, tcheke eta chak meni
document.addEventListener("DOMContentLoaded", function () {
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
  document.querySelectorAll('a[href="Se connecter - Admin.html"]').forEach((logoutLink) => {
    logoutLink.addEventListener("click", () => {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("authUser");
    });
  });

  const notificationBadges = document.querySelectorAll(".badge44");
  if (notificationBadges.length && typeof apiClientRequest === "function") {
    const refreshNotificationCount = async () => {
      try {
        let unreadCount;
        try {
          const result = await apiClientRequest(
            "/notifications/notifications/unread-count/",
          );
          unreadCount = Number(result.unread_count);
        } catch (_) {
          const result = await apiClientRequest(
            "/notifications/notifications/?page_size=1000",
          );
          const notifications = Array.isArray(result)
            ? result
            : result.results || [];
          unreadCount = notifications.filter(
            (notification) => !notification.is_read,
          ).length;
        }
        notificationBadges.forEach((badge) => {
          badge.textContent = String(
            Number.isFinite(unreadCount) ? unreadCount : 0,
          );
          badge.hidden = unreadCount <= 0;
        });
      } catch (error) {
        console.warn("Compteur de notifications indisponible", error);
      }
    };
    refreshNotificationCount();
    window.setInterval(refreshNotificationCount, 60000);
  }

  const requestSearch = async (query) => {
    if (window.GlobalSearchAPI) return GlobalSearchAPI.search(query);
    const endpoint =
      "https://schoolmanagementsystem-production-6624.up.railway.app/api/v1/auth/users/global-search/?q=" +
      encodeURIComponent(query);
    const execute = (token) =>
      fetch(endpoint, {
        headers: token ? { Authorization: "Bearer " + token } : {},
      });
    let response = await execute(localStorage.getItem("authToken"));
    if (response.status === 401 && localStorage.getItem("refreshToken")) {
      const refresh = await fetch(
        "https://schoolmanagementsystem-production-6624.up.railway.app/api/v1/auth/users/refresh/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            refresh: localStorage.getItem("refreshToken"),
          }),
        },
      );
      if (refresh.ok) {
        const tokens = await refresh.json();
        localStorage.setItem("authToken", tokens.access);
        response = await execute(tokens.access);
      }
    }
    if (!response.ok) throw new Error("Recherche indisponible");
    return response.json();
  };

  const getTypeBadgeStyle = (type) => {
    switch ((type || "").toLowerCase()) {
      case "étudiant":
        return "background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe";
      case "professeur":
        return "background:#f5f3ff;color:#7c3aed;border:1px solid #ddd6fe";
      case "employé":
        return "background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0";
      case "candidat":
        return "background:#fff7ed;color:#ea580c;border:1px solid #fed7aa";
      case "article":
        return "background:#fdf2f8;color:#db2777;border:1px solid #fbcfe8";
      case "formation":
        return "background:#ecfeff;color:#0891b2;border:1px solid #a5f3fc";
      case "événement":
        return "background:#fefce8;color:#ca8a04;border:1px solid #fef08a";
      default:
        return "background:#f1f5f9;color:#475569;border:1px solid #e2e8f0";
    }
  };

  const highlightMatch = (text, query) => {
    if (!text) return "";
    if (!query) return escapeHtml(text);
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return escapeHtml(text).replace(
      regex,
      '<mark style="background:#fef08a;color:#854d0e;border-radius:2px;padding:0 2px">$1</mark>',
    );
  };

  const escapeHtml = (str) => {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  };

  document.querySelectorAll(".header-center .input-group").forEach((group) => {
    const input = group.querySelector("input");
    const button = group.querySelector(".btn-search");
    if (!input || input.dataset.globalSearchBound) return;
    input.dataset.globalSearchBound = "true";
    group.style.position = "relative";

    const results = document.createElement("div");
    results.setAttribute("role", "listbox");
    results.style.cssText =
      "display:none;position:absolute;z-index:3000;top:calc(100% + 6px);left:0;right:0;max-height:380px;overflow-y:auto;background:#fff;border:1px solid #dbe4ee;border-radius:12px;box-shadow:0 16px 36px rgba(15,23,42,.18);padding:6px";
    group.append(results);

    let timer;
    let selectedIndex = -1;

    const render = (items, query) => {
      results.replaceChildren();
      selectedIndex = -1;
      if (!items.length) {
        const empty = document.createElement("div");
        empty.innerHTML = `<i class="fas fa-search" style="margin-right:6px;color:#94a3b8"></i> Aucun résultat pour « <strong>${escapeHtml(query)}</strong> »`;
        empty.style.cssText =
          "padding:14px;color:#64748b;font-size:.88rem;text-align:center";
        results.append(empty);
      } else {
        const header = document.createElement("div");
        header.innerHTML = `<span style="font-size:0.75rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Résultats (${items.length})</span>`;
        header.style.cssText =
          "padding:6px 10px 4px;border-bottom:1px solid #f1f5f9;margin-bottom:4px";
        results.append(header);

        items.forEach((item, idx) => {
          const row = document.createElement("a");
          row.href = item.href
            ? item.href.includes("?")
              ? item.href
              : item.href + "?search=" + encodeURIComponent(query)
            : "#";
          row.className = "search-result-item";
          row.dataset.index = idx;
          row.style.cssText =
            "display:flex;align-items:center;gap:12px;padding:9px 12px;border-radius:8px;text-decoration:none;color:#172033;transition:background .15s ease;cursor:pointer";

          const iconBox = document.createElement("div");
          const iconName = item.icon || "fa-circle-dot";
          iconBox.innerHTML = `<i class="fas ${iconName}"></i>`;
          iconBox.style.cssText =
            "width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:0.95rem;background:#f8fafc;color:#475569;flex-shrink:0";

          const infoBox = document.createElement("div");
          infoBox.style.cssText = "flex:1;min-width:0";

          const titleLine = document.createElement("div");
          titleLine.style.cssText =
            "display:flex;align-items:center;gap:8px;justify-content:space-between";

          const titleText = document.createElement("strong");
          titleText.style.cssText =
            "font-size:0.88rem;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";
          titleText.innerHTML = highlightMatch(item.title, query);

          const badge = document.createElement("span");
          badge.textContent = item.type;
          badge.style.cssText = `font-size:0.7rem;font-weight:600;padding:2px 7px;border-radius:6px;white-space:nowrap;${getTypeBadgeStyle(item.type)}`;

          titleLine.append(titleText, badge);

          const detailText = document.createElement("span");
          detailText.innerHTML = highlightMatch(item.subtitle || "", query);
          detailText.style.cssText =
            "display:block;font-size:0.76rem;color:#64748b;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis";

          infoBox.append(titleLine, detailText);

          const arrow = document.createElement("div");
          arrow.innerHTML = `<i class="fas fa-arrow-right" style="font-size:0.75rem;color:#94a3b8"></i>`;

          row.append(iconBox, infoBox, arrow);

          row.addEventListener("mouseenter", () => {
            updateSelection(idx);
          });

          row.addEventListener("mouseleave", () => {
            row.style.background = "transparent";
          });

          results.append(row);
        });
      }
      results.style.display = "block";
    };

    const updateSelection = (idx) => {
      const rows = results.querySelectorAll(".search-result-item");
      rows.forEach((r, i) => {
        if (i === idx) {
          r.style.background = "#f1f5f9";
          selectedIndex = i;
        } else {
          r.style.background = "transparent";
        }
      });
    };

    const search = async () => {
      const query = input.value.trim();
      if (query.length < 2) {
        results.style.display = "none";
        return;
      }
      try {
        const payload = await requestSearch(query);
        render(payload.results || [], query);
      } catch (error) {
        results.style.display = "none";
        console.error("Recherche globale impossible", error);
      }
    };

    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(search, 200);
    });
    button?.addEventListener("click", (event) => {
      event.preventDefault();
      clearTimeout(timer);
      search();
    });

    input.addEventListener("keydown", (e) => {
      const rows = results.querySelectorAll(".search-result-item");
      if (!rows.length || results.style.display === "none") return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        selectedIndex = (selectedIndex + 1) % rows.length;
        updateSelection(selectedIndex);
        rows[selectedIndex]?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        selectedIndex = (selectedIndex - 1 + rows.length) % rows.length;
        updateSelection(selectedIndex);
        rows[selectedIndex]?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && rows[selectedIndex]) {
          e.preventDefault();
          rows[selectedIndex].click();
        }
      } else if (e.key === "Escape") {
        results.style.display = "none";
      }
    });

    document.addEventListener("click", (event) => {
      if (!group.contains(event.target)) results.style.display = "none";
    });
  });
});
