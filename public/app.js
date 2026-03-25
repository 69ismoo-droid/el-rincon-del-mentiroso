function $(id) {
  return document.getElementById(id);
}

const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/login.html";
} else {
  init();
}

async function api(path, options = {}) {
  const res = await fetch(path, options);
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = data && data.error ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
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
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

async function init() {
  const alertEl = $("alert");
  const postAlertEl = $("postAlert");
  const newsListEl = $("newsList");
  const forumAlertEl = $("forumAlert");
  const threadListEl = $("threadList");
  const threadDetailEl = $("threadDetail");
  const replyListEl = $("replyList");
  const userBoxEl = $("userBox");
  const logoutBtn = $("logoutBtn");
  const tabNewsBtn = $("tabNews");
  const tabForumBtn = $("tabForum");
  const newsSectionEl = $("newsSection");
  const forumSectionEl = $("forumSection");
  const newsCreateCardEl = $("newsCreateCard");
  const forumCreateCardEl = $("forumCreateCard");
  const termsOverlayEl = $("termsOverlay");
  const acceptTermsCheckboxEl = $("acceptTerms");
  const acceptTermsBtnEl = $("acceptTermsBtn");

  const threadAuthorEl = $("threadAuthor");
  const threadDateEl = $("threadDate");
  const threadTitleEl = $("threadTitle");
  const threadBodyViewEl = $("threadBodyView");

  let activeThreadId = null;
  let currentUserId = null;

  async function ensureTermsAccepted() {
    const alreadyAccepted = localStorage.getItem("acceptedTerms") === "true";
    if (alreadyAccepted) return;

    if (!termsOverlayEl || !acceptTermsCheckboxEl || !acceptTermsBtnEl) {
      // Si por algún motivo falta el modal, no bloqueamos la app.
      return;
    }

    termsOverlayEl.style.display = "flex";

    function syncButton() {
      const ok = !!acceptTermsCheckboxEl.checked;
      acceptTermsBtnEl.disabled = !ok;
    }

    acceptTermsCheckboxEl.addEventListener("change", syncButton);
    syncButton();

    await new Promise((resolve) => {
      acceptTermsBtnEl.addEventListener("click", () => {
        localStorage.setItem("acceptedTerms", "true");
        termsOverlayEl.style.display = "none";
        resolve();
      });
    });
  }

  function setAlert(el, msg, kind) {
    if (!el) return;
    el.style.display = "block";
    el.classList.remove("ok", "err");
    el.classList.add(kind === "ok" ? "ok" : "err");
    el.textContent = msg;
  }

  function clearAlert(el) {
    if (!el) return;
    el.style.display = "none";
    el.textContent = "";
  }

  // Verify token and show current user
  try {
    const me = await api("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    currentUserId = me.user.id;
    userBoxEl.textContent = `Hola, ${me.user.displayName}`;
    logoutBtn.style.display = "inline-block";
  } catch (err) {
    localStorage.removeItem("token");
    window.location.href = "/login.html";
    return;
  }

  // Bloquea la app hasta que acepte términos
  await ensureTermsAccepted();

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("token");
    // Si quieres volver a pedir términos al reiniciar sesión, descomenta:
    // localStorage.removeItem("acceptedTerms");
    window.location.href = "/login.html";
  });

  function activateTab(tab) {
    const isNews = tab === "news";
    if (tabNewsBtn) tabNewsBtn.classList.toggle("active", isNews);
    if (tabForumBtn) tabForumBtn.classList.toggle("active", !isNews);

    if (newsSectionEl) newsSectionEl.style.display = isNews ? "block" : "none";
    if (forumSectionEl) forumSectionEl.style.display = isNews ? "none" : "block";

    if (newsCreateCardEl) newsCreateCardEl.style.display = isNews ? "block" : "none";
    if (forumCreateCardEl) forumCreateCardEl.style.display = isNews ? "none" : "block";
  }

  if (tabNewsBtn) tabNewsBtn.addEventListener("click", () => activateTab("news"));
  if (tabForumBtn) tabForumBtn.addEventListener("click", () => activateTab("forum"));

  activateTab("news");

  // Load feed
  async function loadNews() {
    clearAlert(alertEl);
    newsListEl.innerHTML = "";
    try {
      const data = await api("/api/news");
      if (!data.news || data.news.length === 0) {
        newsListEl.innerHTML = `<div class="muted">Aún no hay noticias publicadas.</div>`;
        return;
      }

      for (const n of data.news) {
        const canDelete = currentUserId && n.authorId && String(n.authorId) === String(currentUserId);
        const atts = Array.isArray(n.attachments) ? n.attachments : [];
        const attachmentsHtml = atts.length
          ? `<div class="attachmentList">
              ${atts
                .map(
                  (a) =>
                    `<a class="attachment" href="/uploads/${encodeURIComponent(
                      a.storedName
                    )}" target="_blank" rel="noopener">${escapeHtml(a.originalName)}</a>`
                )
                .join("")}
            </div>`
          : "";

        const actionsHtml = canDelete
          ? `<div class="row" style="margin-top:10px;justify-content:flex-end">
               <button class="btn danger" type="button" data-news-delete="${escapeHtml(n.id)}">Borrar</button>
             </div>`
          : "";

        const item = document.createElement("div");
        item.className = "newsItem";
        item.innerHTML = `
          <div class="newsMeta">
            <div class="author">Por ${escapeHtml(n.authorName || "Desconocido")}</div>
            <div class="muted" style="font-size:12px">${escapeHtml(formatDate(n.createdAt))}</div>
          </div>
          <h3 class="title" style="margin-top:0">${escapeHtml(n.title)}</h3>
          <div class="muted" style="white-space:pre-wrap; font-size:14px; line-height:1.4">${escapeHtml(
            n.content
          )}</div>
          ${attachmentsHtml}
          <div class="muted" style="margin-top:8px;font-size:12px">
            Nota: los archivos adjuntos se eliminan automáticamente después de 3 días.
          </div>
          ${actionsHtml}
        `;
        const delBtn = item.querySelector("button[data-news-delete]");
        if (delBtn) {
          delBtn.addEventListener("click", async (e) => {
            const id = e.currentTarget.getAttribute("data-news-delete");
            if (!id) return;
            if (!confirm("¿Borrar esta noticia? Esta acción no se puede deshacer.")) return;
            try {
              await api(`/api/news/${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              await loadNews();
            } catch (err) {
              setAlert(alertEl, err.message || "No se pudo borrar", "err");
            }
          });
        }
        newsListEl.appendChild(item);
      }
    } catch (err) {
      setAlert(alertEl, `No se pudo cargar: ${err.message}`, "err");
    }
  }

  await loadNews();

  // Forum: list threads and show details
  async function loadThreads() {
    clearAlert(forumAlertEl);
    if (threadListEl) threadListEl.innerHTML = "";
    activeThreadId = null;
    if (threadDetailEl) threadDetailEl.style.display = "none";

    try {
      const data = await api("/api/forum/threads", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const threads = Array.isArray(data.threads) ? data.threads : [];
      if (!threadListEl) return;

      if (threads.length === 0) {
        threadListEl.innerHTML = `<div class="muted">Aún no hay hilos en el foro.</div>`;
        return;
      }

      for (const t of threads) {
        const canDeleteThread = currentUserId && t.authorId && String(t.authorId) === String(currentUserId);
        const item = document.createElement("div");
        item.className = "threadItem";
        item.innerHTML = `
          <div class="newsMeta" style="margin-bottom:6px">
            <div class="author">Por ${escapeHtml(t.authorName || "Desconocido")}</div>
            <div class="muted" style="font-size:12px">${escapeHtml(formatDate(t.createdAt))}</div>
          </div>
          <h3>${escapeHtml(t.title)}</h3>
          <div class="muted" style="white-space:pre-wrap; font-size:14px; line-height:1.4">${escapeHtml(
            t.body
          )}</div>
          <div class="row" style="margin-top:10px; justify-content:flex-start">
            <button class="btn" type="button" data-thread-id="${t.id}">
              Ver hilo (${t.replyCount || 0})
            </button>
            ${
              canDeleteThread
                ? `<button class="btn danger" type="button" data-thread-delete="${escapeHtml(t.id)}">Borrar</button>`
                : ""
            }
          </div>
        `;

        const btn = item.querySelector("button[data-thread-id]");
        if (btn) {
          btn.addEventListener("click", async (e) => {
            const id = e.currentTarget.getAttribute("data-thread-id");
            if (!id) return;
            await loadThreadDetail(id);
            activateTab("forum");
            if (threadDetailEl) threadDetailEl.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        }

        const delThreadBtn = item.querySelector("button[data-thread-delete]");
        if (delThreadBtn) {
          delThreadBtn.addEventListener("click", async (e) => {
            const id = e.currentTarget.getAttribute("data-thread-delete");
            if (!id) return;
            if (!confirm("¿Borrar este hilo y todas sus respuestas?")) return;
            try {
              await api(`/api/forum/threads/${encodeURIComponent(id)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              await loadThreads();
            } catch (err) {
              setAlert(forumAlertEl, err.message || "No se pudo borrar", "err");
            }
          });
        }

        threadListEl.appendChild(item);
      }
    } catch (err) {
      setAlert(forumAlertEl, `No se pudo cargar el foro: ${err.message}`, "err");
    }
  }

  async function loadThreadDetail(threadId) {
    activeThreadId = threadId;
    clearAlert(forumAlertEl);

    const data = await api(`/api/forum/threads/${encodeURIComponent(threadId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const t = data.thread || {};
    const replies = Array.isArray(data.replies) ? data.replies : [];

    if (threadAuthorEl) threadAuthorEl.textContent = `Por ${t.authorName || "Desconocido"}`;
    if (threadDateEl) threadDateEl.textContent = formatDate(t.createdAt);
    if (threadTitleEl) threadTitleEl.textContent = t.title || "";
    if (threadBodyViewEl) threadBodyViewEl.textContent = t.body || "";

    if (replyListEl) replyListEl.innerHTML = "";

    if (!replyListEl) return;
    if (replies.length === 0) {
      replyListEl.innerHTML = `<div class="muted">Aún no hay respuestas.</div>`;
    } else {
      for (const r of replies) {
        const canDeleteReply = currentUserId && r.authorId && String(r.authorId) === String(currentUserId);
        const el = document.createElement("div");
        el.className = "replyItem";
        el.innerHTML = `
          <div class="newsMeta" style="margin-bottom:6px">
            <div class="author">Por ${escapeHtml(r.authorName || "Desconocido")}</div>
            <div class="muted" style="font-size:12px">${escapeHtml(formatDate(r.createdAt))}</div>
          </div>
          <div class="muted" style="white-space:pre-wrap; font-size:14px; line-height:1.4">${escapeHtml(
            r.body
          )}</div>
          ${
            canDeleteReply
              ? `<div class="row" style="margin-top:8px;justify-content:flex-end">
                   <button class="btn danger" type="button" data-reply-delete="${escapeHtml(r.id)}">Borrar</button>
                 </div>`
              : ""
          }
        `;
        const delReplyBtn = el.querySelector("button[data-reply-delete]");
        if (delReplyBtn) {
          delReplyBtn.addEventListener("click", async (e) => {
            const rid = e.currentTarget.getAttribute("data-reply-delete");
            if (!rid) return;
            if (!confirm("¿Borrar esta respuesta?")) return;
            try {
              await api(`/api/forum/replies/${encodeURIComponent(rid)}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              await loadThreadDetail(activeThreadId);
            } catch (err) {
              setAlert(forumAlertEl, err.message || "No se pudo borrar", "err");
            }
          });
        }
        replyListEl.appendChild(el);
      }
    }

    if (threadDetailEl) threadDetailEl.style.display = "block";
  }

  const threadForm = $("threadForm");
  const threadSubmitBtn = $("threadSubmitBtn");
  const threadPostAlertEl = $("threadPostAlert");

  if (threadForm) {
    threadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAlert(threadPostAlertEl);

      const title = $("threadTitleInput").value.trim();
      const body = $("threadBodyInput").value.trim();
      if (!title || !body) return;

      threadSubmitBtn.disabled = true;
      threadSubmitBtn.textContent = "Publicando...";

      try {
        await api("/api/forum/threads", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, body }),
        });

        threadForm.reset();
        await loadThreads();
        setAlert(threadPostAlertEl, "Hilo publicado correctamente.", "ok");
        activateTab("forum");
      } catch (err) {
        setAlert(threadPostAlertEl, err.message || "Error al publicar hilo", "err");
      } finally {
        threadSubmitBtn.disabled = false;
        threadSubmitBtn.textContent = "Publicar hilo";
      }
    });
  }

  const replyForm = $("replyForm");
  const replySubmitBtn = $("replySubmitBtn");

  if (replyForm) {
    replyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!activeThreadId) return;

      replySubmitBtn.disabled = true;
      replySubmitBtn.textContent = "Enviando...";

      try {
        const body = $("replyBody").value.trim();
        if (!body) return;

        await api(`/api/forum/threads/${encodeURIComponent(activeThreadId)}/replies`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ body }),
        });

        $("replyBody").value = "";
        await loadThreadDetail(activeThreadId);
      } catch (err) {
        setAlert(forumAlertEl, err.message || "Error al responder", "err");
      } finally {
        replySubmitBtn.disabled = false;
        replySubmitBtn.textContent = "Responder";
      }
    });
  }

  await loadThreads();

  // Post form
  const form = $("postForm");
  const submitBtn = $("submitBtn");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearAlert(postAlertEl);

    const title = $("title").value.trim();
    const content = $("content").value.trim();
    const filesInput = $("files");

    if (!title || !content) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Publicando...";

    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("content", content);
      const files = filesInput.files ? Array.from(filesInput.files) : [];
      for (const f of files) fd.append("files", f);

      await api("/api/news", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      form.reset();
      await loadNews();
      setAlert(postAlertEl, "Noticia publicada correctamente.", "ok");
    } catch (err) {
      setAlert(postAlertEl, err.message || "Error al publicar", "err");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Publicar";
    }
  });
}

