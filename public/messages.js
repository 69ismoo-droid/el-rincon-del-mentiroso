// Verificar que io esté disponible antes de usarlo
if (typeof io === 'undefined') {
    console.error('❌ ERROR: Socket.io no está disponible');
    console.error('💡 Espera a que la página cargue completamente');
    throw new Error('Socket.io no disponible');
}

// Clase para manejar mensajes en tiempo real
class RealTimeMessages {
  constructor() {
    this.socket = null;
    this.messages = [];
    this.connectedUsers = [];
    this.currentReceiverId = null;
    this.elements = {};
    
    this.initElements();
    this.connectWebSocket();
  }

  initElements() {
    this.elements.messagesContainer = $('messagesContainer');
    this.elements.messageForm = $('messageForm');
    this.elements.messageInput = $('messageInput');
    this.elements.receiverSelect = $('receiverSelect');
    this.elements.onlineUsers = $('onlineUsers');
    this.elements.connectionStatus = $('connectionStatus');
    this.elements.messageCount = $('messageCount');
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (this.elements.messageForm) {
      this.elements.messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }
    
    if (this.elements.receiverSelect) {
      this.elements.receiverSelect.addEventListener('change', (e) => {
        this.currentReceiverId = e.target.value;
        this.loadMessages();
      });
    }
  }

  connectWebSocket() {
    try {
      // Obtener token
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('❌ No hay token de autenticación');
        window.location.href = '/login.html';
        return;
      }

      // URL del servidor (producción en Render)
      const serverUrl = 'https://el-rincon-del-mentiroso.onrender.com';
      console.log('🔌 Conectando a:', serverUrl);

      // Conectar a Socket.io
      this.socket = io(serverUrl, {
        auth: { token: token },
        transports: ['websocket', 'polling'],
        withCredentials: true
      });

      this.setupSocketEvents();
      this.updateStatus('🔄 Conectando...', 'connecting');
      
    } catch (error) {
      console.error('❌ Error conectando WebSocket:', error);
      this.updateStatus('❌ Error de conexión', 'error');
    }
  }

  setupSocketEvents() {
    // Conexión exitosa
    this.socket.on('connect', () => {
      this.updateStatus('✅ Conectado', 'connected');
      console.log('🔌 WebSocket conectado');
    });

    // Error de conexión
    this.socket.on('connect_error', (err) => {
      console.error('❌ Error de conexión:', err.message);
      this.updateStatus('❌ Error de conexión', 'error');
    });

    // Lista de usuarios
    this.socket.on('users_list', (users) => {
      this.connectedUsers = users;
      this.updateOnlineUsers();
      console.log('👥 Usuarios conectados:', users.length);
    });

    // Nuevo usuario
    this.socket.on('user_connected', (user) => {
      console.log('👤 Usuario conectado:', user.email);
      this.loadUsers();
    });

    // Mensaje recibido - SOLO si es para mí o de mí
    this.socket.on('new_message', (message) => {
      // Verificar que el mensaje sea para el usuario actual
      const isForMe = message.receiverId === this.getCurrentUserId();
      const isFromMe = message.senderId === this.getCurrentUserId();
      
      if (isForMe || isFromMe) {
        this.messages.push(message);
        this.renderMessages();
        this.updateMessageCount();
        console.log('📬 Nuevo mensaje privado recibido');
        
        // Si no es de mí, mostrar notificación
        if (isForMe && !isFromMe) {
          console.log(`🔔 Nuevo mensaje de: ${message.senderName}`);
        }
      }
    });

    // Mensaje leído
    this.socket.on('message_read', (data) => {
      const message = this.messages.find(m => m.id === data.messageId);
      if (message) {
        message.read = true;
        this.renderMessages();
      }
    });

    // Confirmación de mensaje enviado
    this.socket.on('message_sent', (data) => {
      console.log('✅ Mensaje enviado confirmado:', data.delivered ? 'Entregado' : 'Guardado (usuario no conectado)');
      if (data.delivered) {
        console.log('📨 El destinatario recibió el mensaje');
      } else {
        console.log('⏳ El destinatario no está conectado, mensaje guardado');
      }
    });
  }

  sendMessage() {
    const content = this.elements.messageInput.value.trim();
    const receiverId = this.elements.receiverSelect.value;
    
    if (!content || !receiverId) {
      console.warn('⚠️ Debes seleccionar destinatario y escribir mensaje');
      return;
    }

    this.socket.emit('send_message', {
      receiverId: receiverId,
      content: content
    });

    this.elements.messageInput.value = '';
    console.log('📤 Mensaje enviado');
  }

  loadMessages() {
    if (!this.currentReceiverId) return;
    
    fetch(`/api/mensajes/${this.currentReceiverId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(response => response.json())
    .then(data => {
      this.messages = data.mensajes || [];
      this.renderMessages();
    })
    .catch(error => {
      console.error('❌ Error cargando mensajes:', error);
    });
  }

  renderMessages() {
    if (!this.elements.messagesContainer) return;
    
    // SOLO mostrar mensajes entre el usuario actual y el destinatario seleccionado
    const filteredMessages = this.messages.filter(msg => 
      (msg.senderId === this.getCurrentUserId() && msg.receiverId === this.currentReceiverId) ||
      (msg.senderId === this.currentReceiverId && msg.receiverId === this.getCurrentUserId())
    );

    this.elements.messagesContainer.innerHTML = filteredMessages.map(message => {
      const isFromMe = message.senderId === this.getCurrentUserId();
      const isRead = message.read || message.readBy;
      
      return `<div class="message ${isFromMe ? 'sent' : 'received'} ${isRead ? 'read' : 'unread'}" data-message-id="${message.id}">
        <div class="message-header">
          <span class="message-sender">${isFromMe ? 'Tú' : (message.senderName || 'Usuario')}</span>
          <span class="message-time">${message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Fecha no disponible'}</span>
          <span class="read-indicator">${isRead ? '✓ Leído' : '○ No leído'}</span>
        </div>
        <div class="message-content">${message.content}</div>
        ${!isRead && !isFromMe ? `<button class="mark-read-btn" onclick="markAsRead('${message.id}')">Marcar como leído</button>` : ''}
      </div>`;
    }).join('');
    
    // Scroll al último mensaje
    this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
  }

  updateOnlineUsers() {
    if (!this.elements.onlineUsers) return;
    
    this.elements.onlineUsers.innerHTML = this.connectedUsers.map(user => 
      `<div class="online-user" data-user-id="${user.userId}">
        <div class="user-status online"></div>
        <div class="user-info">
          <div class="user-name">${user.email}</div>
          <div class="user-time">Conectado: ${new Date(user.connectedAt).toLocaleTimeString()}</div>
        </div>
      </div>`
    ).join('');

    this.updateReceiverSelect();
  }

  updateReceiverSelect() {
    if (!this.elements.receiverSelect) return;
    
    const currentValue = this.elements.receiverSelect.value;
    this.elements.receiverSelect.innerHTML = 
      '<option value="">Seleccionar destinatario...</option>' +
      this.connectedUsers
        .filter(user => user.userId !== this.getCurrentUserId())
        .map(user => `<option value="${user.userId}">${user.email}</option>`)
        .join('');
    
    if (currentValue) {
      this.elements.receiverSelect.value = currentValue;
    }
  }

  getCurrentUserId() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub;
    } catch (error) {
      console.error('❌ Error obteniendo ID de usuario:', error);
      return null;
    }
  }

  updateStatus(text, className) {
    if (this.elements.connectionStatus) {
      this.elements.connectionStatus.textContent = text;
      this.elements.connectionStatus.className = 'status ' + className;
    }
  }

  updateMessageCount() {
    if (!this.elements.messageCount) return;
    
    const unreadCount = this.messages.filter(m => 
      m.receiverId === this.getCurrentUserId() && !m.read && !m.readBy
    ).length;
    
    this.elements.messageCount.textContent = unreadCount > 0 ? '📬 ' + unreadCount + ' no leídos' : '📬 Sin mensajes nuevos';
  }

  markAsRead(messageId) {
    if (this.socket) {
      this.socket.emit('mark_read', { messageId: messageId });
    }
  }
}

// Funciones globales
function markAsRead(messageId) {
  if (window.messagesApp) {
    window.messagesApp.markAsRead(messageId);
  }
}

function $(id) {
  return document.getElementById(id);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 DOM listo, inicializando mensajes...');
  
  // Verificar autenticación
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No hay token de autenticación');
    window.location.href = '/login.html';
    return;
  }

  // Inicializar aplicación
  try {
    window.messagesApp = new RealTimeMessages();
    console.log('✅ Aplicación de mensajes inicializada');
  } catch (error) {
    console.error('❌ Error inicializando aplicación:', error);
  }
});
