// script_media.js
let currentPage = "mediatheque",
  galleryFiles = [],
  coverImageData = null,
  editingMediaId = null,
  editingArticleId = null;

let medias = [];
let articles = [];
let articleTags = [];

const API_BASE = "https://schoolmanagementsystem-production-6624.up.railway.app/api/v1/media-center";
const REFRESH_URL = "https://schoolmanagementsystem-production-6624.up.railway.app/api/v1/auth/users/refresh/";

// ── Auth helpers ────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('authToken'); }
function getRefreshToken() { return localStorage.getItem('refreshToken'); }

function getHeaders() {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** Attempt a silent token refresh; returns new access token or null. */
async function _tryRefresh() {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const r = await fetch(REFRESH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh })
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (data.access) {
      localStorage.setItem('authToken', data.access);
      return data.access;
    }
  } catch (e) { /* network error */ }
  return null;
}

/**
 * Wrapper around fetch that:
 *   1. Attaches the current JWT Authorization header.
 *   2. On 401, tries a silent token refresh and retries once.
 *   3. Returns the Response object (caller decides how to parse it).
 */
async function apiFetch(url, options = {}) {
  options.headers = { ...(options.headers || {}), ...getHeaders() };
  let res = await fetch(url, options);
  if (res.status === 401) {
    const newToken = await _tryRefresh();
    if (newToken) {
      options.headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, options);
    }
  }
  return res;
}


// ── Engagement tracking ─────────────────────────────────────────────────────
async function incrementView(articleId) {
  try {
    const response = await apiFetch(API_BASE + "/articles/" + articleId + "/increment_view/", { method: "POST" });
    if (!response.ok) return;
    const a = articles.find(x => x.id === articleId);
    if (a) a.views_count = (a.views_count || 0) + 1;
  } catch (e) { /* silent */ }
}

// ── Fetch Media Assets ──────────────────────────────────────────────────────
async function fetchMedias() {
  try {
    const res = await apiFetch(`${API_BASE}/media-assets/`);
    if (res.ok) {
      medias = await res.json();
      if (currentPage === "mediatheque") renderPage("mediatheque");
    } else {
      showToast("Erreur chargement médias", "error");
    }
  } catch (err) {
    console.error(err);
  }
}

// ── Fetch Articles ──────────────────────────────────────────────────────────
async function fetchArticles() {
  try {
    const res = await apiFetch(`${API_BASE}/articles/`);
    if (res.ok) {
      articles = await res.json();
      if (currentPage === "blog") renderPage("blog");
    } else {
      showToast("Erreur chargement articles", "error");
    }
  } catch (err) {
    console.error(err);
  }
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  fetchMedias();
  fetchArticles();
  renderPage("mediatheque");

  // Drag and drop initializations
  const dz = document.getElementById("dropZone");
  if (dz) {
    dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("dragover"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("dragover"));
    dz.addEventListener("drop", (e) => {
      e.preventDefault();
      dz.classList.remove("dragover");
      document.getElementById("mediaFile").files = e.dataTransfer.files;
      handleFileSelect({ target: { files: e.dataTransfer.files } });
    });
  }
  const coverDZ = document.getElementById("coverDropZone");
  if (coverDZ) {
    coverDZ.addEventListener("dragover", (e) => { e.preventDefault(); coverDZ.classList.add("dragover"); });
    coverDZ.addEventListener("dragleave", () => coverDZ.classList.remove("dragover"));
    coverDZ.addEventListener("drop", (e) => {
      e.preventDefault();
      coverDZ.classList.remove("dragover");
      const files = e.dataTransfer.files;
      if (files.length > 0) handleCoverImage({ target: { files: [files[0]] } });
    });
  }
  const editor = document.getElementById("articleContent");
  if (editor) {
    editor.addEventListener("keyup", updateEditorToolbarState);
    editor.addEventListener("mouseup", updateEditorToolbarState);
  }
  document.querySelectorAll("#editorToolbar .editor-btn[data-cmd]").forEach((btn) => {
    btn.addEventListener("click", function () { formatText(this.dataset.cmd); });
  });
});

// Utilities
function showToast(msg, type = "success") {
  const icons = { success: "fa-check-circle", error: "fa-times-circle", info: "fa-info-circle" };
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<i class="fas ${icons[type]}"></i> ${msg}`;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateX(100px)";
    el.style.transition = "all .3s";
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  }
}
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
}
document.querySelectorAll(".modal-overlay").forEach((m) =>
  m.addEventListener("click", function (e) {
    if (e.target === this) {
      this.classList.remove("open");
      document.body.style.overflow = "";
    }
  })
);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".modal-overlay.open").forEach((m) => {
      m.classList.remove("open");
      document.body.style.overflow = "";
    });
  }
});

// MEDIA CRUD
function openMediaModal(editId = null) {
  editingMediaId = editId;
  const deleteBtn = document.getElementById("mediaDeleteBtn");
  if (editId) {
    const m = medias.find((x) => x.id === editId);
    if (!m) return;
    document.getElementById("mediaModalTitle").innerHTML = '<i class="fas fa-edit"></i> Modifier le média';
    document.getElementById("mediaEditId").value = m.id;
    document.getElementById("mediaTitre").value = m.title || m.titre || "";
    document.getElementById("mediaType").value = m.media_type === 'video' ? 'Vidéo' : 'Photo';
    // Mappings as necessary, default to placeholder values for demo if backend fields differ
    document.getElementById("mediaPromo").value = m.promo || "Promotion 1";
    document.getElementById("mediaAlbum").value = m.album || "";
    document.getElementById("mediaDesc").value = m.description || "";
    document.getElementById("filePreview").innerHTML = m.file ? `<div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:1px solid var(--border)"><img src="${m.file}" style="width:100%;height:100%;object-fit:cover"></div>` : "";
    if (deleteBtn) deleteBtn.style.display = "inline-flex";
  } else {
    document.getElementById("mediaModalTitle").innerHTML = '<i class="fas fa-image"></i> Ajouter un média';
    document.getElementById("mediaEditId").value = "";
    document.getElementById("mediaTitre").value = "";
    document.getElementById("mediaType").value = "Photo";
    document.getElementById("mediaPromo").value = "Promotion 1";
    document.getElementById("mediaAlbum").value = "";
    document.getElementById("mediaDesc").value = "";
    document.getElementById("filePreview").innerHTML = "";
    document.getElementById("mediaFile").value = "";
    if (deleteBtn) deleteBtn.style.display = "none";
  }
  openModal("mediaModal");
}

function handleFileSelect(event) {
  const preview = document.getElementById("filePreview");
  preview.innerHTML = "";
  Array.from(event.target.files).forEach((f) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.innerHTML += `<div style="position:relative;width:80px;height:80px;border-radius:8px;overflow:hidden;border:1px solid var(--border)"><img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover"></div>`;
    };
    reader.readAsDataURL(f);
  });
}

async function saveMedia() {
  const titre = document.getElementById("mediaTitre").value.trim();
  const type = document.getElementById("mediaType").value === "Vidéo" ? 'video' : 'image';
  const promo = document.getElementById("mediaPromo").value;
  const album = document.getElementById("mediaAlbum").value.trim();
  const desc = document.getElementById("mediaDesc").value.trim();
  const editId = document.getElementById("mediaEditId").value;
  
  if (!titre) { showToast("Titre obligatoire", "error"); return; }
  
  const fileInput = document.getElementById("mediaFile");
  const files = Array.from(fileInput.files || []);

  if (!editId && !files.length) {
    showToast("Veuillez sélectionner un fichier", "error"); return;
  }

  try {
    const saveOne = async (file, index = 0) => {
      const formData = new FormData();
      formData.append('title', files.length > 1 ? `${titre} (${index + 1})` : titre);
      formData.append('media_type', file?.type.startsWith('video/') ? 'video' : type);
      formData.append('description', desc);
      formData.append('promotion', promo);
      formData.append('album', album);
      if (file) formData.append('file', file);
      const url = editId ? `${API_BASE}/media-assets/${editId}/` : `${API_BASE}/media-assets/`;
      return apiFetch(url, { method: editId ? 'PATCH' : 'POST', body: formData });
    };
    const responses = editId ? [await saveOne(files[0])] : await Promise.all(files.map(saveOne));
    if (responses.every(response => response.ok)) {
      showToast(editId ? "Média mis à jour" : "Média ajouté");
      closeModal("mediaModal");
      fetchMedias();
    } else {
      const err = await responses.find(response => !response.ok).json();
      showToast(err.detail || "Erreur lors de la sauvegarde", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Erreur de connexion", "error");
  }
}

async function deleteMedia() {
  const editId = document.getElementById("mediaEditId").value;
  if (!editId || !confirm("Supprimer ce média ?")) return;
  
  try {
    const res = await apiFetch(`${API_BASE}/media-assets/${editId}/`, {
      method: "DELETE"
    });
    if (res.ok) {
      showToast("Média supprimé", "info");
      closeModal("mediaModal");
      fetchMedias();
    } else {
      showToast("Erreur lors de la suppression", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Erreur de connexion", "error");
  }
}

// ARTICLE CRUD
function openArticleModal(editId = null) {
  editingArticleId = editId;
  const deleteBtn = document.getElementById("articleDeleteBtn");
  articleTags = [];
  galleryFiles = [];
  coverImageData = null;

  if (editId) {
    const a = articles.find((x) => x.id === editId);
    if (!a) return;
    incrementView(editId);
    document.getElementById("articleModalTitle").innerHTML = '<i class="fas fa-edit"></i> Modifier l\'article';
    document.getElementById("articleEditId").value = a.id;
    document.getElementById("articleTitle").value = a.title || a.titre || "";
    document.getElementById("articleAuthor").value = a.author_name || "";
    document.getElementById("articleDate").value = a.publication_date ? a.publication_date.slice(0, 16) : "";
    document.getElementById("articleCat").value = a.category || "Actualités";
    document.getElementById("articleResume").value = a.description || "";
    document.getElementById("articleContent").innerHTML = a.content || "";
    
    // Sync status select to article status
    const statusSel = document.getElementById("articleStatus");
    if (statusSel && a.status) statusSel.value = a.status;
    // Populate shareLink from backend canonical URL
    const shareLinkEl = document.getElementById("shareLink");
    if (shareLinkEl) {
      if (a.share_url) {
        shareLinkEl.value = a.share_url;
      } else if (a.slug) {
        shareLinkEl.value = "https://cejec.edu.ht/blog/" + a.slug;
      }
    }
    
    if (a.cover_image && a.cover_image.file) {
      updateCoverPreview(a.cover_image.file, a.cover_image.title || "Cover");
      coverImageData = a.cover_image.file;
    } else {
      removeCoverImage(new Event('click'));
    }

    if (a.tags && Array.isArray(a.tags)) {
      articleTags = a.tags.map(t => t.name);
    }
    renderTags();

    if (deleteBtn) deleteBtn.style.display = "inline-flex";
  } else {
    document.getElementById("articleModalTitle").innerHTML = '<i class="fas fa-pen"></i> Nouvel Article';
    document.getElementById("articleEditId").value = "";
    document.getElementById("articleTitle").value = "";
    document.getElementById("articleAuthor").value = "";
    const shareLinkNew = document.getElementById("shareLink");
    if (shareLinkNew) shareLinkNew.value = "https://cejec.edu.ht/blog/titre-article";
    
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById("articleDate").value = now.toISOString().slice(0, 16);
    
    document.getElementById("articleCat").value = "Actualités";
    document.getElementById("articleResume").value = "";
    document.getElementById("articleContent").innerHTML = "";
    removeCoverImage(new Event('click'));
    if (deleteBtn) deleteBtn.style.display = "none";
  }
  updateCharCount();
  renderTags();
  renderGallery();
  openModal("articleModal");
}

async function saveArticle(statusStr) {
  const titre = document.getElementById("articleTitle").value.trim();
  if (!titre) { showToast("Titre obligatoire", "error"); return; }
  const statusSelect = document.getElementById("articleStatus");
  const statusMap = { brouillon: "draft", programme: "scheduled", publie: "published", publié: "published", programmé: "scheduled" };
  const backendStatus = statusStr
    ? (statusMap[statusStr.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")] || statusStr)
    : (statusSelect ? statusSelect.value : "draft");
  const formData = new FormData();
  formData.append("title", titre);
  formData.append("status", backendStatus);
  formData.append("category", document.getElementById("articleCat").value);
  formData.append("description", document.getElementById("articleResume").value.trim());
  formData.append("content", document.getElementById("articleContent").innerHTML);
  const pubDate = document.getElementById("articleDate").value;
  if (pubDate) formData.append("publication_date", pubDate);
  if (articleTags && articleTags.length > 0) formData.append("tags_list", JSON.stringify(articleTags));
  const coverInput = document.getElementById("coverImageInput");
  if (coverInput && coverInput.files[0]) formData.append("cover_image", coverInput.files[0]);
  galleryFiles.forEach(item => formData.append("gallery_files", item.file));
  const editId = document.getElementById("articleEditId").value;
  try {
    let url = API_BASE + "/articles/", method = "POST";
    if (editId) { url = API_BASE + "/articles/" + editId + "/"; method = "PATCH"; }
    const res = await apiFetch(url, { method, body: formData });
    if (res.ok) {
      const saved = await res.json();
      showToast(editId ? "Article mis à jour" : "Article créé", "success");
      if (saved.share_url) {
        const shareLinkEl = document.getElementById("shareLink");
        if (shareLinkEl) shareLinkEl.value = saved.share_url;
        const seoSlug = document.getElementById("seoSlug");
        if (seoSlug && saved.slug) seoSlug.textContent = saved.slug;
      }
      closeModal("articleModal");
      fetchArticles();
    } else {
      const err = await res.json();
      showToast(err.detail || "Erreur de sauvegarde", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Erreur de connexion", "error");
  }
}

async function deleteArticle() {
  const editId = document.getElementById("articleEditId").value;
  if (!editId || !confirm("Supprimer définitivement cet article ?")) return;
  try {
    const res = await apiFetch(`${API_BASE}/articles/${editId}/`, {
      method: "DELETE"
    });
    if (res.ok) {
      showToast("Article supprimé", "info");
      closeModal("articleModal");
      fetchArticles();
    } else {
      showToast("Erreur lors de la suppression", "error");
    }
  } catch (err) {
    console.error(err);
  }
}

function previewArticle() {
  const titre = (document.getElementById("articleTitle") ? document.getElementById("articleTitle").value : "") || "Aperçu";
  const contenu = document.getElementById("articleContent") ? document.getElementById("articleContent").innerHTML : "";
  const auteur = document.getElementById("articleAuthor") ? document.getElementById("articleAuthor").value || "CEJEC Communication" : "CEJEC Communication";
  const dateVal = document.getElementById("articleDate") ? document.getElementById("articleDate").value : "";
  const dateStr = dateVal ? new Date(dateVal).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" });
  const resume = document.getElementById("articleResume") ? document.getElementById("articleResume").value : "";
  const catEl = document.getElementById("articleCat");
  const catLabels = { news:"Actualités", communication:"Communiqués", event:"Événements", entrepreneurship:"Entrepreneuriat", innovation:"Innovation", testimonial:"Témoignages", partnership:"Partenariats", student_life:"Vie estudiantine", success:"Réussites", training:"Formations" };
  const catKey = catEl ? catEl.value : "news";
  const catLabel = catLabels[catKey] || catKey;
  const coverSrc = coverImageData || "";
  const tagsHtml = articleTags.length ? articleTags.map(t => "<span style=\"background:#e8f1fb;color:#0A4D8C;padding:4px 12px;border-radius:20px;font-size:.8rem;font-weight:500;\">" + t + "</span>").join(" ") : "";
  const shareUrl = document.getElementById("shareLink") ? document.getElementById("shareLink").value : "https://cejec.edu.ht/blog/article";
  const wordCount = contenu.replace(/<[^>]+>/g,"").trim().split(/s+/).length;
  const readMin = Math.max(1, Math.ceil(wordCount / 200));
  const w = window.open("", "_blank", "width=960,height=800");
  w.document.write("<!DOCTYPE html><html lang=\"fr\"><head><meta charset=\"UTF-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + titre + " – CEJEC</title>" +
    "<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap\" rel=\"stylesheet\">" +
    "<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css\">" +
    "<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#f7f9fc;color:#1a1f2b;line-height:1.8}" +
    ".hero{width:100%;max-height:480px;overflow:hidden;position:relative}" +
    ".hero img{width:100%;max-height:480px;object-fit:cover;display:block}" +
    ".hero-overlay{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,.7));padding:40px 60px 30px}" +
    ".hero-category{background:#0A4D8C;color:#fff;padding:4px 14px;border-radius:20px;font-size:.8rem;font-weight:600;display:inline-block;margin-bottom:12px}" +
    ".hero-title{font-family:Playfair Display,serif;color:#fff;font-size:2.4rem;font-weight:700;line-height:1.25}" +
    ".article-wrap{max-width:800px;margin:0 auto;padding:40px 20px}" +
    ".article-meta{display:flex;align-items:center;gap:16px;color:#5b6675;font-size:.9rem;padding:20px 0;border-bottom:1px solid #e5ebf2;flex-wrap:wrap}" +
    ".author-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#0A4D8C,#1a7fd4);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1rem}" +
    ".meta-divider{color:#ccd5e0}" +
    ".article-resume{background:#f0f6ff;border-left:4px solid #0A4D8C;padding:16px 20px;border-radius:0 12px 12px 0;color:#2c3a4a;font-style:italic;margin:28px 0}" +
    ".article-content{margin-top:28px}" +
    ".article-content h1,.article-content h2,.article-content h3{font-family:Playfair Display,serif;color:#073864;margin:28px 0 12px}" +
    ".article-content h1{font-size:1.9rem}.article-content h2{font-size:1.5rem}.article-content h3{font-size:1.25rem}" +
    ".article-content p{margin-bottom:16px;color:#2c3a4a}" +
    ".article-content img{max-width:100%;border-radius:12px;margin:16px 0}" +
    ".article-content blockquote{border-left:4px solid #0A4D8C;padding:12px 20px;margin:20px 0;background:#f4f8fd;border-radius:0 10px 10px 0;color:#2c3a4a;font-style:italic}" +
    ".article-content a{color:#0A4D8C;text-decoration:underline}" +
    ".article-content ul,.article-content ol{padding-left:24px;margin-bottom:16px}" +
    ".article-content li{margin-bottom:6px}" +
    ".tags-section{margin-top:32px;padding-top:20px;border-top:1px solid #e5ebf2}" +
    ".tags-label{font-size:.85rem;color:#5b6675;font-weight:600;margin-bottom:10px}" +
    ".share-bar{background:#073864;color:#fff;padding:20px 0;margin-top:40px;text-align:center}" +
    ".share-bar h4{margin-bottom:14px;font-size:1rem;font-weight:600}" +
    ".share-btns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}" +
    ".share-btn{padding:10px 20px;border:none;border-radius:8px;color:#fff;font-weight:600;cursor:pointer;font-size:.9rem;display:flex;align-items:center;gap:8px;text-decoration:none;transition:.2s}" +
    ".share-btn:hover{opacity:.85}" +
    ".btn-fb{background:#1877F2}.btn-tw{background:#000}.btn-wa{background:#25D366}.btn-li{background:#0A66C2}" +
    ".preview-badge{background:rgba(255,165,0,.15);border:1px solid orange;color:orange;padding:6px 16px;border-radius:6px;font-size:.8rem;text-align:center;margin-bottom:20px}" +
    "@media(max-width:640px){.hero-title{font-size:1.5rem}.hero-overlay{padding:20px}.article-wrap{padding:20px 16px}}</style></head><body>" +
    (coverSrc ? "<div class=\"hero\"><img src=\"" + coverSrc + "\" alt=\"Cover\"><div class=\"hero-overlay\"><span class=\"hero-category\">" + catLabel + "</span><h1 class=\"hero-title\">" + titre + "</h1></div></div>" : "<div style=\"background:linear-gradient(135deg,#073864,#0A4D8C);padding:60px 60px 40px;\"><span style=\"background:rgba(255,255,255,.15);color:#fff;padding:4px 14px;border-radius:20px;font-size:.8rem;font-weight:600;display:inline-block;margin-bottom:12px;\">" + catLabel + "</span><h1 style=\"font-family:Playfair Display,serif;color:#fff;font-size:2.4rem;font-weight:700;\">" + titre + "</h1></div>") +
    "<div class=\"article-wrap\">" +
    "<div class=\"preview-badge\">👁 Aperçu – Ce rendu reflète la publication réelle</div>" +
    "<div class=\"article-meta\"><div class=\"author-avatar\">" + auteur.charAt(0).toUpperCase() + "</div><div><strong>" + auteur + "</strong></div><span class=\"meta-divider\">•</span><span><i class=\"far fa-calendar\"></i> " + dateStr + "</span><span class=\"meta-divider\">•</span><span><i class=\"far fa-clock\"></i> " + readMin + " min de lecture</span></div>" +
    (resume ? "<div class=\"article-resume\">" + resume + "</div>" : "") +
    "<div class=\"article-content\">" + contenu + "</div>" +
    (tagsHtml ? "<div class=\"tags-section\"><div class=\"tags-label\">Tags</div>" + tagsHtml + "</div>" : "") +
    "</div>" +
    "<div class=\"share-bar\"><h4><i class=\"fas fa-share-alt\"></i> Partager cet article</h4><div class=\"share-btns\">" +
    "<a class=\"share-btn btn-fb\" href=\"https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareUrl) + "\" target=\"_blank\"><i class=\"fab fa-facebook-f\"></i> Facebook</a>" +
    "<a class=\"share-btn btn-tw\" href=\"https://x.com/intent/tweet?text=" + encodeURIComponent(titre) + "&url=" + encodeURIComponent(shareUrl) + "\" target=\"_blank\"><i class=\"fab fa-x-twitter\"></i> X/Twitter</a>" +
    "<a class=\"share-btn btn-wa\" href=\"https://wa.me/?text=" + encodeURIComponent(titre + "\n" + shareUrl) + "\" target=\"_blank\"><i class=\"fab fa-whatsapp\"></i> WhatsApp</a>" +
    "<a class=\"share-btn btn-li\" href=\"https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(shareUrl) + "\" target=\"_blank\"><i class=\"fab fa-linkedin-in\"></i> LinkedIn</a>" +
    "</div></div></body></html>");
  w.document.close();
}

function openLightbox(src) {
  document.getElementById("lightboxImg").src = src;
  document.getElementById("lightbox").style.display = "flex";
}
function closeLightbox() {
  document.getElementById("lightbox").style.display = "none";
}

function navigateTo(page) {
  document.querySelectorAll("#navTabs button").forEach((b) => b.classList.remove("active"));
  document.querySelector(`#navTabs button[data-page="${page}"]`)?.classList.add("active");
  currentPage = page;
  renderPage(page);
}

document.querySelectorAll("#navTabs button").forEach((b) =>
  b.addEventListener("click", function () { navigateTo(this.dataset.page); })
);

function renderPage(page) {
  const mc = document.getElementById("mainContent");
  if (!mc) return;
  mc.innerHTML = page === "mediatheque" ? renderMediatheque() : page === "blog" ? renderBlog() : renderMediatheque();
}

function renderMediatheque() {
  const promos = ["Promotion 1", "Promotion 2", "Promotion 3", "Promotion 4", "Promotion 5", "Promotion 6"];
  const allPromos = promos.map((p) => ({
    name: p,
    items: medias.filter((m) => (m.promo || 'Promotion 1') === p)
  })).filter((p) => p.items.length > 0);

  // Additional fallback for items without promos
  const otherItems = medias.filter(m => !promos.includes(m.promo || 'Promotion 1'));
  if (otherItems.length > 0) {
    allPromos.push({ name: "Autres", items: otherItems });
  }

  return `<div class="stats-grid">
    <div class="stat-card"><div class="stat-info"><span>Photos</span><h3>${medias.filter((m) => m.media_type === "image").length}</h3></div><div class="stat-icon"><i class="fas fa-image"></i></div></div>
    <div class="stat-card"><div class="stat-info"><span>Vidéos</span><h3>${medias.filter((m) => m.media_type === "video").length}</h3></div><div class="stat-icon"><i class="fas fa-video"></i></div></div>
    <div class="stat-card"><div class="stat-info"><span>Total</span><h3>${medias.length}</h3></div><div class="stat-icon"><i class="fas fa-database"></i></div></div>
  </div>
  <div class="filters-row">
    <div class="search-box"><i class="fas fa-search"></i><input placeholder="Rechercher..." oninput="filterMedia(this.value)"></div>
    <select class="filter-select" onchange="filterMediaByType(this.value)"><option value="tous">Types</option><option>Photo</option><option>Vidéo</option></select>
  </div>
  ${allPromos.map((p) => renderPromoSection(p.name, p.items)).join("")}
  ${medias.length === 0 ? `<div class="card" style="text-align:center;padding:60px"><i class="fas fa-photo-film" style="font-size:4rem;color:var(--muted-light)"></i><h3>Aucun média</h3><button class="btn btn-primary" onclick="openMediaModal()"><i class="fas fa-plus"></i> Ajouter</button></div>` : ""}`;
}

function renderPromoSection(title, items) {
  if (!items.length) return "";
  return `<div class="card"><div class="card-header"><h2><i class="fas fa-layer-group"></i> ${title} <span class="pill pill-info">${items.length} média(s)</span></h2></div><div class="media-grid">${items.map((m) => `<div class="media-card"><div class="media-preview" onclick="openLightbox('${m.file}')"><img src="${m.file || 'https://picsum.photos/400/300?random='+m.id}" alt="${m.title}" loading="lazy"><span class="media-badge">${m.media_type === "video" ? '<i class="fas fa-play"></i>' : '<i class="fas fa-image"></i>'} ${m.media_type === 'video' ? 'Vidéo' : 'Photo'}</span><button class="edit-overlay" onclick="event.stopPropagation();openMediaModal(${m.id})" title="Modifier"><i class="fas fa-pen"></i></button></div><div class="media-body"><div class="media-title">${m.title}</div><div class="media-meta"><i class="fas fa-calendar"></i> ${m.created_at ? m.created_at.slice(0,10) : ''}</div></div></div>`).join("")}</div></div>`;
}

function filterMedia(v) {
  document.querySelectorAll(".media-card").forEach((c) => c.style.display = c.innerText.toLowerCase().includes(v.toLowerCase()) ? "" : "none");
}
function filterMediaByType(v) {
  document.querySelectorAll(".media-card").forEach((c) => c.style.display = v === "tous" || c.innerText.includes(v) ? "" : "none");
}

function renderBlog() {
  const pub = articles.filter((a) => a.status === "published");
  const bro = articles.filter((a) => a.status === "draft");
  return `<div class="stats-grid">
    <div class="stat-card"><div class="stat-info"><span>Publiés</span><h3>${pub.length}</h3></div><div class="stat-icon" style="color:var(--success)"><i class="fas fa-check-circle"></i></div></div>
    <div class="stat-card"><div class="stat-info"><span>Brouillons</span><h3>${bro.length}</h3></div><div class="stat-icon" style="color:var(--warning)"><i class="fas fa-edit"></i></div></div>
    <div class="stat-card"><div class="stat-info"><span>Total</span><h3>${articles.length}</h3></div><div class="stat-icon"><i class="fas fa-newspaper"></i></div></div>
  </div>
  <div class="filters-row">
    <div class="search-box"><i class="fas fa-search"></i><input placeholder="Rechercher..." oninput="filterBlog(this.value)"></div>
    <select class="filter-select" onchange="filterBlogByCat(this.value)"><option value="tous">Catégories</option>${[...new Set(articles.map((a) => a.category))].filter(Boolean).map((c) => `<option>${c}</option>`).join("")}</select>
    <select class="filter-select" onchange="filterBlogByStatus(this.value)"><option value="tous">Statuts</option><option value="published">Publié</option><option value="draft">Brouillon</option><option value="archived">Archivé</option></select>
  </div>
  <div class="blog-grid">${articles.map((a) => `<div class="blog-card" onclick="openArticleModal(${a.id})"><div class="blog-img"><img src="${a.cover_image && a.cover_image.file ? a.cover_image.file : "https://picsum.photos/400/250?random=" + a.id}" alt="${a.title}" loading="lazy"><span class="blog-category">${a.category || ''}</span><button class="edit-btn-overlay" onclick="event.stopPropagation();openArticleModal(${a.id})" title="Modifier"><i class="fas fa-pen"></i></button></div><div class="blog-body"><div class="blog-title">${a.title}</div><div class="blog-excerpt">${a.description || ''}</div><div class="blog-meta"><span><i class="fas fa-user"></i> ${a.author_name || 'Auteur'}</span><span><i class="fas fa-calendar"></i> ${a.publication_date ? a.publication_date.slice(0, 10) : ''}</span><span class="pill ${a.status === "published" ? "pill-success" : a.status === "draft" ? "pill-warning" : "pill-muted"}">${a.status}</span></div></div><div class="blog-footer"><div class="blog-stats"><span><i class="fas fa-eye"></i> ${a.views_count || 0}</span><span><i class="fas fa-comment"></i> ${a.comments_count || 0}</span><span><i class="fas fa-share-alt"></i> ${a.shares_count || 0}</span></div><div class="blog-actions" onclick="event.stopPropagation()"><button class="btn btn-sm btn-facebook" onclick="shareFromBlog('facebook',${a.id})"><i class="fab fa-facebook-f"></i></button><button class="btn btn-sm btn-twitter" onclick="shareFromBlog('twitter',${a.id})"><i class="fab fa-x-twitter"></i></button><button class="btn btn-sm btn-whatsapp" onclick="shareFromBlog('whatsapp',${a.id})"><i class="fab fa-whatsapp"></i></button></div></div></div>`).join("")}</div>${articles.length === 0 ? `<div class="card" style="text-align:center;padding:60px"><i class="fas fa-newspaper" style="font-size:4rem;color:var(--muted-light)"></i><h3>Aucun article</h3><button class="btn btn-primary" onclick="openArticleModal()"><i class="fas fa-pen"></i> Créer</button></div>` : ""}`;
}
function shareFromBlog(platform, articleId) {
  const article = articles.find(a => a.id === articleId);
  if (!article) return;
  const shareUrl = article.share_url || ("https://cejec.edu.ht/blog/" + (article.slug || article.id));
  const encoded = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(article.title || "Article CEJEC");
  const desc = encodeURIComponent((article.description || "").slice(0, 200));
  const cover = article.cover_image && article.cover_image.file_url ? encodeURIComponent(article.cover_image.file_url) : "";
  const tags = article.tags && article.tags.length ? article.tags.map(t => "%23" + t.name.replace(/\s+/g, "")).join("%20") : "";
  const shareUrls = {
    facebook: "https://www.facebook.com/sharer/sharer.php?u=" + encoded + "&quote=" + text,
    twitter: "https://x.com/intent/tweet?text=" + text + "&url=" + encoded + (tags ? "&hashtags=" + article.tags.map(t=>t.name).join(",") : ""),
    whatsapp: "https://wa.me/?text=" + text + "%0A" + desc + "%0A" + encoded,
    linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + encoded + "&title=" + text + "&summary=" + desc,
  };
  if (shareUrls[platform]) {
    window.open(shareUrls[platform], "_blank", "width=600,height=500");
    // Increment share count silently
    apiFetch(API_BASE + "/articles/" + articleId + "/increment_share/", { method: "POST" })
      .then(response => {
        if (!response.ok) return;
        const a = articles.find(x => x.id === articleId);
        if (a) { a.shares_count = (a.shares_count || 0) + 1; }
      }).catch(() => {});
    showToast("Partagé sur " + platform, "success");
  }
}
function filterBlog(v) { document.querySelectorAll(".blog-card").forEach((c) => c.style.display = c.innerText.toLowerCase().includes(v.toLowerCase()) ? "" : "none"); }
function filterBlogByCat(v) { document.querySelectorAll(".blog-card").forEach((c) => c.style.display = v === "tous" || c.innerText.includes(v) ? "" : "none"); }
function filterBlogByStatus(v) {
  // Mapping display text back to status value or check text
  const valMap = { 'published': 'published', 'draft': 'draft', 'archived': 'archived' };
  document.querySelectorAll(".blog-card").forEach((c) => c.style.display = v === "tous" || c.innerHTML.includes(valMap[v]) ? "" : "none");
}

function handleCoverImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) { showToast("Veuillez sélectionner une image", "error"); return; }
  const reader = new FileReader();
  reader.onload = function (e) { coverImageData = e.target.result; updateCoverPreview(coverImageData, file.name); };
  reader.readAsDataURL(file);
}
function updateCoverPreview(dataUrl, fileName) {
  document.getElementById("coverPreviewArea").innerHTML = `<img src="${dataUrl}" alt="Cover">`;
  document.getElementById("coverFileName").textContent = fileName || "Image sélectionnée";
  const btn = document.getElementById("removeCoverBtn");
  if (btn) btn.style.opacity = "1";
}
function removeCoverImage(event) {
  if (event) event.stopPropagation();
  coverImageData = null;
  document.getElementById("coverPreviewArea").innerHTML = `<div class="no-image"><i class="fas fa-image"></i><span>Aucune image</span></div>`;
  document.getElementById("coverFileName").textContent = "—";
  const btn = document.getElementById("removeCoverBtn");
  if (btn) btn.style.opacity = "0";
  const input = document.getElementById("coverImageInput");
  if (input) input.value = "";
}
function selectRecommendedCover(url) {
  coverImageData = url;
  updateCoverPreview(url, "Image recommandée");
}

function updateEditorToolbarState() {
  document.querySelectorAll("#editorToolbar .editor-btn[data-cmd]").forEach((btn) => {
    const cmd = btn.dataset.cmd;
    let isActive = false;
    try {
      if (cmd === "bold") isActive = document.queryCommandState("bold");
      else if (cmd === "italic") isActive = document.queryCommandState("italic");
      else if (cmd === "underline") isActive = document.queryCommandState("underline");
      else if (cmd === "ul") isActive = document.queryCommandState("insertUnorderedList");
      else if (cmd === "ol") isActive = document.queryCommandState("insertOrderedList");
      else if (cmd === "h1") isActive = document.queryCommandValue("formatBlock") === "h1";
      else if (cmd === "h2") isActive = document.queryCommandValue("formatBlock") === "h2";
      else if (cmd === "h3") isActive = document.queryCommandValue("formatBlock") === "h3";
      else if (cmd === "quote") isActive = document.queryCommandValue("formatBlock") === "blockquote";
    } catch (err) { isActive = false; }
    if (isActive) btn.classList.add("active"); else btn.classList.remove("active");
  });
}
function formatText(cmd) {
  const editor = document.getElementById("articleContent");
  editor.focus();
  if (cmd === "link") {
    const url = prompt("URL du lien:");
    if (!url) return;
    const sel = window.getSelection();
    if (sel.toString().length > 0) document.execCommand("createLink", false, url);
    else document.execCommand("insertHTML", false, `<a href="${url}" target="_blank">${url}</a>`);
  } else if (cmd === "image") {
    const url = prompt("URL de l'image:");
    if (!url) return;
    document.execCommand("insertImage", false, url);
  } else if (cmd === "h1") document.execCommand("formatBlock", false, "h1");
  else if (cmd === "h2") document.execCommand("formatBlock", false, "h2");
  else if (cmd === "h3") document.execCommand("formatBlock", false, "h3");
  else if (cmd === "quote") document.execCommand("formatBlock", false, "blockquote");
  else if (cmd === "hr") document.execCommand("insertHorizontalRule", false, null);
  else document.execCommand(cmd, false, null);
  updateEditorToolbarState();
}

function handleTagInput(event) {
  if (event.key === "Enter" || event.key === ",") {
    event.preventDefault();
    const input = document.getElementById("tagInput"), tag = input.value.trim().replace(",", "");
    if (tag && !articleTags.includes(tag)) { articleTags.push(tag); renderTags(); }
    input.value = "";
  }
}
function removeTag(i) { articleTags.splice(i, 1); renderTags(); }
function renderTags() {
  const container = document.getElementById("tagsContainer"), input = document.getElementById("tagInput");
  container.innerHTML = "";
  articleTags.forEach((t, i) => {
    const s = document.createElement("span");
    s.className = "tag";
    s.innerHTML = `${t} <span class="tag-close" onclick="event.stopPropagation();removeTag(${i})">&times;</span>`;
    container.appendChild(s);
  });
  container.appendChild(input);
  input.focus();
}

function addGalleryMedia(event) {
  const files = Array.from(event.target.files);
  files.forEach((f) => {
    if (f.size > 10 * 1024 * 1024) { showToast(`${f.name} dépasse 10MB`, "error"); return; }
    const reader = new FileReader();
    reader.onload = function (e) {
      galleryFiles.push({ name: f.name, type: f.type, data: e.target.result, file: f });
      renderGallery();
    };
    reader.readAsDataURL(f);
  });
}
function removeGalleryMedia(i) { galleryFiles.splice(i, 1); renderGallery(); }
function renderGallery() {
  const grid = document.getElementById("galleryGrid");
  grid.innerHTML = "";
  galleryFiles.forEach((f, i) => {
    const isVideo = f.type.startsWith("video/");
    grid.innerHTML += `<div class="media-upload-item">${isVideo ? `<video src="${f.data}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0"></video><i class="fas fa-play" style="position:absolute;z-index:1;color:white;font-size:1.5rem"></i>` : `<img src="${f.data}" alt="${f.name}">`}<button class="remove-media" onclick="event.stopPropagation();removeGalleryMedia(${i})"><i class="fas fa-times"></i></button></div>`;
  });
  grid.innerHTML += `<div class="media-upload-item" onclick="document.getElementById('galleryInput').click()"><div class="add-placeholder"><i class="fas fa-plus-circle"></i><span>Ajouter</span></div></div>`;
}

function updateCharCount() {
  const el = document.getElementById("articleResume");
  if (!el) return;
  const len = el.value.length;
  document.getElementById("charCount").textContent = len + " caractères";
  document.getElementById("charCount").style.color = len > 160 ? "var(--red)" : "var(--muted-light)";
}
function updateSEOPreview() {
  const titre = document.getElementById("articleTitle").value || "Titre de l'article";
  const resume = document.getElementById("articleResume").value || "Le résumé apparaîtra ici...";
  const slug = titre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/, "") || "titre-article";
  const elTitle = document.getElementById("seoTitle"), elSlug = document.getElementById("seoSlug"), elDesc = document.getElementById("seoDesc"), share = document.getElementById("shareLink");
  if (elTitle) elTitle.textContent = titre;
  if (elSlug) elSlug.textContent = slug;
  if (elDesc) elDesc.textContent = resume.length > 160 ? resume.substring(0, 157) + "..." : resume;
  // Only set shareLink if it still contains the placeholder
  if (share && (share.value.includes("titre-article") || share.value === "")) {
    share.value = "https://cejec.edu.ht/blog/" + slug;
  }
}
function shareArticle(platform) {
  const titre = document.getElementById("articleTitle") ? document.getElementById("articleTitle").value || "Article CEJEC" : "Article CEJEC";
  const shareLink = document.getElementById("shareLink");
  const shareUrl = shareLink ? shareLink.value : "https://cejec.edu.ht/blog/article";
  const encoded = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(titre);
  const desc = encodeURIComponent((document.getElementById("articleResume") ? document.getElementById("articleResume").value : "").slice(0, 200));
  const tagStr = articleTags.length ? articleTags.map(t => "%23" + t.replace(/\s+/g, "")).join("%20") : "";
  const shareUrls = {
    facebook: "https://www.facebook.com/sharer/sharer.php?u=" + encoded + "&quote=" + text,
    twitter: "https://x.com/intent/tweet?text=" + text + "&url=" + encoded + (articleTags.length ? "&hashtags=" + articleTags.join(",") : ""),
    linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + encoded + "&title=" + text + "&summary=" + desc,
    whatsapp: "https://wa.me/?text=" + text + "%0A" + desc + "%0A" + encoded,
    instagram: null,
    tiktok: null,
  };
  const editId = document.getElementById("articleEditId") ? document.getElementById("articleEditId").value : null;
  if (platform === "instagram" || platform === "tiktok") {
    copyShareLink();
    showToast("Lien copié — collez-le dans " + platform, "info");
    return;
  }
  if (navigator.share && (platform === "native" || !shareUrls[platform])) {
    navigator.share({ title: titre, text: titre + "\n" + (document.getElementById("articleResume") ? document.getElementById("articleResume").value : ""), url: shareUrl })
      .catch(() => {});
  } else if (shareUrls[platform]) {
    window.open(shareUrls[platform], "_blank", "width=600,height=500");
  }
  // Track share
  if (editId) {
    apiFetch(API_BASE + "/articles/" + editId + "/increment_share/", { method: "POST" })
      .then(response => { if (!response.ok) return; const a = articles.find(x => String(x.id) === String(editId)); if (a) a.shares_count = (a.shares_count||0)+1; }).catch(() => {});
  }
  showToast("Partagé sur " + platform, "success");
}
function copyShareLink() {
  const input = document.getElementById("shareLink");
  input.select();
  navigator.clipboard.writeText(input.value).then(() => showToast("Lien copié !", "success")).catch(() => showToast("Erreur", "error"));
}

