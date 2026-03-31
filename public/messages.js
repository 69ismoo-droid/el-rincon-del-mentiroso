/**
 * FORO SIMPLE - El Rincón del Mentiroso
 * Versión simplificada: Sin encriptación, datos en texto plano
 */

console.log("📥 Iniciando foro...");

class ForumManager {
  constructor() {
    this.posts = [];
    this.apiUrl = 'https://el-rincon-del-mentiroso.onrender.com';
    this.elements = {};
    
    this.initElements();
    this.loadPosts();
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

  async loadPosts() {
    try {
      this.updateStatus('🔄 Cargando...', 'loading');
      
      const token = localStorage.getItem('token');
      console.log("📥 Token:", token ? "Presente" : "Ausente");
      
      const response = await fetch(`${this.apiUrl}/api/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("📥 Respuesta status:", response.status);
      
      const data = await response.json();
      console.log("📥 Datos brutos recibidos:", data);

      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }

      this.posts = data.posts || [];
      console.log("📥 Posts cargados:", this.posts.length);
      
      this.renderPosts();
      this.updateStatus('✅ Listo', 'ready');
      
    } catch (error) {
      console.error('❌ Error cargando posts:', error);
      this.updateStatus('❌ Error', 'error');
      if (this.elements.postsContainer) {
        this.elements.postsContainer.innerHTML = `<p>Error al cargar: ${error.message}</p>`;
      }
    }
  }

  async createPost() {
    try {
      const titulo = this.elements.postTitle?.value?.trim();
      const mensaje = this.elements.postContent?.value?.trim();
      
      if (!titulo || !mensaje) {
        alert('Escribe título y mensaje');
        return;
      }

      this.updateStatus('🔄 Publicando...', 'loading');
      
      const token = localStorage.getItem('token');
      
      // Datos simples en texto plano
      const datos = {
        titulo: titulo,
        mensaje: mensaje
      };
      
      console.log("📥 Enviando datos:", datos);

      const response = await fetch(`${this.apiUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      const resultado = await response.json();
      console.log("📥 Respuesta del servidor:", resultado);

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
      console.log("📥 Renderizando post:", post);
      
      // Usar propiedades reales del post
      const titulo = post.titulo || post.title || 'Sin título';
      const mensaje = post.mensaje || post.content || 'Sin contenido';
      const autor = post.usuario || post.authorName || 'Anónimo';
      const fecha = post.fecha || post.createdAt || new Date().toISOString();
      
      return `
        <article class="post">
          <h3>${this.escapeHtml(titulo)}</h3>
          <p class="meta">👤 ${this.escapeHtml(autor)} - 📅 ${new Date(fecha).toLocaleString()}</p>
          <div class="content">${this.escapeHtml(mensaje)}</div>
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

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html';
    return;
  }
  
  window.forumManager = new ForumManager();
  console.log("📥 Foro inicializado");
});
