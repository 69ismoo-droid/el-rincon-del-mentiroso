# Documentación de API

Esta documentación describe todos los endpoints disponibles en la API del COAR Community & Control Maestro.

## Base URL

- **Desarrollo**: `http://localhost:3002/api`
- **Producción**: `https://tu-dominio.com/api`

## Autenticación

La mayoría de los endpoints requieren autenticación mediante sesiones. La sesión se gestiona automáticamente mediante cookies.

### Headers

```http
Content-Type: application/json
```

### Errores Comunes

- `401 Unauthorized`: Usuario no autenticado
- `403 Forbidden`: Usuario no tiene permisos
- `404 Not Found`: Recurso no encontrado
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Error del servidor

---

## Endpoints de Autenticación

### POST /api/auth/register

Registra un nuevo usuario con correo institucional.

**Body:**
```json
{
  "email": "usuario@cusco.coar.edu.pe",
  "password": "contraseña123"
}
```

**Response (200):**
```json
{
  "message": "Registro iniciado. Revisa tu correo institucional para obtener tu código de verificación.",
  "email": "usuario@cusco.coar.edu.pe"
}
```

**Response (Desarrollo):**
```json
{
  "message": "Registro completado exitosamente (modo desarrollo).",
  "email": "usuario@cusco.coar.edu.pe",
  "verified": true,
  "needsProfile": true
}
```

**Errors:**
- `400`: Email o contraseña inválidos
- `409`: Email ya registrado

---

### POST /api/auth/verify

Verifica el correo electrónico con código OTP.

**Body:**
```json
{
  "email": "usuario@cusco.coar.edu.pe",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "Correo verificado exitosamente",
  "verified": true,
  "needsProfile": true
}
```

**Errors:**
- `400`: Código inválido o expirado

---

### POST /api/auth/complete-profile

Completa el perfil del usuario después de la verificación.

**Body:**
```json
{
  "email": "usuario@cusco.coar.edu.pe",
  "nombreCompleto": "Juan Pérez",
  "añoIngreso": 2024
}
```

**Response (200):**
```json
{
  "message": "Perfil completado correctamente",
  "user": {
    "email": "usuario@cusco.coar.edu.pe",
    "nombreCompleto": "Juan Pérez",
    "añoIngreso": 2024,
    "role": "user",
    "isVerified": true
  }
}
```

**Errors:**
- `400`: Datos inválidos
- `404`: Usuario no encontrado o no verificado

---

### POST /api/auth/login

Inicia sesión con credenciales.

**Body:**
```json
{
  "email": "usuario@cusco.coar.edu.pe",
  "password": "contraseña123"
}
```

**Response (200):**
```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "email": "usuario@cusco.coar.edu.pe",
    "nombreCompleto": "Juan Pérez",
    "añoIngreso": 2024,
    "role": "user",
    "isVerified": true,
    "credits": 100
  }
}
```

**Errors:**
- `401`: Credenciales inválidas
- `403`: Usuario no verificado o suspendido

---

### POST /api/auth/logout

Cierra la sesión del usuario.

**Response (200):**
```json
{
  "message": "Sesión cerrada correctamente"
}
```

---

### GET /api/auth/me

Obtiene información del usuario autenticado.

**Response (200):**
```json
{
  "user": {
    "email": "usuario@cusco.coar.edu.pe",
    "nombreCompleto": "Juan Pérez",
    "name": "Juan Pérez",
    "añoIngreso": 2024,
    "ingresoColegio": 2024,
    "role": "user",
    "isVerified": true,
    "credits": 100,
    "bio": "Bio del usuario",
    "picture": "url-de-imagen"
  }
}
```

**Errors:**
- `401`: No autenticado
- `404`: Usuario no encontrado

---

## Endpoints de Usuarios

### GET /api/users/leaderboard

Obtiene el ranking de los 10 usuarios con más créditos.

**Requiere:** Autenticación + Verificado + Email @cusco.coar.edu.pe

**Query Params:**
- Ninguno

**Response (200):**
```json
[
  {
    "rank": 1,
    "name": "Juan Pérez",
    "credits": 5000,
    "añoIngreso": 2024
  },
  ...
]
```

**Errors:**
- `403`: Usuario no verificado o no pertenece al COAR

---

### POST /api/users/buy-coins

Compra paquetes de créditos.

**Requiere:** Autenticación + Verificado + Email @cusco.coar.edu.pe

**Body:**
```json
{
  "package": "basic"
}
```

**Paquetes disponibles:**
- `basic`: 100 créditos
- `standard`: 500 créditos
- `premium`: 2000 créditos

**Response (200):**
```json
{
  "ok": true,
  "user": { ... },
  "coinsAdded": 100
}
```

**Errors:**
- `400`: Paquete inválido
- `403`: Usuario no verificado

---

### PATCH /api/user/ingreso-colegio

Actualiza el año de ingreso al colegio.

**Requiere:** Autenticación

**Body:**
```json
{
  "ingresoColegio": 2024
}
```

**Response (200):**
```json
{
  "ok": true,
  "ingresoColegio": 2024
}
```

**Errors:**
- `400`: Año inválido (debe estar entre 2000 y el año actual)
- `401`: No autenticado

---

## Endpoints del Foro

### GET /api/posts

Obtiene lista de publicaciones con filtros y paginación.

**Requiere:** Autenticación

**Query Params:**
- `q` (string): Búsqueda en título y contenido
- `author` (string): Filtrar por nombre de autor
- `category` (string): Filtrar por categoría (General, Académico, Social, Eventos, Otros)
- `startDate` (string): Fecha inicial (ISO 8601)
- `endDate` (string): Fecha final (ISO 8601)
- `page` (number): Página (default: 1)
- `limit` (number): Items por página (default: 20, max: 50)

**Response (200):**
```json
{
  "items": [
    {
      "_id": "...",
      "title": "Título",
      "content": "Contenido",
      "category": "General",
      "author": { "name": "...", "picture": "...", "role": "..." },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "views": 10
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

---

### POST /api/posts

Crea una nueva publicación.

**Requiere:** Autenticación

**Body:**
```json
{
  "title": "Título de la publicación",
  "content": "Contenido de la publicación",
  "category": "General"
}
```

**Límites:**
- Título: máximo 280 caracteres
- Contenido: máximo 50,000 caracteres

**Response (200):**
```json
{
  "_id": "...",
  "title": "Título de la publicación",
  "content": "Contenido de la publicación",
  "category": "General",
  "author": "...",
  "createdAt": "..."
}
```

**Errors:**
- `400`: Datos inválidos o texto demasiado largo

---

### GET /api/posts/:id

Obtiene una publicación específica con sus comentarios.

**Requiere:** Autenticación

**Response (200):**
```json
{
  "post": {
    "_id": "...",
    "title": "Título",
    "content": "Contenido",
    "author": { ... },
    "views": 10,
    "createdAt": "..."
  },
  "comments": [
    {
      "_id": "...",
      "content": "Comentario",
      "author": { ... },
      "createdAt": "..."
    }
  ]
}
```

**Errors:**
- `400`: ID inválido
- `404`: Publicación no encontrada

---

### POST /api/posts/:id/comments

Agrega un comentario a una publicación.

**Requiere:** Autenticación

**Body:**
```json
{
  "content": "Contenido del comentario"
}
```

**Límite:** máximo 10,000 caracteres

**Response (200):**
```json
{
  "_id": "...",
  "content": "Contenido del comentario",
  "author": "...",
  "post": "...",
  "createdAt": "..."
}
```

**Errors:**
- `400`: Comentario vacío o demasiado largo
- `404`: Publicación no encontrada

---

## Endpoints de Mensajería

### GET /api/messages

Obtiene todos los mensajes del usuario.

**Requiere:** Autenticación

**Query Params:**
- `page` (number): Página (default: 1)
- `limit` (number): Items por página (default: 30, max: 80)

**Response (200):**
```json
{
  "items": [
    {
      "_id": "...",
      "content": "Mensaje",
      "sender": { "name": "...", "picture": "..." },
      "recipient": { "name": "...", "picture": "..." },
      "createdAt": "..."
    }
  ],
  "total": 50,
  "page": 1,
  "pageSize": 30,
  "totalPages": 2
}
```

---

### GET /api/messages/thread/:partnerId

Obtiene la conversación con un usuario específico.

**Requiere:** Autenticación

**Query Params:**
- `page` (number): Página (default: 1)
- `limit` (number): Items por página (default: 30, max: 60)

**Response (200):**
```json
{
  "items": [ ... ],
  "total": 20,
  "page": 1,
  "pageSize": 30,
  "totalPages": 1
}
```

**Errors:**
- `400`: ID de partner inválido

---

### POST /api/messages

Envía un mensaje privado.

**Requiere:** Autenticación

**Body:**
```json
{
  "recipient": "userId",
  "content": "Contenido del mensaje"
}
```

**Límite:** máximo 10,000 caracteres

**Response (200):**
```json
{
  "_id": "...",
  "content": "Contenido del mensaje",
  "sender": "...",
  "recipient": "...",
  "createdAt": "..."
}
```

**Errors:**
- `400`: Mensaje vacío, demasiado largo, o destinatario inválido
- `404`: Usuario destinatario no encontrado

---

## Endpoints de Notificaciones

### GET /api/notifications

Obtiene las notificaciones del usuario.

**Requiere:** Autenticación

**Response (200):**
```json
[
  {
    "_id": "...",
    "recipient": "...",
    "sender": { "name": "...", "picture": "..." },
    "type": "comment",
    "content": "Juan comentó en tu publicación",
    "read": false,
    "createdAt": "..."
  }
]
```

---

### PATCH /api/notifications/read

Marca todas las notificaciones como leídas.

**Requiere:** Autenticación

**Response (200):**
```json
{
  "message": "Notifications marked as read"
}
```

---

## Endpoints de Apuestas

### GET /api/bets

Obtiene las apuestas del usuario.

**Requiere:** Autenticación

**Response (200):**
```json
[
  {
    "_id": "...",
    "event": "Nombre del evento",
    "prediction": "Opción seleccionada",
    "amount": 100,
    "outcome": "won" // o "lost", o undefined si no resuelto
  }
]
```

---

### POST /api/bets

Crea una nueva apuesta o se une a una existente.

**Requiere:** Autenticación

**Body:**
```json
{
  "event": "¿Quién ganará el campeonato?",
  "prediction": "Equipo A",
  "amount": 50
}
```

**Response (200):**
```json
{
  "ok": true,
  "credits": 950
}
```

**Errors:**
- `400`: Datos inválidos o créditos insuficientes

---

## Endpoints de Noticias

### GET /api/news

Obtiene todas las noticias.

**Requiere:** Autenticación

**Response (200):**
```json
[
  {
    "_id": "...",
    "title": "Título de la noticia",
    "content": "Contenido",
    "category": "ACADEMICO",
    "author": { "name": "..." },
    "createdAt": "..."
  }
]
```

---

### POST /api/news

Crea una nueva noticia.

**Requiere:** Autenticación + Rol: admin o superadmin

**Body:**
```json
{
  "title": "Título de la noticia",
  "content": "Contenido",
  "category": "ACADEMICO"
}
```

**Response (200):**
```json
{
  "_id": "...",
  "title": "Título de la noticia",
  "content": "Contenido",
  "category": "ACADEMICO",
  "author": "...",
  "createdAt": "..."
}
```

**Errors:**
- `400`: Título o contenido faltantes
- `403`: Permisos insuficientes

---

### DELETE /api/news/:id

Elimina una noticia.

**Requiere:** Autenticación + Rol: admin o superadmin

**Response (200):**
```json
{
  "ok": true
}
```

**Errors:**
- `400`: ID inválido
- `403`: Permisos insuficientes

---

## Endpoints de Profesores

### GET /api/teachers

Obtiene el ranking de profesores.

**Requiere:** Autenticación

**Response (200):**
```json
[
  {
    "_id": "...",
    "name": "Profesor Juan",
    "subject": "Matemáticas",
    "rating": 4.5,
    "reviews": [ ... ]
  }
]
```

---

### GET /api/teachers/:id

Obtiene detalles de un profesor específico.

**Requiere:** Autenticación

**Response (200):**
```json
{
  "_id": "...",
  "name": "Profesor Juan",
  "subject": "Matemáticas",
  "rating": 4.5,
  "reviews": [ ... ]
}
```

**Errors:**
- `400`: ID inválido
- `404`: Profesor no encontrado

---

### POST /api/teachers

Crea un nuevo profesor en el sistema.

**Requiere:** Autenticación + Rol: admin o superadmin

**Body:**
```json
{
  "name": "Profesor Juan",
  "subject": "Matemáticas"
}
```

**Response (200):**
```json
{
  "_id": "...",
  "name": "Profesor Juan",
  "subject": "Matemáticas",
  "rating": 0,
  "reviews": []
}
```

**Errors:**
- `400`: Nombre o materia faltantes
- `403`: Permisos insuficientes

---

### DELETE /api/teachers/:id

Elimina un profesor del sistema.

**Requiere:** Autenticación + Rol: admin o superadmin

**Response (200):**
```json
{
  "ok": true
}
```

**Errors:**
- `400`: ID inválido
- `403`: Permisos insuficientes

---

## Endpoints de Objetos Perdidos

### GET /api/lost-found

Obtiene todos los objetos perdidos.

**Requiere:** Autenticación

**Response (200):**
```json
[
  {
    "_id": "...",
    "title": "Celular encontrado",
    "description": "Descripción",
    "location": "Biblioteca",
    "founder": { "name": "..." },
    "createdAt": "..."
  }
]
```

---

## Endpoints de Administración

### GET /api/admin/stats

Obtiene estadísticas generales del sistema.

**Requiere:** Autenticación + Rol: admin o superadmin

**Response (200):**
```json
{
  "users": 150,
  "posts": 500,
  "semiadmins": 5,
  "bets": 20
}
```

**Errors:**
- `403`: Permisos insuficientes

---

### GET /api/admin/users

Obtiene todos los usuarios del sistema.

**Requiere:** Autenticación + Rol: admin o superadmin

**Response (200):**
```json
[
  {
    "_id": "...",
    "email": "usuario@cusco.coar.edu.pe",
    "nombreCompleto": "Juan Pérez",
    "role": "user",
    "credits": 100,
    "banned": false,
    "createdAt": "..."
  }
]
```

**Errors:**
- `403`: Permisos insuficientes

---

### PATCH /api/admin/users/:id

Actualiza información de un usuario.

**Requiere:** Autenticación + Rol: admin o superadmin

**Body:**
```json
{
  "role": "semiadmin",
  "banned": true,
  "credits": 500
}
```

**Response (200):**
```json
{
  "_id": "...",
  "email": "...",
  "role": "moderator",
  "banned": true,
  "credits": 500
}
```

**Errors:**
- `400`: ID inválido
- `403`: Permisos insuficientes
- `404`: Usuario no encontrado

---

### GET /api/admin/bets

Obtiene todas las apuestas del sistema.

**Requiere:** Autenticación + Rol: admin o superadmin

**Response (200):**
```json
[
  {
    "_id": "...",
    "event": "Evento",
    "options": [ ... ],
    "participants": [ ... ],
    "status": "open",
    "creator": { "name": "...", "email": "..." },
    "createdAt": "..."
  }
]
```

**Errors:**
- `403`: Permisos insuficientes

---

### PATCH /api/admin/bets/:id

Actualiza el estado de una apuesta.

**Requiere:** Autenticación + Rol: admin o superadmin

**Body:**
```json
{
  "status": "resolved",
  "winner": "Opción ganadora"
}
```

**Response (200):**
```json
{
  "_id": "...",
  "event": "Evento",
  "status": "resolved",
  "winner": "Opción ganadora"
}
```

**Errors:**
- `400`: ID inválido
- `403`: Permisos insuficientes
- `404`: Apuesta no encontrada

---

### DELETE /api/admin/bets/:id

Elimina una apuesta y devuelve créditos a los participantes.

**Requiere:** Autenticación + Rol: admin o superadmin

**Response (200):**
```json
{
  "ok": true
}
```

**Errors:**
- `400`: ID inválido
- `403`: Permisos insuficientes
- `404`: Apuesta no encontrada

---

## Endpoints de Moderación del Foro

### GET /api/admin/forum/posts

Obtiene todas las publicaciones para moderación.

**Requiere:** Autenticación + Rol: semiadmin, admin, o superadmin

**Query Params:**
- `q` (string): Búsqueda
- `page` (number): Página (default: 1)
- `limit` (number): Items por página (default: 15, max: 40)

**Response (200):**
```json
{
  "items": [ ... ],
  "total": 100,
  "page": 1,
  "pageSize": 15,
  "totalPages": 7
}
```

**Errors:**
- `403`: Permisos insuficientes

---

### DELETE /api/admin/forum/posts/:id

Elimina una publicación y sus comentarios.

**Requiere:** Autenticación + Rol: moderator, admin, o superadmin

**Response (200):**
```json
{
  "ok": true
}
```

**Errors:**
- `400`: ID inválido
- `403`: Permisos insuficientes
- `404`: Publicación no encontrada

---

### DELETE /api/admin/forum/comments/:id

Elimina un comentario.

**Requiere:** Autenticación + Rol: moderator, admin, o superadmin

**Response (200):**
```json
{
  "ok": true
}
```

**Errors:**
- `400`: ID inválido
- `403`: Permisos insuficientes
- `404`: Comentario no encontrado

---

## Endpoints de Health Check

### GET /api/health

Verifica el estado del servidor y la conexión a la base de datos.

**No requiere autenticación**

**Response (200):**
```json
{
  "status": "ok",
  "db": "connected"
}
```

---

## Rate Limiting

La API implementa rate limiting para prevenir abuso:

- **Endpoints generales**: 400 requests por 15 minutos (producción) / 2000 (desarrollo)
- **Endpoints de autenticación**: 40 requests por 15 minutos (producción) / 200 (desarrollo)

Al exceder el límite, se retorna un error `429 Too Many Requests`.

---

## Socket.io Events

El proyecto usa WebSocket para notificaciones en tiempo real.

### Conexión

```javascript
const socket = io('http://localhost:3002');
```

### Eventos

#### register

Registra el usuario para recibir notificaciones.

```javascript
socket.emit('register', userId);
```

#### notification

Recibe notificaciones en tiempo real.

```javascript
socket.on('notification', (notification) => {
  console.log('Nueva notificación:', notification);
});
```

---

## Errores

Todos los errores siguen este formato:

```json
{
  "error": "Mensaje de error descriptivo"
}
```

Códigos de error HTTP comunes:
- `400 Bad Request`: Datos inválidos en la petición
- `401 Unauthorized`: No autenticado
- `403 Forbidden`: Permisos insuficientes
- `404 Not Found`: Recurso no encontrado
- `409 Conflict`: Recurso ya existe
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Error del servidor
- `503 Service Unavailable`: Base de datos no disponible
