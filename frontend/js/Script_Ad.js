document.addEventListener("DOMContentLoaded", function () {
  /* ============================================================
       0) PANNO NOTIFIKASYON LATERAL BÒ DWAT - #sidebar-nocti
       (jenere ak injekte nan DOM lan via JS, olye l ekri an dur nan HTML)
    ============================================================ */
  const sidebarNoctiTemplate = `
        <div class="sidebar-nocti-overlay" id="sidebarNoctiOverlay"></div>

        <aside class="sidebar-nocti" id="sidebar-nocti" aria-hidden="true">
            <div class="sidebar-nocti-header">
                <h2><i class="fa-regular fa-bell"></i> Notifications</h2>
                <button type="button" class="sidebar-nocti-close" id="sidebarNoctiClose" aria-label="Fermer les notifications">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="sidebar-nocti-tabs" id="sidebarNoctiTabs">
                <button type="button" class="sidebar-nocti-tab active" data-filter="all">Toutes</button>
                <button type="button" class="sidebar-nocti-tab" data-filter="unread">Non lues</button>
            </div>

            <div class="sidebar-nocti-toolbar">
                <label class="sidebar-nocti-select-all">
                    <input type="checkbox" id="sidebarNoctiSelectAll">
                    Tout sélectionner
                </label>
                <button type="button" class="sidebar-nocti-mark-all" id="sidebarNoctiMarkAll">
                    Tout marquer comme lu
                </button>
            </div>

            <button type="button" class="sidebar-nocti-delete-selected" id="sidebarNoctiDeleteSelected">
                <i class="fa-solid fa-trash"></i> Supprimer la sélection (<span id="sidebarNoctiSelectedCount">0</span>)
            </button>

            <div class="sidebar-nocti-list" id="sidebarNoctiList">

                <!-- INSCRIPTION -->
                <div class="sidebar-nocti-item unread">
                    <input type="checkbox" class="nocti-select" aria-label="Sélectionner cette notification">

                    <div class="notif-icon">
                        <i class="fa-solid fa-user-plus"></i>
                    </div>

                    <div class="notif-content">
                        <div class="notif-title">Nouvelle inscription</div>
                        <div class="notif-desc">
                            Une nouvelle demande d'inscription vient d'être enregistrée
                            pour la prochaine promotion du CEJEC.
                        </div>
                        <div class="notif-time">Il y a 5 min</div>
                    </div>

                    <div class="sidebar-nocti-item-actions">
                        <button type="button" class="mark-read-btn" title="Marquer comme lu">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button type="button" class="delete-btn" title="Supprimer">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>


                <!-- PAIEMENT -->
                <div class="sidebar-nocti-item unread">
                    <input type="checkbox" class="nocti-select" aria-label="Sélectionner cette notification">

                    <div class="notif-icon">
                        <i class="fa-solid fa-hand-holding-dollar"></i>
                    </div>

                    <div class="notif-content">
                        <div class="notif-title">Paiement reçu</div>
                        <div class="notif-desc">
                            Un paiement de frais de formation a été enregistré
                            pour un étudiant du CEJEC.
                        </div>
                        <div class="notif-time">Il y a 32 min</div>
                    </div>

                    <div class="sidebar-nocti-item-actions">
                        <button type="button" class="mark-read-btn" title="Marquer comme lu">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button type="button" class="delete-btn" title="Supprimer">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>


                <!-- NOTES -->
                <div class="sidebar-nocti-item unread">
                    <input type="checkbox" class="nocti-select" aria-label="Sélectionner cette notification">

                    <div class="notif-icon">
                        <i class="fa-solid fa-graduation-cap"></i>
                    </div>

                    <div class="notif-content">
                        <div class="notif-title">Notes mises à jour</div>
                        <div class="notif-desc">
                            De nouvelles notes ont été enregistrées pour les étudiants
                            de la promotion du CEJEC.
                        </div>
                        <div class="notif-time">Il y a 1 h</div>
                    </div>

                    <div class="sidebar-nocti-item-actions">
                        <button type="button" class="mark-read-btn" title="Marquer comme lu">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button type="button" class="delete-btn" title="Supprimer">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>


                <!-- PROFESSEUR -->
                <div class="sidebar-nocti-item unread">
                    <input type="checkbox" class="nocti-select" aria-label="Sélectionner cette notification">

                    <div class="notif-icon">
                        <i class="fa-solid fa-chalkboard-user"></i>
                    </div>

                    <div class="notif-content">
                        <div class="notif-title">Nouveau professeur</div>
                        <div class="notif-desc">
                            Un nouveau professeur a été ajouté au personnel académique
                            du CEJEC et son profil est maintenant disponible.
                        </div>
                        <div class="notif-time">Il y a 2 h</div>
                    </div>

                    <div class="sidebar-nocti-item-actions">
                        <button type="button" class="mark-read-btn" title="Marquer comme lu">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button type="button" class="delete-btn" title="Supprimer">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>


                <!-- INCUBATEUR -->
                <div class="sidebar-nocti-item unread">
                    <input type="checkbox" class="nocti-select" aria-label="Sélectionner cette notification">

                    <div class="notif-icon">
                        <i class="fa-solid fa-rocket"></i>
                    </div>

                    <div class="notif-content">
                        <div class="notif-title">Nouveau projet entrepreneurial</div>
                        <div class="notif-desc">
                            Un nouveau projet vient d'être ajouté à l'Incubateur
                            Projets du CEJEC pour accompagnement.
                        </div>
                        <div class="notif-time">Il y a 3 h</div>
                    </div>

                    <div class="sidebar-nocti-item-actions">
                        <button type="button" class="mark-read-btn" title="Marquer comme lu">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button type="button" class="delete-btn" title="Supprimer">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>


                <!-- ÉVÉNEMENT -->
                <div class="sidebar-nocti-item">
                    <input type="checkbox" class="nocti-select" aria-label="Sélectionner cette notification">

                    <div class="notif-icon">
                        <i class="fa-solid fa-calendar-check"></i>
                    </div>

                    <div class="notif-content">
                        <div class="notif-title">Événement à venir</div>
                        <div class="notif-desc">
                            Un événement académique ou entrepreneurial du CEJEC
                            est prévu prochainement dans le calendrier.
                        </div>
                        <div class="notif-time">Il y a 5 h</div>
                    </div>

                    <div class="sidebar-nocti-item-actions">
                        <button type="button" class="mark-read-btn" title="Marquer comme lu">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button type="button" class="delete-btn" title="Supprimer">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>


                <!-- RAPPORT -->
                <div class="sidebar-nocti-item">
                    <input type="checkbox" class="nocti-select" aria-label="Sélectionner cette notification">

                    <div class="notif-icon">
                        <i class="fa-solid fa-chart-column"></i>
                    </div>

                    <div class="notif-content">
                        <div class="notif-title">Rapport disponible</div>
                        <div class="notif-desc">
                            Le rapport académique de la promotion est maintenant
                            disponible pour consultation dans le système de gestion CEJEC.
                        </div>
                        <div class="notif-time">Hier</div>
                    </div>

                    <div class="sidebar-nocti-item-actions">
                        <button type="button" class="mark-read-btn" title="Marquer comme lu">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button type="button" class="delete-btn" title="Supprimer">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>


                <!-- COMMUNICATION -->
                <div class="sidebar-nocti-item">
                    <input type="checkbox" class="nocti-select" aria-label="Sélectionner cette notification">

                    <div class="notif-icon">
                        <i class="fa-solid fa-bullhorn"></i>
                    </div>

                    <div class="notif-content">
                        <div class="notif-title">Nouvelle communication</div>
                        <div class="notif-desc">
                            Une nouvelle actualité ou communication institutionnelle
                            a été publiée dans l'espace Médias & Communication du CEJEC.
                        </div>
                        <div class="notif-time">Hier</div>
                    </div>

                    <div class="sidebar-nocti-item-actions">
                        <button type="button" class="mark-read-btn" title="Marquer comme lu">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button type="button" class="delete-btn" title="Supprimer">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>


                <!-- RH -->
                <div class="sidebar-nocti-item">
                    <input type="checkbox" class="nocti-select" aria-label="Sélectionner cette notification">

                    <div class="notif-icon">
                        <i class="fa-solid fa-users"></i>
                    </div>

                    <div class="notif-content">
                        <div class="notif-title">Mise à jour RH</div>
                        <div class="notif-desc">
                            Une information concernant le personnel du CEJEC
                            a été ajoutée ou mise à jour dans le module Ressources Humaines.
                        </div>
                        <div class="notif-time">Il y a 2 jours</div>
                    </div>

                    <div class="sidebar-nocti-item-actions">
                        <button type="button" class="mark-read-btn" title="Marquer comme lu">
                            <i class="fa-solid fa-check"></i>
                        </button>
                        <button type="button" class="delete-btn" title="Supprimer">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>

            </div>

            <!-- EMPTY STATE -->
            <div class="sidebar-nocti-empty" id="sidebarNoctiEmpty" style="display:none;">
                <i class="fa-regular fa-bell-slash"></i>
                <p>Aucune notification dans cette catégorie.</p>
            </div>

        </aside>
    `;
  document.body.insertAdjacentHTML("beforeend", sidebarNoctiTemplate);

  /* ---------- Ikon Lucide ---------- */
  function initLucide() {
    if (window.lucide) lucide.createIcons({ attrs: { "stroke-width": 1.55 } });
  }
  initLucide();

  /* ---------- Referans eleman yo ---------- */
  const menuToggle = document.getElementById("menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".overlay");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const userTrigger = document.querySelector(".user-trigger");
  const userMenu = document.getElementById("userMenu");
  const notifBell = document.getElementById("notifBell");
  const notifMenu = document.getElementById("notifMenu");
  const notifBadge = document.getElementById("notifBadge");
  const notifList = document.getElementById("notifList");
  const markAllRead = document.getElementById("markAllRead");
  const notifClose = document.getElementById("notifClose");
  const notifSeeAll = document.getElementById("notifSeeAll");

  /* Blokaj scroll paj la pataje ant sidebar mobil la ak panno notifikasyon
       lateral la (#sidebar-nocti) - konsa si youn fèmen pandan lòt la toujou
       louvri, scroll la pa dezoure paj la twò bonè. */
  function updateBodyScrollLock() {
    const sidebarNoctiEl = document.getElementById("sidebar-nocti");
    const anyOpen =
      (sidebar && sidebar.classList.contains("show")) ||
      (sidebarNoctiEl && sidebarNoctiEl.classList.contains("show"));
    document.body.style.overflow = anyOpen ? "hidden" : "";
  }

  /* ============================================================
       1) SIDEBAR MOBIL - ouvri / fèmen ak bouton hamburger la

       KORIJE: openSidebar()/closeSidebar() te touche sidebar.classList
       ak overlay.classList san verifye si eleman yo egziste nan paj la.
       Sou nenpòt paj ki pa gen .sidebar oswa .overlay (pa egzanp yon paj
       login), sa te jete yon erè JS ("Cannot read properties of null")
       chak fwa ou klike nenpòt kote sou paj la, akoz gwo click-listener
       global la pi ba a. Kounye a de fonksyon yo tou senpleman pa fè
       anyen si eleman yo pa la.
    ============================================================ */
  function openSidebar() {
    if (!sidebar || !overlay) return;
    sidebar.classList.add("show");
    overlay.classList.add("active");
    document.body.classList.add("sidebar-open");
    updateBodyScrollLock();
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
  }
  function closeSidebar() {
    if (!sidebar || !overlay) return;
    sidebar.classList.remove("show");
    overlay.classList.remove("active");
    document.body.classList.remove("sidebar-open");
    updateBodyScrollLock();
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
  }
  if (menuToggle) {
    menuToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      if (!sidebar) return;
      sidebar.classList.contains("show") ? closeSidebar() : openSidebar();
    });
  }
  if (overlay) overlay.addEventListener("click", closeSidebar);
  if (sidebar)
    sidebar.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  document.addEventListener("click", function (e) {
    if (
      sidebar &&
      window.innerWidth <= 1024 &&
      sidebar.classList.contains("show") &&
      !sidebar.contains(e.target) &&
      (!menuToggle || !menuToggle.contains(e.target))
    ) {
      closeSidebar();
    }
  });

  /* Lè fenèt la vin gen lajè desktop ankò (soti sou yon fòma pi piti kote
       meni mobil la te louvri), reyinisyalize eta "mobil" la (sidebar.show,
       overlay, body.sidebar-open) pou anyen pa rete "kole". San sa, bouton
       hamburger la ta ka sanble li pa reponn ankò lè ekran an vin piti
       ankò apre sa, paske eta a t ap deja fofse "louvri" san rezon. */
  let lastWasMobile = window.innerWidth <= 1024;
  window.addEventListener("resize", function () {
    const isMobileNow = window.innerWidth <= 1024;
    if (lastWasMobile && !isMobileNow) {
      closeSidebar();
    }
    lastWasMobile = isMobileNow;
  });

  /* ============================================================
       2) SIDEBAR REDUI / AGRANDI (desktop) - bouton panel-left
    ============================================================ */
  if (sidebarToggle) {
    function applyMinimizedState(minimized) {
      sidebar.classList.toggle("minimized", minimized);
      document.body.classList.toggle("sidebar-minimized", minimized);
      sidebarToggle.title = minimized ? "Agrandir" : "Réduire";
    }
    let isMinimized = localStorage.getItem("sidebarMinimized") === "true";
    applyMinimizedState(isMinimized);

    sidebarToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      isMinimized = !isMinimized;
      localStorage.setItem("sidebarMinimized", isMinimized);
      applyMinimizedState(isMinimized);
    });
  }

  /* ============================================================
       3) MENI ITILIZATÈ (Bruno Jean) an tèt paj la
    ============================================================ */
  function closeUserMenu() {
    if (!userMenu) return;
    userMenu.classList.remove("show");
    userMenu.setAttribute("aria-hidden", "true");
  }
  function openUserMenu() {
    if (!userMenu) return;
    userMenu.classList.add("show");
    userMenu.setAttribute("aria-hidden", "false");
  }
  function closeNotifMenu() {
    if (!notifMenu) return;
    notifMenu.classList.remove("show");
    notifMenu.setAttribute("aria-hidden", "true");
  }
  function openNotifMenu() {
    if (!notifMenu) return;
    notifMenu.classList.add("show");
    notifMenu.setAttribute("aria-hidden", "false");
  }

  const escapeNotificationHtml = (value) =>
    String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const notificationIcon = (type) => {
    if (type.includes("grade")) return "fa-graduation-cap";
    if (type.includes("payment")) return "fa-hand-holding-dollar";
    if (type.includes("course")) return "fa-book-open";
    if (type.includes("event")) return "fa-calendar-check";
    if (type.includes("article")) return "fa-newspaper";
    if (type.includes("teacher")) return "fa-chalkboard-user";
    return "fa-bell";
  };

  function notificationTarget(notification) {
    if (!notification.target_url) return null;
    return {
      url: notification.target_url,
      modal: notification.target_modal || "",
      id: notification.target_id || "",
    };
  }

  async function openNotificationTarget(notification) {
    const target = notificationTarget(notification);
    if (!target) return;
    try {
      await apiClientRequest(
        `/notifications/notifications/${notification.id}/mark-read/`,
        { method: "PATCH" },
      );
    } catch (error) {
      console.warn("Lecture de notification impossible", error);
    }
    const currentPage = window.location.pathname.split("/").pop();
    if (target.url.split("?")[0] !== currentPage) {
      localStorage.setItem("cejec_notification_target", JSON.stringify(target));
      window.location.href = target.url;
      return;
    }
    if (target.modal && typeof window[target.modal] === "function") {
      window[target.modal](target.id || undefined);
    }
  }

  function notificationMarkup(notification, sidebarItem = false) {
    const unreadClass = notification.is_read ? "" : " unread";
    const target = notificationTarget(notification);
    const targetAttrs = target
      ? ` data-notification-id="${escapeNotificationHtml(notification.id)}"`
      : "";
    const actions = sidebarItem
      ? `<div class="sidebar-nocti-item-actions"><button type="button" class="mark-read-btn" title="Marquer comme lu"><i class="fa-solid fa-check"></i></button><button type="button" class="delete-btn" title="Supprimer"><i class="fa-solid fa-trash"></i></button></div>`
      : "";
    return `<div class="${sidebarItem ? "sidebar-nocti-item" : "notif-item"}${unreadClass}"${targetAttrs}>
      ${sidebarItem ? '<input type="checkbox" class="nocti-select" aria-label="Sélectionner cette notification">' : ""}
      <div class="notif-icon"><i class="fa-solid ${notificationIcon(notification.trigger_type || "")}"></i></div>
      <div class="notif-content"><div class="notif-title">${escapeNotificationHtml(notification.title)}</div>
      <div class="notif-desc">${escapeNotificationHtml(notification.content)}</div>
      <div class="notif-time"><i class="fa-regular fa-clock"></i> ${new Date(notification.created_at).toLocaleString("fr-FR")}</div></div>${actions}</div>`;
  }

  async function refreshNotificationMenus() {
    if (typeof apiClientRequest !== "function") return;
    if (notifBadge) {
      unreadCount = 0;
      updateBadge();
    }
    if (notifList) notifList.innerHTML = '<p class="notif-empty">Chargement...</p>';
    if (sidebarNoctiList)
      sidebarNoctiList.innerHTML = '<p class="notif-empty">Chargement...</p>';
    try {
      const response = await apiClientRequest(
        "/notifications/notifications/?page_size=100",
      );
      const notifications = Array.isArray(response)
        ? response
        : response.results || [];
      const unread = notifications.filter((item) => !item.is_read);
      unreadCount = unread.length;
      updateBadge();
      if (notifList)
        notifList.innerHTML =
          notifications
            .slice(0, 10)
            .map((item) => notificationMarkup(item))
            .join("") || '<p class="notif-empty">Aucune notification.</p>';
      if (sidebarNoctiList)
        sidebarNoctiList.innerHTML = notifications
          .map((item) => notificationMarkup(item, true))
          .join("");
      applySidebarNoctiFilter();
      updateSidebarNoctiSelectionUI();
    } catch (error) {
      console.warn("Chargement des notifications impossible", error);
      if (notifList)
        notifList.innerHTML =
          '<p class="notif-empty">Notifications indisponibles.</p>';
      if (sidebarNoctiList)
        sidebarNoctiList.innerHTML =
          '<p class="notif-empty">Notifications indisponibles.</p>';
    }
  }

  if (userTrigger) {
    userTrigger.addEventListener("click", function (e) {
      e.stopPropagation();
      closeNotifMenu();
      userMenu.classList.contains("show") ? closeUserMenu() : openUserMenu();
    });
  }

  /* ============================================================
       4) NOTIFICATIONS - kloch la fonksyonèl kounye a

       KORIJE: updateBadge() te kache/montre badge a ak style.display,
       men refreshNotificationCount() (pi ba, sistèm API a) te kache/
       montre MENM badge a (.badge44) ak pwopriyete .hidden. De metòd
       sa yo pa konpatib: yon style.display="none" mete anvan pa janm
       efase pa hidden=false apre sou menm eleman an, epi badge a te ka
       rete kache pou tout tan. Kounye a tou de fonksyon yo itilize
       style.display, konsa yo pa antre an konfli.
    ============================================================ */
  let unreadCount = notifBadge ? parseInt(notifBadge.textContent, 10) || 0 : 0;

  function updateBadge() {
    if (!notifBadge) return;
    if (unreadCount <= 0) {
      notifBadge.style.display = "none";
    } else {
      notifBadge.style.display = "flex";
      notifBadge.textContent = unreadCount;
    }
  }

  if (notifBell) {
    notifBell.addEventListener("click", function (e) {
      e.stopPropagation();
      closeUserMenu();
      notifMenu.classList.contains("show") ? closeNotifMenu() : openNotifMenu();
      refreshNotificationMenus();
    });
  }

  if (markAllRead) {
    markAllRead.addEventListener("click", async function (e) {
      e.stopPropagation();
      await apiClientRequest("/notifications/notifications/mark-all-read/", {
        method: "POST",
      });
      await refreshNotificationMenus();
    });
  }

  /* Bouton X pou fèmen panel notifikasyon an */
  if (notifClose) {
    notifClose.addEventListener("click", function (e) {
      e.stopPropagation();
      closeNotifMenu();
    });
  }

  /* "Voir toutes les notifications" -> ouvri panno lateral la (bò dwat) */
  if (notifSeeAll) {
    notifSeeAll.addEventListener("click", function (e) {
      e.preventDefault();
      closeNotifMenu();
      openSidebarNocti();
    });
  }

  if (notifList) {
    notifList.addEventListener("click", async function (e) {
      const item = e.target.closest(".notif-item[data-notification-id]");
      if (!item) return;
      const response = await apiClientRequest(
        `/notifications/notifications/${item.dataset.notificationId}/`,
      );
      await openNotificationTarget(response);
      await refreshNotificationMenus();
    });
  }
  updateBadge();

  /* Fèmen meni itilizatè ak notifikasyon lè klike deyò */
  document.addEventListener("click", function (e) {
    if (userMenu && !e.target.closest(".user-section")) closeUserMenu();
    if (notifMenu && !e.target.closest(".notification-wrapper"))
      closeNotifMenu();
  });

  /* ============================================================
       4b) PANNO NOTIFIKASYON LATERAL BÒ DWAT - #sidebar-nocti
    ============================================================ */
  const sidebarNocti = document.getElementById("sidebar-nocti");
  const sidebarNoctiOverlay = document.getElementById("sidebarNoctiOverlay");
  const sidebarNoctiClose = document.getElementById("sidebarNoctiClose");
  const sidebarNoctiTabs = document.querySelectorAll(".sidebar-nocti-tab");
  const sidebarNoctiList = document.getElementById("sidebarNoctiList");
  const sidebarNoctiEmpty = document.getElementById("sidebarNoctiEmpty");
  const sidebarNoctiMarkAll = document.getElementById("sidebarNoctiMarkAll");
  const sidebarNoctiSelectAll = document.getElementById(
    "sidebarNoctiSelectAll",
  );
  const sidebarNoctiDeleteSelected = document.getElementById(
    "sidebarNoctiDeleteSelected",
  );
  const sidebarNoctiSelectedCount = document.getElementById(
    "sidebarNoctiSelectedCount",
  );

  function openSidebarNocti() {
    if (!sidebarNocti) return;
    sidebarNocti.classList.add("show");
    sidebarNocti.setAttribute("aria-hidden", "false");
    sidebarNoctiOverlay && sidebarNoctiOverlay.classList.add("show");
    updateBodyScrollLock();
  }

  function closeSidebarNocti() {
    if (!sidebarNocti) return;
    sidebarNocti.classList.remove("show");
    sidebarNocti.setAttribute("aria-hidden", "true");
    sidebarNoctiOverlay && sidebarNoctiOverlay.classList.remove("show");
    updateBodyScrollLock();
  }

  if (sidebarNoctiClose)
    sidebarNoctiClose.addEventListener("click", closeSidebarNocti);
  if (sidebarNoctiOverlay)
    sidebarNoctiOverlay.addEventListener("click", closeSidebarNocti);

  /* Yon sèl "Echap" ki fèmen nenpòt panno/dropdown ki louvri kounye a,
       an priyorite (pi espesifik la anvan): panno notifikasyon lateral la,
       dropdown notifikasyon kloch la, meni itilizatè a, epi finalman
       sidebar mobil la si l ouvri. */
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (sidebarNocti && sidebarNocti.classList.contains("show")) {
      closeSidebarNocti();
    } else if (notifMenu && notifMenu.classList.contains("show")) {
      closeNotifMenu();
    } else if (userMenu && userMenu.classList.contains("show")) {
      closeUserMenu();
    } else if (sidebar && sidebar.classList.contains("show")) {
      closeSidebar();
    }
  });

  /* Filtè Toutes / Non lues (lis la ka fè scroll otomatikman si li vin gen plis eleman) */
  let sidebarNoctiFilter = "all";

  function applySidebarNoctiFilter() {
    if (!sidebarNoctiList) return;
    let visible = 0;
    sidebarNoctiList
      .querySelectorAll(".sidebar-nocti-item")
      .forEach(function (item) {
        const show =
          sidebarNoctiFilter === "all" || item.classList.contains("unread");
        item.style.display = show ? "flex" : "none";
        if (show) visible++;
      });
    if (sidebarNoctiEmpty)
      sidebarNoctiEmpty.style.display = visible === 0 ? "block" : "none";
  }

  sidebarNoctiTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      sidebarNoctiTabs.forEach(function (t) {
        t.classList.remove("active");
      });
      tab.classList.add("active");
      sidebarNoctiFilter = tab.getAttribute("data-filter");
      applySidebarNoctiFilter();
      updateSidebarNoctiSelectionUI();
    });
  });

  /* Sonkwonize badge la ak sa k rete kòm "pa li" nan panno a */
  function syncNotifBadgeFromDOM() {
    const stillUnread = sidebarNoctiList
      ? sidebarNoctiList.querySelectorAll(".sidebar-nocti-item.unread").length
      : unreadCount;
    unreadCount = stillUnread;
    updateBadge();
  }

  /* Mete a jou konpteur seleksyon an, bouton "Supprimer la sélection" ak
       eta checkbox "Tout sélectionner" (tache / pa tache / endeterminen) */
  function updateSidebarNoctiSelectionUI() {
    if (!sidebarNoctiList) return;
    const visibleItems = Array.prototype.filter.call(
      sidebarNoctiList.querySelectorAll(".sidebar-nocti-item"),
      function (item) {
        return item.style.display !== "none";
      },
    );
    const visibleChecks = visibleItems
      .map(function (item) {
        return item.querySelector(".nocti-select");
      })
      .filter(Boolean);
    const checkedCount = visibleChecks.filter(function (cb) {
      return cb.checked;
    }).length;

    if (sidebarNoctiSelectedCount)
      sidebarNoctiSelectedCount.textContent = checkedCount;
    if (sidebarNoctiDeleteSelected)
      sidebarNoctiDeleteSelected.classList.toggle("show", checkedCount > 0);

    if (sidebarNoctiSelectAll) {
      sidebarNoctiSelectAll.checked =
        visibleChecks.length > 0 && checkedCount === visibleChecks.length;
      sidebarNoctiSelectAll.indeterminate =
        checkedCount > 0 && checkedCount < visibleChecks.length;
    }
  }

  /* Delegasyon evènman sou lis la pou mark-read / delete / checkbox
       kontinye mache menm apre nou ajoute oswa retire eleman */
  if (sidebarNoctiList) {
    sidebarNoctiList.addEventListener("click", function (e) {
      const markBtn = e.target.closest(".mark-read-btn");
      if (markBtn) {
        const item = markBtn.closest(".sidebar-nocti-item");
        const notificationId = item && item.dataset.notificationId;
        if (notificationId) {
          apiClientRequest(
            `/notifications/notifications/${notificationId}/mark-read/`,
            { method: "PATCH" },
          )
            .then(refreshNotificationMenus)
            .catch((error) =>
              console.warn("Lecture de notification impossible", error),
            );
        }
        return;
      }
      const delBtn = e.target.closest(".delete-btn");
      if (delBtn) {
        const item = delBtn.closest(".sidebar-nocti-item");
        const notificationId = item && item.dataset.notificationId;
        if (notificationId) {
          apiClientRequest(`/notifications/notifications/${notificationId}/`, {
            method: "DELETE",
          })
            .then(refreshNotificationMenus)
            .catch((error) =>
              console.warn("Suppression de notification impossible", error),
            );
        }
        return;
      }
      const item = e.target.closest(
        ".sidebar-nocti-item[data-notification-id]",
      );
      if (item && !e.target.closest("input,button")) {
        apiClientRequest(
          `/notifications/notifications/${item.dataset.notificationId}/`,
        )
          .then(openNotificationTarget)
          .then(refreshNotificationMenus)
          .catch((error) =>
            console.warn("Ouverture de notification impossible", error),
          );
      }
    });

    sidebarNoctiList.addEventListener("change", function (e) {
      if (e.target.classList.contains("nocti-select")) {
        updateSidebarNoctiSelectionUI();
      }
    });
  }

  if (sidebarNoctiMarkAll) {
    sidebarNoctiMarkAll.addEventListener("click", async function () {
      await apiClientRequest("/notifications/notifications/mark-all-read/", {
        method: "POST",
      });
      await refreshNotificationMenus();
    });
  }

  /* "Tout sélectionner" - tache/detache tout notifikasyon ki vizib selon filtè a */
  if (sidebarNoctiSelectAll) {
    sidebarNoctiSelectAll.addEventListener("change", function () {
      const checked = sidebarNoctiSelectAll.checked;
      sidebarNoctiList
        .querySelectorAll(".sidebar-nocti-item")
        .forEach(function (item) {
          if (item.style.display === "none") return;
          const cb = item.querySelector(".nocti-select");
          if (cb) cb.checked = checked;
        });
      updateSidebarNoctiSelectionUI();
    });
  }

  /* "Supprimer la sélection" - efase tout notifikasyon ki koche */
  if (sidebarNoctiDeleteSelected) {
    sidebarNoctiDeleteSelected.addEventListener("click", function () {
      sidebarNoctiList
        .querySelectorAll(".nocti-select:checked")
        .forEach(function (cb) {
          const item = cb.closest(".sidebar-nocti-item");
          if (item) item.remove();
        });
      syncNotifBadgeFromDOM();
      applySidebarNoctiFilter();
      updateSidebarNoctiSelectionUI();
    });
  }

  updateSidebarNoctiSelectionUI();
  refreshNotificationMenus();

  const pendingTarget = localStorage.getItem("cejec_notification_target");
  if (pendingTarget) {
    localStorage.removeItem("cejec_notification_target");
    setTimeout(() => {
      try {
        const target = JSON.parse(pendingTarget);
        if (target.modal && typeof window[target.modal] === "function") {
          window[target.modal](target.id || undefined);
        }
      } catch (error) {
        console.warn("Destination de notification invalide", error);
      }
    }, 0);
  }

  /* ============================================================
       5) DROPDOWN22 (Hébergement / Opérations) nan sidebar la
    ============================================================ */
  const toggleBtns = document.querySelectorAll(".dropdown22-toggle");
  const menus = document.querySelectorAll(".dropdown22-menu");

  menus.forEach(function (menu, idx) {
    if (!menu.id || menu.id === "itemMenu") menu.id = "ddMenu_" + idx;
  });
  toggleBtns.forEach(function (btn, idx) {
    if (!btn.id || btn.id === "chevrToggle") btn.id = "ddToggle_" + idx;
  });

  function closeAllMenus() {
    menus.forEach(function (menu) {
      menu.classList.remove("show");
      localStorage.setItem("menuOpen_" + menu.id, "false");
    });
  }

  toggleBtns.forEach(function (toggleBtn) {
    const menu = toggleBtn.parentElement.querySelector(".dropdown22-menu");
    if (!menu) return;
    toggleBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const wasOpen = menu.classList.contains("show");
      closeAllMenus();
      if (!wasOpen) {
        menu.classList.add("show");
        localStorage.setItem("menuOpen_" + menu.id, "true");
      }
    });
  });

  document.addEventListener("click", function (e) {
    const clickedToggle = Array.prototype.some.call(toggleBtns, function (b) {
      return b.contains(e.target);
    });
    const clickedMenu = Array.prototype.some.call(menus, function (m) {
      return m.contains(e.target);
    });
    if (!clickedToggle && !clickedMenu) closeAllMenus();
  });

  menus.forEach(function (menu) {
    if (localStorage.getItem("menuOpen_" + menu.id) === "true")
      menu.classList.add("show");
  });

  // Recherche globale : les champs d'en-tête interrogent l'API, pas les
  // données de démonstration éventuellement présentes dans une page.
  document
    .querySelectorAll('a[href="Se connecter - Admin.html"]')
    .forEach((logoutLink) => {
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
        let apiUnreadCount;
        try {
          const result = await apiClientRequest(
            "/notifications/notifications/unread-count/",
          );
          apiUnreadCount = Number(result.unread_count);
        } catch (_) {
          const result = await apiClientRequest(
            "/notifications/notifications/?page_size=1000",
          );
          const notifications = Array.isArray(result)
            ? result
            : result.results || [];
          apiUnreadCount = notifications.filter(
            (notification) => !notification.is_read,
          ).length;
        }
        const safeCount = Number.isFinite(apiUnreadCount) ? apiUnreadCount : 0;
        notificationBadges.forEach((badge) => {
          badge.textContent = String(safeCount);
          /* KORIJE: te itilize badge.hidden isit la pandan updateBadge()
             pi wo a itilize style.display sou menm eleman an (.badge44).
             Melanje .hidden ak style.display sou menm badge a te ka fè l
             rete kache pou tout tan. Kounye a tou de sistèm yo itilize
             style.display pou rete konsistan. */
          badge.style.display = safeCount <= 0 ? "none" : "flex";
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
