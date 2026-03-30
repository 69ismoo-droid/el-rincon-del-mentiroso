// Administración de Mensajes - Panel de Admin
class MessagesAdmin {
  constructor() {
    this.elements = {
      messagesSection: document.getElementById('messagesSection'),
      messagesAlert: document.getElementById('messagesAlert'),
      totalMensajes: document.getElementById('totalMensajes'),
      mensajesHoy: document.getElementById('mensajesHoy'),
      refreshMessagesBtn: document.getElementById('refreshMessagesBtn'),
      deleteMessagesBtn: document.getElementById('deleteMessagesBtn'),
      confirmModal: document.getElementById('confirmModal'),
      confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
      cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
      logContent: document.getElementById('logContent'),
      tabMessages: document.getElementById('tabMessages')
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadMessagesStats();
    this.loadLog();
  }

  setupEventListeners() {
    const { refreshMessagesBtn, deleteMessagesBtn, confirmDeleteBtn, cancelDeleteBtn, tabMessages } = this.elements;

    // Tab de mensajes
    tabMessages?.addEventListener('click', () => {
      this.showMessagesSection();
      this.loadMessagesStats();
    });

    // Botón de actualizar estadísticas
    refreshMessagesBtn?.addEventListener('click', () => {
      this.loadMessagesStats();
      this.addLog('🔄 Estadísticas actualizadas');
    });

    // Botón de borrar mensajes
    deleteMessagesBtn?.addEventListener('click', () => {
      this.showConfirmModal();
    });

    // Botones del modal
    confirmDeleteBtn?.addEventListener('click', () => {
      this.deleteAllMessages();
    });

    cancelDeleteBtn?.addEventListener('click', () => {
      this.hideConfirmModal();
    });

    // Cerrar modal al hacer clic fuera
    this.elements.confirmModal?.addEventListener('click', (e) => {
      if (e.target === this.elements.confirmModal) {
        this.hideConfirmModal();
      }
    });
  }

  showMessagesSection() {
    // Ocultar otras secciones
    document.getElementById('usersSection').style.display = 'none';
    document.getElementById('newsSection').style.display = 'none';
    document.getElementById('threadsSection').style.display = 'none';
    
    // Mostrar sección de mensajes
    this.elements.messagesSection.style.display = 'block';
    
    // Actualizar tab activa
    document.querySelectorAll('.tabs .btn').forEach(btn => btn.classList.remove('active'));
    this.elements.tabMessages.classList.add('active');
  }

  async loadMessagesStats() {
    try {
      this.elements.totalMensajes.textContent = 'Cargando...';
      this.elements.mensajesHoy.textContent = 'Cargando...';

      const response = await fetch('/api/admin/mensajes/stats', {
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar estadísticas');
      }

      const stats = await response.json();
      
      // Actualizar números
      this.elements.totalMensajes.textContent = stats.totalMensajes.toLocaleString();
      this.elements.mensajesHoy.textContent = stats.mensajesHoy.toLocaleString();
      
      // Actualizar log
      this.addLog(`📊 Estadísticas cargadas: ${stats.totalMensajes} totales, ${stats.mensajesHoy} hoy`);
      
      // Mostrar top usuarios si hay
      if (stats.topUsuarios && stats.topUsuarios.length > 0) {
        this.addLog('👥 Top usuarios de mensajes:');
        stats.topUsuarios.forEach((user, index) => {
          this.addLog(`   ${index + 1}. Usuario ID: ${user._id} - ${user.count} mensajes`);
        });
      }

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      this.setAlert('Error al cargar estadísticas: ' + error.message, 'error');
      this.elements.totalMensajes.textContent = 'Error';
      this.elements.mensajesHoy.textContent = 'Error';
    }
  }

  async deleteAllMessages() {
    try {
      this.setAlert('Borrando todos los mensajes...', 'info');
      this.hideConfirmModal();

      const response = await fetch('/api/admin/mensajes', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        }
      });

      if (!response.ok) {
        throw new Error('Error al borrar mensajes');
      }

      const result = await response.json();
      
      // Actualizar estadísticas
      this.elements.totalMensajes.textContent = '0';
      this.elements.mensajesHoy.textContent = '0';
      
      // Mostrar confirmación
      this.setAlert(`✅ ${result.message}`, 'success');
      
      // Agregar al log
      this.addLog(`🗑️ ${result.deletedCount} mensajes eliminados por ${result.deletedBy}`);
      this.addLog(`📅 Fecha: ${new Date(result.timestamp).toLocaleString()}`);
      
      // Limpiar mensajes del frontend si está abierto
      if (window.messagesApp) {
        window.messagesApp.messages = [];
        window.messagesApp.renderMessages();
        window.messagesApp.updateMessageCount();
      }

    } catch (error) {
      console.error('Error borrando mensajes:', error);
      this.setAlert('Error al borrar mensajes: ' + error.message, 'error');
      this.addLog(`❌ Error al borrar mensajes: ${error.message}`);
    }
  }

  showConfirmModal() {
    this.elements.confirmModal.style.display = 'flex';
  }

  hideConfirmModal() {
    this.elements.confirmModal.style.display = 'none';
  }

  setAlert(message, type) {
    if (!this.elements.messagesAlert) return;
    
    this.elements.messagesAlert.style.display = 'block';
    this.elements.messagesAlert.className = 'alert ' + (type === 'success' ? 'ok' : 'err');
    this.elements.messagesAlert.textContent = message;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
      this.elements.messagesAlert.style.display = 'none';
    }, 5000);
  }

  addLog(message) {
    if (!this.elements.logContent) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.style.cssText = 'padding:2px 0;border-bottom:1px solid #eee;font-size:12px;color:#666';
    logEntry.innerHTML = `<span style="color:#999;font-size:11px">[${timestamp}]</span> ${message}`;
    
    // Agregar al principio del log
    this.elements.logContent.insertBefore(logEntry, this.elements.logContent.firstChild);
    
    // Limitar a 50 entradas
    while (this.elements.logContent.children.length > 50) {
      this.elements.logContent.removeChild(this.elements.logContent.lastChild);
    }
  }

  loadLog() {
    // Cargar log inicial
    this.addLog('🚀 Panel de administración de mensajes iniciado');
    this.addLog('💬 Los mensajes son PERMANENTES hasta que el admin los borre');
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Solo inicializar si estamos en la página de admin
  if (document.getElementById('messagesSection')) {
    window.messagesAdmin = new MessagesAdmin();
    console.log('💬 Administración de mensajes inicializada');
  }
});
