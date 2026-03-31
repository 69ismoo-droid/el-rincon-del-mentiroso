/**
 * FORO DE DISCUSIÓN - El Rincón del Mentiroso
 * 
 * Arquitectura: API REST primaria, Socket.io opcional (progressive enhancement)
 * Si Socket.io no carga, el foro sigue funcionando perfectamente vía HTTP
 */

// Clase para manejar el Foro de Discusión
class ForumManager {
  constructor() {
    this.posts = [];
    this.socket = null;
    this.socketAvailable = false;
    this.apiUrl = 'https://el-rincon-del-mentiroso.onrender.com';
    this.elements = {};
    
    this.initElements();
    this.loadPosts(); // Carga inicial vía API
    this.initSocketOptional(); // Socket.io opcional
  }

  initElements() {
    this.elements.postsContainer = document.getElementById('postsContainer');
    this.elements.postForm = document.getElementById('postForm');
    this.elements.postTitle = document.getElementById('postTitle');
    this.elements.postContent = document.getElementById('postContent');
    this.elements.connectionStatus = document.getElementById('connectionStatus');
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.elements.postForm) {
      this.elements.postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createPost();
      });
    }
  }

  // ============================================
  // API REST - MÉTODO PRINCIPAL (SIEMPRE DISPONIBLE)
  // ============================================

  async loadPosts() {
    try {
      this.updateStatus('🔄 Cargando posts...', 'loading');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiUrl}/api/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.posts = data.posts || [];
      this.renderPosts();
      this.updateStatus('✅ Foro cargado', 'ready');
      
      console.log(`📚 ${this.posts.length} posts cargados desde la base de datos`);
    } catch (error) {
      console.error('❌ Error cargando posts:', error);
      this.updateStatus('❌ Error cargando foro', 'error');
      this.renderError('No se pudieron cargar los posts. Intenta recargar la página.');
    }
  }

  async createPost() {
    try {
      const title = this.elements.postTitle?.value?.trim();
      const content = this.elements.postContent?.value?.trim();
      
      if (!title || !content) {
        alert('Debes escribir un título y contenido para tu mentira');
        return;
      }

      this.updateStatus('🔄 Publicando...', 'publishing');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const newPost = await response.json();
      
      // Agregar al array y renderizar
      this.posts.unshift(newPost);
      this.renderPosts();
      
      // Limpiar formulario
      this.elements.postForm.reset();
      this.updateStatus('✅ Mentira publicada', 'success');
      
      console.log('📝 Nueva mentira guardada en base de datos:', newPost.id);
      
      // Notificar vía socket si está disponible (opcional)
      if (this.socketAvailable && this.socket) {
        this.socket.emit('new_post', newPost);
      }
      
    } catch (error) {
      console.error('❌ Error creando post:', error);
      this.updateStatus('❌ Error al publicar', 'error');
      alert('Error al publicar. Intenta de nuevo.');
    }
  }

  async addComment(postId, content) {
    try {
      if (!content?.trim()) {
        alert('Escribe un comentario');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiUrl}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const newComment = await response.json();
      
      // Actualizar el post localmente
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        if (!post.comments) post.comments = [];
        post.comments.push(newComment);
        this.renderPosts();
      }
      
      console.log('💬 Comentario guardado:', newComment.id);
      
      // Notificar vía socket si está disponible (opcional)
      if (this.socketAvailable && this.socket) {
        this.socket.emit('new_comment', { postId, comment: newComment });
      }
      
    } catch (error) {
      console.error('❌ Error agregando comentario:', error);
      alert('Error al agregar comentario');
    }
  }

  // ============================================
  // SOCKET.IO - OPCIONAL (Progressive Enhancement)
  // ============================================

  initSocketOptional() {
    // Verificar si Socket.io está disponible
    if (typeof io === 'undefined') {
      console.log('ℹ️ Socket.io no disponible. El foro funcionará vía HTTP.');
      this.socketAvailable = false;
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('ℹ️ Sin token. Socket.io no se conectará.');
        return;
      }

      this.socket = io(this.apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 5000
      });

      this.setupSocketEvents();
      
    } catch (error) {
      console.warn('⚠️ Error inicializando Socket.io:', error);
      this.socketAvailable = false;
    }
  }

  setupSocketEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Socket.io conectado (modo opcional)');
      this.socketAvailable = true;
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket.io desconectado. Foro sigue funcionando vía HTTP.');
      this.socketAvailable = false;
    });

    // Notificación de nuevo post (solo actualiza si ya estábamos viendo el foro)
    this.socket.on('new_post', (post) => {
      console.log('🔔 Nuevo post detectado vía Socket.io');
      // Opcional: recargar posts para mostrar el nuevo
      this.loadPosts();
    });

    // Notificación de nuevo comentario
    this.socket.on('new_comment', ({ postId, comment }) => {
      console.log('🔔 Nuevo comentario detectado vía Socket.io');
      const post = this.posts.find(p => p.id === postId);
      if (post) {
        if (!post.comments) post.comments = [];
        // Verificar si ya existe para no duplicar
        if (!post.comments.find(c => c.id === comment.id)) {
          post.comments.push(comment);
          this.renderPosts();
        }
      }
    });

    this.socket.on('connect_error', (err) => {
      console.warn('⚠️ Error de conexión Socket.io:', err.message);
      this.socketAvailable = false;
    });
  }

  // ============================================
  // RENDERIZADO
  // ============================================

  renderPosts() {
    if (!this.elements.postsContainer) return;

    if (this.posts.length === 0) {
      this.elements.postsContainer.innerHTML = `
        <div class="empty-state">
          <h3>🤔 Aún no hay mentiras</h3>
          <p>Sé el primero en contar una mentira increíble...</p>
        </div>
      `;
      return;
    }

    this.elements.postsContainer.innerHTML = this.posts.map(post => this.renderPostHTML(post)).join('');
  }

  renderPostHTML(post) {
    const isAuthor = post.authorId === this.getCurrentUserId();
    const comments = post.comments || [];
    
    return `
      <article class="post-card" data-post-id="${post.id}">
        <header class="post-header">
          <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
          <div class="post-meta">
            <span class="post-author">👤 ${this.escapeHtml(post.authorName || 'Anónimo')}</span>
            <span class="post-date">📅 ${new Date(post.createdAt).toLocaleString()}</span>
            ${isAuthor ? '<span class="post-badge">✏️ Tu mentira</span>' : ''}
          </div>
        </header>
        
        <div class="post-content">
          ${this.escapeHtml(post.content)}
        </div>
        
        <div class="post-stats">
          <span>💬 ${comments.length} comentarios</span>
          <span>👁️ ${post.views || 0} vistas</span>
        </div>
        
        <div class="comments-section">
          <h4>Comentarios (${comments.length})</h4>
          <div class="comments-list">
            ${comments.map(comment => this.renderCommentHTML(comment)).join('')}
          </div>
          <form class="comment-form" onsubmit="return false;">
            <textarea 
              class="comment-input" 
              placeholder="Escribe tu comentario..."
              data-post-id="${post.id}"
            ></textarea>
            <button onclick="forumManager.submitComment('${post.id}')" class="btn-comment">
              Comentar
            </button>
          </form>
        </div>
      </article>
    `;
  }

  renderCommentHTML(comment) {
    return `
      <div class="comment" data-comment-id="${comment.id}">
        <div class="comment-header">
          <span class="comment-author">👤 ${this.escapeHtml(comment.authorName || 'Anónimo')}</span>
          <span class="comment-date">📅 ${new Date(comment.createdAt).toLocaleString()}</span>
        </div>
        <div class="comment-content">
          ${this.escapeHtml(comment.content)}
        </div>
      </div>
    `;
  }

  renderError(message) {
    if (this.elements.postsContainer) {
      this.elements.postsContainer.innerHTML = `
        <div class="error-state">
          <h3>😕 ${this.escapeHtml(message)}</h3>
          <button onclick="forumManager.loadPosts()" class="btn-retry">Reintentar</button>
        </div>
      `;
    }
  }

  // ============================================
  // UTILIDADES
  // ============================================

  submitComment(postId) {
    const textarea = document.querySelector(`textarea[data-post-id="${postId}"]`);
    const content = textarea?.value;
    if (content) {
      this.addComment(postId, content);
      textarea.value = '';
    }
  }

  getCurrentUserId() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub;
    } catch {
      return null;
    }
  }

  updateStatus(text, status) {
    if (this.elements.connectionStatus) {
      this.elements.connectionStatus.textContent = text;
      this.elements.connectionStatus.className = `status ${status}`;
    }
  }

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('📚 Inicializando Foro - El Rincón del Mentiroso...');
  
  // Verificar autenticación
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('🔒 Usuario no autenticado. Redirigiendo a login...');
    window.location.href = '/login.html';
    return;
  }

  // Inicializar el foro (funciona con o sin Socket.io)
  try {
    window.forumManager = new ForumManager();
    console.log('✅ Foro inicializado correctamente');
    console.log('ℹ️ Modo: API REST primaria, Socket.io opcional');
  } catch (error) {
    console.error('❌ Error inicializando foro:', error);
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px;">
        <h2>😕 Error al cargar el foro</h2>
        <p>${error.message}</p>
        <button onclick="location.reload()">Reintentar</button>
      </div>
    `;
  }
});
