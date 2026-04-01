class ForumManager {
  constructor() {
    this.posts = [];
    this.apiUrl = window.location.origin;
    this.elements = {};
    this.socket = null;
    
    this.initElements();
    this.loadPosts();
    this.initSocketSafe();
  }

  initElements() {
    this.elements.postsContainer = document.getElementById('postsContainer');
    this.elements.postForm = document.getElementById('postForm');
    this.elements.postTitle = document.getElementById('postTitle');
    this.elements.postContent = document.getElementById('postContent');
    this.elements.connectionStatus = document.getElementById('connectionStatus');
    
    if (this.elements.postForm) {
      this.elements.postForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.createPost();
      });
    }
  }

  initSocketSafe() {
    try {
      if (typeof io === 'undefined') {
        console.log('Modo Offline: Sockets no disponibles');
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) return;
      
      this.socket = io(this.apiUrl, {
        auth: { token },
        transports: ['websocket', 'polling']
      });
      
      this.socket.on('connect', () => {
        console.log('Socket conectado');
      });
      
      this.socket.on('new_post', (post) => {
        this.loadPosts();
      });
      
    } catch (err) {
      console.log('Modo Offline: Sockets no disponibles');
    }
  }

  async loadPosts() {
    try {
      this.updateStatus('🔄 Cargando...', 'loading');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.apiUrl}/api/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      this.posts = data.posts || [];
      this.renderPosts();
      this.updateStatus('✅ Listo', 'ready');
      
    } catch (error) {
      console.error('❌ Error cargando posts:', error);
      this.updateStatus('❌ Error', 'error');
    }
  }

  async createPost() {
    try {
      const titulo = this.elements.postTitle?.value?.trim();
      const contenido = this.elements.postContent?.value?.trim();
      
      if (!titulo || !contenido) {
        alert('Escribe título y contenido');
        return;
      }

      this.updateStatus('🔄 Publicando...', 'loading');
      
      const token = localStorage.getItem('token');
      
      const datos = {
        titulo: titulo,
        contenido: contenido
      };

      const response = await fetch(`${this.apiUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      const resultado = await response.json();

      if (!response.ok) {
        throw new Error(resultado.error || 'Error al publicar');
      }

      this.posts.unshift(resultado);
      this.renderPosts();
      this.elements.postForm.reset();
      this.updateStatus('✅ Publicado', 'success');
      
    } catch (error) {
      console.error('❌ Error:', error);
      this.updateStatus('❌ Error', 'error');
      alert('Error al publicar: ' + error.message);
    }
  }

  renderPosts() {
    if (!this.elements.postsContainer) return;

    if (this.posts.length === 0) {
      this.elements.postsContainer.innerHTML = '<p>No hay posts aún. ¡Sé el primero!</p>';
      return;
    }

    this.elements.postsContainer.innerHTML = this.posts.map(post => {
      const titulo = post.titulo || post.title || 'Sin título';
      const contenido = post.contenido || post.content || post.mensaje || 'Sin contenido';
      const autor = post.usuario || post.authorName || post.author || 'Anónimo';
      const fecha = post.fecha || post.createdAt || new Date().toISOString();
      
      return `
        <article class="post">
          <h3>${this.escapeHtml(titulo)}</h3>
          <p class="meta">👤 ${this.escapeHtml(autor)} - 📅 ${new Date(fecha).toLocaleString()}</p>
          <div class="content">${this.escapeHtml(contenido)}</div>
        </article>
      `;
    }).join('');
  }

  updateStatus(texto, estado) {
    if (this.elements.connectionStatus) {
      this.elements.connectionStatus.textContent = texto;
      this.elements.connectionStatus.className = `status ${estado}`;
    }
  }

  escapeHtml(texto) {
    if (!texto) return '';
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }

  const requiredIds = ['postsContainer', 'postForm', 'postTitle', 'postContent'];
  const hasForumUi = requiredIds.every((id) => document.getElementById(id));
  if (!hasForumUi) return;

  window.forumManager = new ForumManager();
});
