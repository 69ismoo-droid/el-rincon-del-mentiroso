// --- ESCUDO DE SEGURIDAD ---
(function() {
  const token = localStorage.getItem('token');
  if (!token) {
      window.location.href = '/login.html'; 
  }
})();

// --- UTILIDADES ---
function $(id) {
  return document.getElementById(id);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(iso) {
  try {
    if (!iso) return '📅 Fecha no disponible';
    
    const d = new Date(iso);
    
    // Verificar si la fecha es válida
    if (isNaN(d.getTime())) {
      return '📅 Fecha inválida';
    }
    
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error en formatDate:', error);
    return '📅 Error en fecha';
  }
}

// --- API ---
async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  
  // Detectar si estamos en producción y construir URL completa
  let fullPath = path;
  if (window.location.hostname !== 'localhost' && !path.startsWith('http')) {
    fullPath = `${window.location.origin}${path}`;
  }
  
  const res = await fetch(fullPath, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

// --- APLICACIÓN PRINCIPAL ---
class App {
  constructor() {
    this.token = localStorage.getItem("token");
    this.currentUserId = null;
    this.activeThreadId = null;
    this.init();
  }

  async init() {
    // Elementos del DOM
    this.elements = {
      alert: $("alert"),
      postAlert: $("postAlert"),
      newsList: $("newsList"),
      forumAlert: $("forumAlert"),
      threadList: $("threadList"),
      threadListView: $("threadListView"),
      threadDetailView: $("threadDetailView"),
      replyList: $("replyList"),
      userBox: $("userBox"),
      logoutBtn: $("logoutBtn"),
      tabNews: $("tabNews"),
      tabForum: $("tabForum"),
      newsSection: $("newsSection"),
      forumSection: $("forumSection"),
      newsCreateCard: $("newsCreateCard"),
      forumCreateCard: $("forumCreateCard"),
      termsOverlay: $("termsOverlay"),
      acceptTerms: $("acceptTerms"),
      acceptTermsBtn: $("acceptTermsBtn"),
      backToThreads: $("backToThreads"),
      // Thread detail elements
      threadAuthor: $("threadAuthor"),
      threadDate: $("threadDate"),
      threadTitle: $("threadTitle"),
      threadBodyView: $("threadBodyView"),
    };

    await this.ensureTermsAccepted();
    await this.loadUser();
    this.setupEventListeners();
    this.activateTab("news");
    await this.loadNews();
    // NO cargar hilos automáticamente - solo cuando se haga clic en la pestaña
  }

  async ensureTermsAccepted() {
    const alreadyAccepted = localStorage.getItem("acceptedTerms") === "true";
    if (alreadyAccepted) return;

    const { termsOverlay, acceptTerms, acceptTermsBtn } = this.elements;
    if (!termsOverlay || !acceptTerms || !acceptTermsBtn) return;

    termsOverlay.style.display = "flex";

    const syncButton = () => {
      acceptTermsBtn.disabled = !acceptTerms.checked;
    };

    acceptTerms.addEventListener("change", syncButton);
    syncButton();

    await new Promise((resolve) => {
      acceptTermsBtn.addEventListener("click", () => {
        localStorage.setItem("acceptedTerms", "true");
        termsOverlay.style.display = "none";
        resolve();
      });
    });
  }

  async loadUser() {
    try {
      const me = await api("/api/auth/me");
      this.currentUserId = me.user.id;
      this.currentUser = me.user;
      this.elements.userBox.textContent = `👋 ${me.user.displayName || me.user.email || 'Usuario'}`;
      this.elements.logoutBtn.style.display = "inline-block";
      
      // Mostrar enlace de admin solo para cruel@admin
      if (me.user.email === "cruel@admin") {
        const adminLink = document.createElement("a");
        adminLink.href = "/admin.html";
        adminLink.className = "btn secondary";
        adminLink.style.textDecoration = "none";
        adminLink.style.marginLeft = "8px";
        adminLink.innerHTML = "⚙️ Admin";
        this.elements.logoutBtn.parentNode.insertBefore(adminLink, this.elements.logoutBtn);
      }
    } catch (err) {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    }
  }

  setupEventListeners() {
    const { logoutBtn, tabNews, tabForum, backToThreads } = this.elements;

    logoutBtn?.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    });

    tabNews?.addEventListener("click", () => this.activateTab("news"));
    tabForum?.addEventListener("click", () => this.activateTab("forum"));
    
    backToThreads?.addEventListener("click", () => {
      this.showThreadList();
    });

    // Formularios
    this.setupNewsForm();
    this.setupThreadForm();
    this.setupReplyForm();
  }

  setupNewsForm() {
    const form = $("postForm");
    if (!form) return;

    // Manejo de archivos
    const fileInput = $("files");
    const fileInputContainer = $("fileInputContainer");
    const fileInputText = $("fileInputText");
    const filePreview = $("filePreview");
    const titleInput = $("title");
    const contentInput = $("content");

    // Contadores de caracteres
    this.setupCharacterCounter(titleInput, 140, "titleCounter");
    this.setupCharacterCounter(contentInput, 2000, "contentCounter");

    // Manejo de archivos
    if (fileInput && fileInputContainer && fileInputText && filePreview) {
      let selectedFiles = [];

      fileInput.addEventListener("change", (e) => {
        this.handleFileSelection(e.target.files);
      });

      // Drag and drop
      const fileInputLabel = fileInputContainer.querySelector(".fileInputLabel");
      if (fileInputLabel) {
        fileInputLabel.addEventListener("dragover", (e) => {
          e.preventDefault();
          fileInputLabel.style.borderColor = "var(--primary)";
          fileInputLabel.style.background = "rgba(102, 126, 234, 0.2)";
        });

        fileInputLabel.addEventListener("dragleave", (e) => {
          e.preventDefault();
          fileInputLabel.style.borderColor = "";
          fileInputLabel.style.background = "";
        });

        fileInputLabel.addEventListener("drop", (e) => {
          e.preventDefault();
          fileInputLabel.style.borderColor = "";
          fileInputLabel.style.background = "";
          this.handleFileSelection(e.dataTransfer.files);
        });
      }
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      
      // Validar archivos antes de enviar
      const files = Array.from(fileInput.files || []);
      const maxSize = 20 * 1024 * 1024; // 20MB
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      for (const f of files) {
        if (f.size > maxSize) {
          this.setAlert(this.elements.postAlert, `❌ El archivo ${f.name} excede el tamaño máximo de 20MB.`, "err");
          return;
        }
        if (!allowedTypes.includes(f.type)) {
          this.setAlert(this.elements.postAlert, `❌ El archivo ${f.name} tiene un tipo no permitido.`, "err");
          return;
        }
      }
      
      const submitBtn = $("submitBtn");
      this.setButtonLoading(submitBtn, true);
      
      try {
        await api("/api/news", {
          method: "POST",
          body: formData,
        });
        
        form.reset();
        this.clearFilePreview();
        this.setAlert(this.elements.postAlert, "✅ Noticia publicada correctamente", "ok");
        await this.loadNews();
        
        setTimeout(() => this.clearAlert(this.elements.postAlert), 3000);
      } catch (err) {
        this.setAlert(this.elements.postAlert, `❌ Error: ${err.message}`, "err");
      } finally {
        this.setButtonLoading(submitBtn, false);
      }
    });
  }

  setupCharacterCounter(input, maxLength, counterId) {
    if (!input) return;
    
    // Crear contador si no existe
    let counter = $(counterId);
    if (!counter) {
      counter = document.createElement("div");
      counter.id = counterId;
      counter.className = "charCount";
      input.parentNode.appendChild(counter);
    }

    const updateCounter = () => {
      const length = input.value.length;
      const remaining = maxLength - length;
      
      counter.textContent = `${length}/${maxLength} caracteres`;
      
      counter.classList.remove("warning", "error");
      if (remaining <= 10) {
        counter.classList.add("error");
      } else if (remaining <= 50) {
        counter.classList.add("warning");
      }
    };

    input.addEventListener("input", updateCounter);
    updateCounter();
  }

  handleFileSelection(files) {
    const fileInputContainer = $("fileInputContainer");
    const fileInputText = $("fileInputText");
    const filePreview = $("filePreview");
    
    if (!fileInputContainer || !fileInputText || !filePreview) return;

    const fileArray = Array.from(files);
    const maxSize = 20 * 1024 * 1024; // 20MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    // Validar archivos
    for (const file of fileArray) {
      if (file.size > maxSize) {
        this.setAlert(this.elements.postAlert, `❌ El archivo ${file.name} excede el tamaño máximo de 20MB.`, "err");
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        this.setAlert(this.elements.postAlert, `❌ El archivo ${file.name} tiene un tipo no permitido.`, "err");
        return;
      }
    }

    // Actualizar UI
    if (fileArray.length > 0) {
      fileInputContainer.classList.add("hasFiles");
      fileInputText.textContent = `${fileArray.length} archivo(s) seleccionado(s)`;
      
      // Mostrar preview
      filePreview.innerHTML = "";
      fileArray.forEach((file, index) => {
        const fileItem = document.createElement("div");
        fileItem.className = "fileItem fadeIn";
        
        const fileInfo = document.createElement("div");
        fileInfo.className = "fileInfo";
        
        const icon = this.getFileIcon(file.type);
        const size = this.formatFileSize(file.size);
        
        fileInfo.innerHTML = `
          <span>${icon}</span>
          <span class="fileName">${file.name}</span>
          <span class="fileSize">${size}</span>
        `;
        
        const removeBtn = document.createElement("button");
        removeBtn.className = "removeFile";
        removeBtn.textContent = "✕";
        removeBtn.onclick = () => this.removeFile(index);
        
        fileItem.appendChild(fileInfo);
        fileItem.appendChild(removeBtn);
        filePreview.appendChild(fileItem);
      });
    } else {
      this.clearFilePreview();
    }
  }

  clearFilePreview() {
    const fileInputContainer = $("fileInputContainer");
    const fileInputText = $("fileInputText");
    const filePreview = $("filePreview");
    const fileInput = $("files");
    
    if (fileInputContainer) fileInputContainer.classList.remove("hasFiles");
    if (fileInputText) fileInputText.textContent = "Haz clic para seleccionar archivos o arrástralos aquí";
    if (filePreview) filePreview.innerHTML = "";
    if (fileInput) fileInput.value = "";
  }

  removeFile(index) {
    const fileInput = $("files");
    if (!fileInput) return;
    
    const dt = new DataTransfer();
    const files = Array.from(fileInput.files);
    
    files.forEach((file, i) => {
      if (i !== index) {
        dt.items.add(file);
      }
    });
    
    fileInput.files = dt.files;
    this.handleFileSelection(fileInput.files);
  }

  getFileIcon(mimeType) {
    const iconMap = {
      'image/jpeg': '🖼️',
      'image/png': '🖼️',
      'image/gif': '🖼️',
      'image/webp': '🖼️',
      'application/pdf': '📄',
      'text/plain': '📝',
      'application/msword': '📄',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📄',
      'application/vnd.ms-excel': '📊',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊'
    };
    
    return iconMap[mimeType] || '📎';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  setButtonLoading(button, loading) {
    if (!button) return;
    
    if (loading) {
      button.classList.add("loading");
      button.disabled = true;
      const originalText = button.textContent;
      button.setAttribute("data-original-text", originalText);
      button.innerHTML = `<span class="loadingSpinner"></span> Publicando...`;
    } else {
      button.classList.remove("loading");
      button.disabled = false;
      const originalText = button.getAttribute("data-original-text");
      if (originalText) {
        button.textContent = originalText;
        button.removeAttribute("data-original-text");
      }
    }
  }

  setupThreadForm() {
    const form = $("threadForm");
    if (!form) return;

    const threadTitleInput = $("threadTitleInput");
    const threadBodyInput = $("threadBodyInput");

    // Contadores de caracteres
    this.setupCharacterCounter(threadTitleInput, 140, "threadTitleCounter");
    this.setupCharacterCounter(threadBodyInput, 3000, "threadBodyCounter");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const threadTitleInput = $("threadTitleInput");
      const threadBodyInput = $("threadBodyInput");
      
      const submitBtn = $("threadSubmitBtn");
      this.setButtonLoading(submitBtn, true);
      
      try {
        await api("/api/forum/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: threadTitleInput.value,
            body: threadBodyInput.value,
          }),
        });
        
        form.reset();
        this.setAlert($("threadPostAlert"), "✅ Hilo creado correctamente", "ok");
        await this.loadThreads();
        
        setTimeout(() => this.clearAlert($("threadPostAlert")), 3000);
      } catch (err) {
        this.setAlert($("threadPostAlert"), `❌ Error: ${err.message}`, "err");
      } finally {
        this.setButtonLoading(submitBtn, false);
      }
    });
  }

  setupReplyForm() {
    const form = $("replyForm");
    if (!form) return;

    const replyBody = $("replyBody");
    
    // Contador de caracteres
    this.setupCharacterCounter(replyBody, 2000, "replyCounter");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const replyBody = $("replyBody");
      
      if (!this.activeThreadId) return;
      
      const submitBtn = $("replySubmitBtn");
      this.setButtonLoading(submitBtn, true);
      
      try {
        await api(`/api/forum/threads/${this.activeThreadId}/replies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: replyBody.value,
          }),
        });
        
        form.reset();
        await this.loadThreadDetail(this.activeThreadId);
      } catch (err) {
        this.setAlert(this.elements.forumAlert, `❌ Error: ${err.message}`, "err");
      } finally {
        this.setButtonLoading(submitBtn, false);
      }
    });
  }

  async activateTab(tab) {
    const isNews = tab === "news";
    const { tabNews, tabForum, newsSection, forumSection, newsCreateCard, forumCreateCard } = this.elements;

    // Verificar que los elementos existan antes de usarlos
    if (tabNews) tabNews.classList.toggle("active", isNews);
    if (tabForum) tabForum.classList.toggle("active", !isNews);

    if (newsSection) newsSection.style.display = isNews ? "block" : "none";
    if (forumSection) forumSection.style.display = isNews ? "none" : "block";

    if (newsCreateCard) newsCreateCard.style.display = isNews ? "block" : "none";
    if (forumCreateCard) forumCreateCard.style.display = isNews ? "none" : "block";

    if (isNews) {
      this.showThreadList();
    } else {
      // Cargar hilos solo cuando se activa la pestaña de foros
      await this.loadThreads();
    }
  }

  showThreadList() {
    const { threadListView, threadDetailView } = this.elements;
    if (threadListView) threadListView.style.display = "block";
    if (threadDetailView) threadDetailView.style.display = "none";
    this.activeThreadId = null;
  }

  showThreadDetail() {
    const { threadListView, threadDetailView } = this.elements;
    if (threadListView) threadListView.style.display = "none";
    if (threadDetailView) threadDetailView.style.display = "block";
  }

  setAlert(el, msg, kind) {
    if (!el) return;
    el.style.display = "block";
    el.classList.remove("ok", "err", "info");
    el.classList.add(kind);
    el.textContent = msg;
  }

  clearAlert(el) {
    if (!el) return;
    el.style.display = "none";
    el.textContent = "";
  }

  async loadNews() {
    const { newsList } = this.elements;
    this.clearAlert(this.elements.alert);
    newsList.innerHTML = "";

    try {
      const data = await api("/api/news");
      
      if (!data.news || data.news.length === 0) {
        newsList.innerHTML = `
          <div class="emptyState">
            <h3>📭 No hay publicaciones aún</h3>
            <p>Sé el primero en compartir algo con la comunidad.</p>
          </div>
        `;
        return;
      }

      for (const n of data.news) {
        const canDelete = this.currentUserId === n.authorId;
        const atts = Array.isArray(n.attachments) ? n.attachments : [];
        
        const attachmentsHtml = atts.length
          ? `<div class="attachmentList">
              ${atts.map(a => `
                <a class="attachment" href="/uploads/${encodeURIComponent(a.storedName)}" target="_blank" rel="noopener">
                  📎 ${escapeHtml(a.originalName)}
                </a>
              `).join("")}
            </div>`
          : "";

        const actionsHtml = canDelete
          ? `<div class="newsActions">
               <button class="btn danger" data-news-delete="${n.id}">🗑️ Eliminar</button>
             </div>`
          : "";

        const item = document.createElement("div");
        item.className = "newsItem";
        item.innerHTML = `
          <div class="newsMeta">
            <div class="author">👤 ${escapeHtml(n.authorName || "Desconocido")}</div>
            <div class="authorCode">🔖 ${escapeHtml(n.authorCode || "N/A")}</div>
            <div class="muted">📅 ${escapeHtml(formatDate(n.createdAt))}</div>
          </div>
          <h3>${escapeHtml(n.title)}</h3>
          <div class="newsContent">${escapeHtml(n.content)}</div>
          ${attachmentsHtml}
          ${actionsHtml}
        `;

        const delBtn = item.querySelector("button[data-news-delete]");
        if (delBtn) {
          delBtn.addEventListener("click", async (e) => {
            const id = e.currentTarget.getAttribute("data-news-delete");
            if (!confirm("¿Eliminar esta noticia? Esta acción no se puede deshacer.")) return;
            
            try {
              await api(`/api/news/${id}`, { method: "DELETE" });
              await this.loadNews();
            } catch (err) {
              this.setAlert(this.elements.alert, `❌ Error: ${err.message}`, "err");
            }
          });
        }

        newsList.appendChild(item);
      }
    } catch (err) {
      this.setAlert(this.elements.alert, `❌ Error cargando noticias: ${err.message}`, "err");
    }
  }

  async loadThreads() {
    const { threadList } = this.elements;
    this.clearAlert(this.elements.forumAlert);
    threadList.innerHTML = "";

    try {
      const data = await api("/api/forum/threads");
      const threads = Array.isArray(data.threads) ? data.threads : [];

      if (threads.length === 0) {
        threadList.innerHTML = `
          <div class="emptyState">
            <h3>🗣️ No hay hilos de discusión</h3>
            <p>Inicia una conversación interesante.</p>
          </div>
        `;
        return;
      }

      for (const t of threads) {
        const canDelete = this.currentUserId === t.authorId;
        const preview = t.body.length > 100 ? t.body.substring(0, 100) + "..." : t.body;
        
        const item = document.createElement("div");
        item.className = "threadItem";
        item.innerHTML = `
          <div class="threadMeta">
            <div class="author">👤 ${escapeHtml(t.authorName || "Desconocido")}</div>
            <div class="authorCode">🔖 ${escapeHtml(t.authorCode || "N/A")}</div>
            <div class="muted">📅 ${escapeHtml(formatDate(t.createdAt))}</div>
          </div>
          <h3>${escapeHtml(t.title)}</h3>
          <div class="threadPreview">${escapeHtml(preview)}</div>
          <div class="threadMeta">
            <span class="replyCount">💬 ${t.replyCount || 0} respuestas</span>
            <div class="row">
              <button class="btn" data-thread-id="${t.id}">📖 Ver hilo</button>
              ${canDelete ? `<button class="btn danger" data-thread-delete="${t.id}">🗑️ Eliminar</button>` : ""}
            </div>
          </div>
        `;

        const viewBtn = item.querySelector("button[data-thread-id]");
        if (viewBtn) {
          viewBtn.addEventListener("click", () => {
            this.loadThreadDetail(t.id);
          });
        }

        const delBtn = item.querySelector("button[data-thread-delete]");
        if (delBtn) {
          delBtn.addEventListener("click", async () => {
            if (!confirm("¿Eliminar este hilo y todas sus respuestas?")) return;
            
            try {
              await api(`/api/forum/threads/${t.id}`, { method: "DELETE" });
              await this.loadThreads();
            } catch (err) {
              this.setAlert(this.elements.forumAlert, `❌ Error: ${err.message}`, "err");
            }
          });
        }

        threadList.appendChild(item);
      }
    } catch (err) {
      this.setAlert(this.elements.forumAlert, `❌ Error cargando hilos: ${err.message}`, "err");
    }
  }

  async loadThreadDetail(threadId) {
    this.activeThreadId = threadId;
    this.showThreadDetail();
    
    const { threadAuthor, threadDate, threadTitle, threadBodyView, replyList } = this.elements;

    try {
      const data = await api(`/api/forum/threads/${threadId}`);
      const { thread, replies } = data;

      threadAuthor.textContent = `👤 ${thread.authorName}`;
      threadDate.textContent = `📅 ${formatDate(thread.createdAt)}`;
      threadTitle.textContent = thread.title;
      threadBodyView.textContent = thread.body;

      // Cargar respuestas
      const repliesArray = Array.isArray(replies) ? replies : [];
      
      if (repliesArray.length === 0) {
        replyList.innerHTML = `
          <div class="emptyState">
            <p>📭 No hay respuestas aún. ¡Sé el primero en responder!</p>
          </div>
        `;
      } else {
        replyList.innerHTML = "";
        
        for (const r of repliesArray) {
          const canDelete = this.currentUserId === r.authorId;
          
          const item = document.createElement("div");
          item.className = "replyItem";
          item.innerHTML = `
            <div class="replyMeta">
              <div class="author">👤 ${escapeHtml(r.authorName || "Desconocido")}</div>
              <div class="muted">📅 ${escapeHtml(formatDate(r.createdAt))}</div>
            </div>
            <div class="replyContent">${escapeHtml(r.body)}</div>
            ${canDelete ? '<button class="btn danger" data-reply-delete="' + r.id + '" style="margin-top:8px">🗑️ Eliminar</button>' : ''}
          `;

          const delBtn = item.querySelector("button[data-reply-delete]");
          if (delBtn) {
            delBtn.addEventListener("click", async () => {
              if (!confirm("¿Eliminar esta respuesta?")) return;
              
              try {
                await api(`/api/forum/replies/${r.id}`, { method: "DELETE" });
                await this.loadThreadDetail(threadId);
              } catch (err) {
                this.setAlert(this.elements.forumAlert, `❌ Error: ${err.message}`, "err");
              }
            });
          }

          replyList.appendChild(item);
        }
      }

    } catch (err) {
      this.setAlert(this.elements.forumAlert, `❌ Error cargando hilo: ${err.message}`, "err");
    }
  }
}

// Iniciar la aplicación
new App();
