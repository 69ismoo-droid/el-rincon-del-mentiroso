// Sistema de Mensajes en Tiempo Real - WebSocket
class RealTimeMessages {
  constructor() {
    this.socket = null;
    this.currentUser = null;
    this.messages = [];
    this.connectedUsers = [];
    
    this.elements = {
      messagesContainer: document.getElementById('messagesContainer'),
      messageForm: document.getElementById('messageForm'),
      messageInput: document.getElementById('messageInput'),
      receiverSelect: document.getElementById('receiverSelect'),
      onlineUsers: document.getElementById('onlineUsers'),
      connectionStatus: document.getElementById('connectionStatus'),
      messageCount: document.getElementById('messageCount')
    };
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    
    // Verificación simple de io
    if (typeof io === 'undefined') {
      console.error('❌ Socket.io no está disponible');
      this.updateStatus('❌ Error: Socket.io no disponible', 'error');
      return;
    }
    
    console.log('✅ Socket.io disponible, conectando...');
    this.connectWebSocket();
  }

  connectWebSocket() {
    try {
      // Verificar que io esté disponible
      if (typeof io === 'undefined') {
        console.error('Socket.io no está cargado');
        this.updateStatus('❌ Socket.io no disponible', 'error');
        return;
      }

      // Obtener token del localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        this.updateStatus('❌ No autenticado', 'error');
        return;
      }

      // Determinar URL del servidor
      const serverUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : window.location.origin;

      console.log('🔌 Conectando a WebSocket:', serverUrl);

      // Conectar a WebSocket con autenticación
      this.socket = io(serverUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.setupSocketEvents();
      this.updateStatus('🔄 Conectando...', 'connecting');
      
    } catch (error) {
      console.error('Error al conectar WebSocket:', error);
      this.updateStatus('❌ Error de conexión', 'error');
    }
  }

  setupSocketEvents() {
    // ✅ Conexión exitosa
    this.socket.on('connect', () => {
      this.updateStatus('✅ Conectado', 'connected');
      console.log('🔌 WebSocket conectado para mensajes en tiempo real');
    });

    // 📋 Lista de usuarios conectados
    this.socket.on('users_list', (users) => {
      this.connectedUsers = users;
      this.updateOnlineUsers();
      console.log('👥 Usuarios conectados:', users.length);
    });

    // 🔔 Nuevo usuario conectado
    this.socket.on('user_connected', (user) => {
      const existingUser = this.connectedUsers.find(u => u.userId === user.userId);
      if (!existingUser) {
        this.connectedUsers.push(user);
        this.updateOnlineUsers();
        console.log('🔌 Usuario conectado:', user.email);
      }
    });

    // 🔔 Usuario desconectado
    this.socket.on('user_disconnected', (user) => {
      this.connectedUsers = this.connectedUsers.filter(u => u.userId !== user.userId);
      this.updateOnlineUsers();
      console.log('🔌 Usuario desconectado:', user.email);
    });

    // 📬 Mensaje recibido en tiempo real
    this.socket.on('new_message', (message) => {
      this.addMessage(message);
      this.updateMessageCount();
      
      // Notificación si no es el mensaje actual
      if (message.receiverId === this.getCurrentUserId()) {
        this.showNotification('Nuevo mensaje de ' + message.senderName, message.content);
      }
      
      console.log('📨 Mensaje recibido en tiempo real:', message);
    });

    // ✅ Mensaje enviado confirmado
    this.socket.on('message_sent', (message) => {
      this.addMessage(message);
      console.log('✅ Mensaje enviado confirmado:', message.delivered ? 'Entregado' : 'Pendiente');
    });

    // 📖 Mensaje leído (notificación al emisor)
    this.socket.on('message_read', (data) => {
      this.markMessageAsRead(data.messageId);
      console.log('📖 Mensaje leído:', data);
    });

    // ❌ Error
    this.socket.on('error', (error) => {
      console.error('❌ Error WebSocket:', error);
      this.updateStatus('❌ ' + error.message, 'error');
    });

    // 🔌 Desconexión
    this.socket.on('disconnect', () => {
      this.updateStatus('🔌 Desconectado', 'disconnected');
      console.log('🔌 WebSocket desconectado');
    });
  }

  setupEventListeners() {
    // Enviar mensaje
    if (this.elements.messageForm) {
      this.elements.messageForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendMessage();
      });
    }

    // Actualizar receptor cuando cambia la selección
    if (this.elements.receiverSelect) {
      this.elements.receiverSelect.addEventListener('change', () => {
        this.filterMessages();
      });
    }

    // Reconectar automáticamente
    if (this.socket) {
      this.socket.on('disconnect', () => {
        setTimeout(() => {
          console.log('🔄 Intentando reconectar WebSocket...');
          this.connectWebSocket();
        }, 5000);
      });
    }
  }

  sendMessage() {
    const receiverId = this.elements.receiverSelect.value;
    const content = this.elements.messageInput.value.trim();

    if (!receiverId || !content) {
      alert('Por favor selecciona un destinatario y escribe un mensaje');
      return;
    }

    // Enviar por WebSocket
    this.socket.emit('send_message', {
      receiverId: receiverId,
      content: content
    });

    // Limpiar input
    this.elements.messageInput.value = '';
    if (this.elements.messageInput) {
      this.elements.messageInput.focus();
    }
  }

  addMessage(message) {
    this.messages.push(message);
    this.renderMessages();
  }

  markMessageAsRead(messageId) {
    const messageElement = document.querySelector('[data-message-id="' + messageId + '"]');
    if (messageElement) {
      messageElement.classList.add('read');
      const readIndicator = messageElement.querySelector('.read-indicator');
      if (readIndicator) {
        readIndicator.textContent = '✓ Leído';
      }
    }
  }

  updateOnlineUsers() {
    if (!this.elements.onlineUsers) return;
    
    this.elements.onlineUsers.innerHTML = this.connectedUsers.map(user => {
      return '<div class="online-user" data-user-id="' + user.userId + '">' +
        '<div class="user-status online"></div>' +
        '<div class="user-info">' +
          '<div class="user-name">' + user.email + '</div>' +
          '<div class="user-time">Conectado: ' + new Date(user.connectedAt).toLocaleTimeString() + '</div>' +
        '</div>' +
        '</div>';
    }).join('');

    // Actualizar selector de destinatarios
    this.updateReceiverSelect();
  }

  updateReceiverSelect() {
    if (!this.elements.receiverSelect) return;
    
    const currentValue = this.elements.receiverSelect.value;
    this.elements.receiverSelect.innerHTML = 
      '<option value="">Seleccionar destinatario...</option>' +
      this.connectedUsers
        .filter(user => user.userId !== this.getCurrentUserId())
        .map(user => '<option value="' + user.userId + '">' + user.email + '</option>')
        .join('');
    
    if (currentValue) {
      this.elements.receiverSelect.value = currentValue;
    }
  }

  renderMessages() {
    if (!this.elements.messagesContainer) return;
    
    const receiverId = this.elements.receiverSelect ? this.elements.receiverSelect.value : null;
    const filteredMessages = receiverId 
      ? this.messages.filter(m => 
          (m.senderId === this.getCurrentUserId() && m.receiverId === receiverId) ||
          (m.receiverId === this.getCurrentUserId() && m.senderId === receiverId)
        )
      : this.messages;

    this.elements.messagesContainer.innerHTML = filteredMessages.map(message => {
      const isFromMe = message.senderId === this.getCurrentUserId();
      const isRead = message.read || message.readBy;
      
      return '<div class="message ' + (isFromMe ? 'sent' : 'received') + ' ' + (isRead ? 'read' : 'unread') + '" data-message-id="' + message.id + '">' +
        '<div class="message-header">' +
          '<span class="message-sender">' +
            (isFromMe ? 'Tú' : (message.senderName || message.senderEmail)) +
          '</span>' +
          '<span class="message-time">' +
            new Date(message.createdAt).toLocaleTimeString() +
          '</span>' +
          '<span class="read-indicator">' +
            (isRead ? '✓ Leído' : '○ No leído') +
          '</span>' +
        '</div>' +
        '<div class="message-content">' +
          message.content +
        '</div>' +
        (!isRead && !isFromMe ? 
          '<button class="mark-read-btn" onclick="markAsRead(\'' + message.id + '\')">Marcar como leído</button>' 
          : '') +
        '</div>';
    }).join('');

    // Scroll al último mensaje
    this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
  }

  updateMessageCount() {
    if (!this.elements.messageCount) return;
    
    const unreadCount = this.messages.filter(m => 
      m.receiverId === this.getCurrentUserId() && !m.read && !m.readBy
    ).length;
    
    this.elements.messageCount.textContent = unreadCount > 0 ? '📬 ' + unreadCount + ' no leídos' : '📬 Sin mensajes nuevos';
    this.elements.messageCount.className = unreadCount > 0 ? 'badge' : '';
  }

  updateStatus(message, status) {
    if (!this.elements.connectionStatus) return;
    
    this.elements.connectionStatus.textContent = message;
    this.elements.connectionStatus.className = 'status ' + status;
  }

  showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      });
    }
  }

  getCurrentUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub;
    } catch {
      return null;
    }
  }

  markAsRead(messageId) {
    if (this.socket) {
      this.socket.emit('mark_read', { messageId: messageId });
    }
  }

  filterMessages() {
    this.renderMessages();
    this.updateMessageCount();
  }
}

// Esperar a que el DOM esté listo y verificar Socket.io
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 DOM listo, verificando Socket.io...');
  
  // Verificar token primero
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No hay token de autenticación');
    window.location.href = '/login.html';
    return;
  }

  // Verificar Socket.io
  if (typeof io === 'undefined') {
    console.error('❌ Socket.io no está disponible');
    console.error('🔍 Intentando cargar Socket.io manualmente...');
    
    // Cargar Socket.io manualmente
    const script = document.createElement('script');
    script.src = '/socket.io/socket.io.js';
    script.onload = () => {
      console.log('✅ Socket.io cargado manualmente');
      
      // Esperar y verificar
      setTimeout(() => {
        if (typeof io !== 'undefined') {
          console.log('✅ io disponible, inicializando...');
          // Pedir permiso para notificaciones
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
          window.messagesApp = new RealTimeMessages();
        } else {
          console.error('❌ io todavía no disponible');
          alert('Error: No se pudo cargar Socket.io. Recarga la página.');
        }
      }, 1000);
    };
    script.onerror = () => {
      console.error('❌ No se pudo cargar Socket.io manualmente');
      alert('Error: No se pudo cargar Socket.io. Recarga la página.');
    };
    document.head.appendChild(script);
  } else {
    console.log('✅ Socket.io disponible, inicializando...');
    // Pedir permiso para notificaciones
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    window.messagesApp = new RealTimeMessages();
  }
});

// Función global para marcar mensajes
function markAsRead(messageId) {
  if (window.messagesApp) {
    window.messagesApp.markAsRead(messageId);
  }
}
