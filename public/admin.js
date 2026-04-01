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
    if (!iso) return "Fecha no disponible";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Fecha no disponible";
    return d.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "Fecha no disponible";
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

// --- APLICACIÓN ADMINISTRATIVA ---
class AdminApp {
  constructor() {
    this.token = localStorage.getItem("token");
    this.currentUser = null;
    this.init();
  }

  async init() {
    this.elements = {
      userBox: $("userBox"),
      logoutBtn: $("logoutBtn"),
      tabUsers: $("tabUsers"),
      tabNews: $("tabNews"),
      tabThreads: $("tabThreads"),
      tabMessages: $("tabMessages"),
      usersSection: $("usersSection"),
      newsSection: $("newsSection"),
      threadsSection: $("threadsSection"),
      messagesSection: $("messagesSection"),
      usersAlert: $("usersAlert"),
      newsAlert: $("newsAlert"),
      threadsAlert: $("threadsAlert"),
      messagesAlert: $("messagesAlert"),
      usersList: $("usersList"),
      newsList: $("newsList"),
      threadsList: $("threadsList"),
      statsContainer: $("statsContainer"),
      passwordModal: $("passwordModal"),
      passwordForm: $("passwordForm"),
      passwordUserId: $("passwordUserId"),
      newPassword: $("newPassword"),
      confirmPassword: $("confirmPassword")
    };

    await this.loadUser();
    this.setupEventListeners();
    this.activateTab("users");
    await this.loadStats();
    await this.loadUsers();
  }

  async loadUser() {
    try {
      const me = await api("/api/auth/me");
      this.currentUser = me.user;
      
      // Verificar si es el administrador autorizado
      if (me.user.email !== "cruel@admin") {
        alert("Acceso denegado. Solo el administrador autorizado puede acceder a este panel.");
        window.location.href = "/";
        return;
      }
      
      this.elements.userBox.textContent = `👑 ${me.user.displayName} (Admin)`;
      this.elements.logoutBtn.style.display = "inline-block";
      this.isAdmin = true;
    } catch (err) {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    }
  }

  setupEventListeners() {
    const { logoutBtn, tabUsers, tabNews, tabThreads, tabMessages, passwordForm } = this.elements;

    logoutBtn?.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    });

    tabUsers?.addEventListener("click", () => this.activateTab("users"));
    tabNews?.addEventListener("click", () => this.activateTab("news"));
    tabThreads?.addEventListener("click", () => this.activateTab("threads"));
    tabMessages?.addEventListener("click", () => this.activateTab("messages"));

    passwordForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handlePasswordReset();
    });
  }

  activateTab(tab) {
    const { tabUsers, tabNews, tabThreads, tabMessages, usersSection, newsSection, threadsSection, messagesSection } = this.elements;

    tabUsers?.classList.toggle("active", tab === "users");
    tabNews?.classList.toggle("active", tab === "news");
    tabThreads?.classList.toggle("active", tab === "threads");
    tabMessages?.classList.toggle("active", tab === "messages");

    if (usersSection) usersSection.style.display = tab === "users" ? "block" : "none";
    if (newsSection) newsSection.style.display = tab === "news" ? "block" : "none";
    if (threadsSection) threadsSection.style.display = tab === "threads" ? "block" : "none";
    if (messagesSection) messagesSection.style.display = tab === "messages" ? "block" : "none";

    if (tab === "users") this.loadUsers();
    if (tab === "news") this.loadNews();
    if (tab === "threads") this.loadThreads();
    if (tab === "messages" && window.messagesAdmin) {
      window.messagesAdmin.loadMessagesStats();
    }
  }

  setAlert(el, msg, kind) {
    if (!el) return;
    el.style.display = "block";
    el.classList.remove("ok", "err", "info");
    el.classList.add(kind);
    el.textContent = msg;
    
    setTimeout(() => this.clearAlert(el), 5000);
  }

  clearAlert(el) {
    if (!el) return;
    el.style.display = "none";
    el.textContent = "";
  }

  async loadStats() {
    try {
      const data = await api("/api/admin/stats");
      const { stats } = data;
      
      this.elements.statsContainer.innerHTML = `
        <div class="statCard">
          <h3>👥 Usuarios</h3>
          <div class="statNumber">${stats.totalUsers || 0}</div>
        </div>
        <div class="statCard">
          <h3>📰 Noticias</h3>
          <div class="statNumber">${stats.totalNews || 0}</div>
        </div>
        <div class="statCard">
          <h3>💬 Hilos</h3>
          <div class="statNumber">${stats.totalThreads || 0}</div>
        </div>
        <div class="statCard">
          <h3>💬 Respuestas</h3>
          <div class="statNumber">${stats.totalReplies || 0}</div>
        </div>
        <div class="statCard">
          <h3>📎 Adjuntos</h3>
          <div class="statNumber">${stats.totalAttachments || 0}</div>
        </div>
      `;
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      this.elements.statsContainer.innerHTML = '<div class="alert err">Error cargando estadísticas: ' + err.message + '</div>';
    }
  }

  async loadUsers() {
    this.clearAlert(this.elements.usersAlert);
    this.elements.usersList.innerHTML = '<div class="loading">Cargando usuarios...</div>';

    try {
      const data = await api("/api/admin/users");
      const { users } = data;

      if (users.length === 0) {
        this.elements.usersList.innerHTML = '<div class="emptyState"><h3>📭 No hay usuarios</h3></div>';
        return;
      }

      this.elements.usersList.innerHTML = "";
      users.forEach(user => {
        const item = document.createElement("div");
        item.className = "adminItem";
        const stats = user.stats || {};
        
        const isAdminBadge = user.email === "cruel@admin" ? '<span class="badge danger">👑 ADMIN</span>' : '';
        const canDelete = user.email !== "cruel@admin" && user.id !== this.currentUser.id;
        
        item.innerHTML = `
          <div class="adminItemHeader">
            <div class="adminItemInfo">
              <h3>${escapeHtml(user.displayName || 'Sin nombre')} ${isAdminBadge}</h3>
              <div class="adminItemDetails">
                <div>📧 ${escapeHtml(user.email)}</div>
                <div>🔖 Código: ${escapeHtml(user.censoredInviteCode || user.inviteCode)}</div>
                <div>📅 ${formatDate(user.createdAt)}</div>
              </div>
            </div>
            <div class="adminItemStats">
              <div class="statMini">
                <span class="statMiniNumber">${stats.newsCount ?? 0}</span>
                <span class="statMiniLabel">Noticias</span>
              </div>
              <div class="statMini">
                <span class="statMiniNumber">${stats.threadsCount ?? 0}</span>
                <span class="statMiniLabel">Hilos</span>
              </div>
              <div class="statMini">
                <span class="statMiniNumber">${stats.repliesCount ?? 0}</span>
                <span class="statMiniLabel">Respuestas</span>
              </div>
            </div>
          </div>
          <div class="adminItemActions">
            ${canDelete ? `
              <button class="btn danger" onclick="adminApp.deleteUser('${user.id}', '${escapeHtml(user.displayName)}')">
                🗑️ Eliminar Usuario
              </button>
            ` : ''}
            <button class="btn secondary" onclick="adminApp.showPasswordModal('${user.id}', '${escapeHtml(user.displayName)}')">
              🔐 Cambiar Contraseña
            </button>
          </div>
        `;

        this.elements.usersList.appendChild(item);
      });
    } catch (err) {
      this.setAlert(this.elements.usersAlert, `❌ Error: ${err.message}`, "err");
    }
  }

  async loadNews() {
    this.clearAlert(this.elements.newsAlert);
    this.elements.newsList.innerHTML = '<div class="loading">Cargando noticias...</div>';

    try {
      const data = await api("/api/admin/news");
      const { news } = data;

      if (news.length === 0) {
        this.elements.newsList.innerHTML = '<div class="emptyState"><h3>📭 No hay noticias</h3></div>';
        return;
      }

      this.elements.newsList.innerHTML = "";
      news.forEach(n => {
        const item = document.createElement("div");
        item.className = "adminItem";
        
        const attachmentsHtml = n.attachments.length > 0 
          ? `<div class="attachmentList">${n.attachments.map(a => `
              <a class="attachment" href="/uploads/${encodeURIComponent(a.storedName)}" target="_blank">
                📎 ${escapeHtml(a.originalName)} (${this.formatFileSize(a.size)})
              </a>
            `).join('')}</div>`
          : '';

        item.innerHTML = `
          <div class="adminItemHeader">
            <div class="adminItemInfo">
              <h3>${escapeHtml(n.title)}</h3>
              <div class="adminItemDetails">
                <div>👤 ${escapeHtml(n.authorName)} (${escapeHtml(n.authorEmail)})</div>
                <div>🔖 ${escapeHtml(n.authorCode)}</div>
                <div>📅 ${formatDate(n.createdAt)}</div>
              </div>
            </div>
          </div>
          <div class="adminItemContent">
            <p>${escapeHtml(n.content)}</p>
            ${attachmentsHtml}
          </div>
          <div class="adminItemActions">
            <button class="btn danger" onclick="adminApp.deleteNews('${n.id}', '${escapeHtml(n.title)}')">
              🗑️ Eliminar Noticia
            </button>
          </div>
        `;

        this.elements.newsList.appendChild(item);
      });
    } catch (err) {
      this.setAlert(this.elements.newsAlert, `❌ Error: ${err.message}`, "err");
    }
  }

  async loadThreads() {
    this.clearAlert(this.elements.threadsAlert);
    this.elements.threadsList.innerHTML = '<div class="loading">Cargando hilos...</div>';

    try {
      const data = await api("/api/admin/threads");
      const { threads } = data;

      if (threads.length === 0) {
        this.elements.threadsList.innerHTML = '<div class="emptyState"><h3>📭 No hay hilos</h3></div>';
        return;
      }

      this.elements.threadsList.innerHTML = "";
      threads.forEach(thread => {
        const item = document.createElement("div");
        item.className = "adminItem";
        
        const repliesHtml = thread.replies.length > 0
          ? `<div class="repliesList">
              ${thread.replies.slice(0, 3).map(r => `
                <div class="replyMini">
                  <strong>${escapeHtml(r.authorId === thread.authorId ? thread.authorName : 'Otro usuario')}</strong>: 
                  ${escapeHtml(r.body.substring(0, 100))}${r.body.length > 100 ? '...' : ''}
                </div>
              `).join('')}
              ${thread.replies.length > 3 ? `<div class="muted">... y ${thread.replies.length - 3} respuestas más</div>` : ''}
            </div>`
          : '<div class="muted">Sin respuestas</div>';

        item.innerHTML = `
          <div class="adminItemHeader">
            <div class="adminItemInfo">
              <h3>${escapeHtml(thread.title)}</h3>
              <div class="adminItemDetails">
                <div>👤 ${escapeHtml(thread.authorName)} (${escapeHtml(thread.authorEmail)})</div>
                <div>🔖 ${escapeHtml(thread.authorCode)}</div>
                <div>📅 ${formatDate(thread.createdAt)}</div>
                <div>💬 ${thread.replyCount} respuestas</div>
              </div>
            </div>
          </div>
          <div class="adminItemContent">
            <p>${escapeHtml(thread.body)}</p>
            ${repliesHtml}
          </div>
          <div class="adminItemActions">
            <button class="btn danger" onclick="adminApp.deleteThread('${thread.id}', '${escapeHtml(thread.title)}')">
              🗑️ Eliminar Hilo
            </button>
          </div>
        `;

        this.elements.threadsList.appendChild(item);
      });
    } catch (err) {
      this.setAlert(this.elements.threadsAlert, `❌ Error: ${err.message}`, "err");
    }
  }

  async deleteUser(userId, displayName) {
    if (!confirm(`⚠️ ¿Estás seguro de eliminar al usuario "${displayName}"?\n\nEsto eliminará:\n• Todas sus noticias\n• Todos sus hilos y respuestas\n• Todos sus archivos adjuntos\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api(`/api/admin/users/${userId}`, { method: "DELETE" });
      this.setAlert(this.elements.usersAlert, "✅ Usuario eliminado correctamente", "ok");
      await this.loadUsers();
      await this.loadStats();
    } catch (err) {
      this.setAlert(this.elements.usersAlert, `❌ Error: ${err.message}`, "err");
    }
  }

  async deleteNews(newsId, title) {
    if (!confirm(`⚠️ ¿Estás seguro de eliminar la noticia "${title}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api(`/api/admin/news/${newsId}`, { method: "DELETE" });
      this.setAlert(this.elements.newsAlert, "✅ Noticia eliminada correctamente", "ok");
      await this.loadNews();
      await this.loadStats();
    } catch (err) {
      this.setAlert(this.elements.newsAlert, `❌ Error: ${err.message}`, "err");
    }
  }

  async deleteThread(threadId, title) {
    if (!confirm(`⚠️ ¿Estás seguro de eliminar el hilo "${title}" y todas sus respuestas?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await api(`/api/admin/threads/${threadId}`, { method: "DELETE" });
      this.setAlert(this.elements.threadsAlert, "✅ Hilo eliminado correctamente", "ok");
      await this.loadThreads();
      await this.loadStats();
    } catch (err) {
      this.setAlert(this.elements.threadsAlert, `❌ Error: ${err.message}`, "err");
    }
  }

  showPasswordModal(userId, displayName) {
    this.elements.passwordUserId.value = userId;
    this.elements.passwordModal.style.display = "flex";
    this.elements.newPassword.value = "";
    this.elements.confirmPassword.value = "";
    this.elements.newPassword.focus();
  }

  async handlePasswordReset() {
    const userId = this.elements.passwordUserId.value;
    const newPassword = this.elements.newPassword.value;
    const confirmPassword = this.elements.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      await api(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword })
      });

      this.setAlert(this.elements.usersAlert, "✅ Contraseña actualizada correctamente", "ok");
      this.closePasswordModal();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  }

  closePasswordModal() {
    this.elements.passwordModal.style.display = "none";
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Funciones globales para onclick
let adminApp;
window.adminApp = null;

window.closePasswordModal = function() {
  if (adminApp) adminApp.closePasswordModal();
};

// Iniciar la aplicación
document.addEventListener('DOMContentLoaded', () => {
  adminApp = new AdminApp();
  window.adminApp = adminApp;
});
