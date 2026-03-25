# Noticias Blog (COAR Cusco)

Aplicación web para publicar noticias con:
- Registro e inicio de sesión obligatorio
- Creación de cuentas solo con correos terminados en `@cusco.coar.edu.pe`
- Feed de noticias tipo "blog" mostrando el nombre del creador
- Adjuntos de archivos al publicar
- Foro de discusión con hilos y respuestas
- **Persistencia real con SQLite** (funciona en Render)

## Características Técnicas
- **Base de datos SQLite** para persistencia real
- Compatible con **Render** (detecta automáticamente el entorno)
- Sistema de archivos con limpieza automática
- Autenticación JWT segura
- API RESTful completa

## Ejecutar
1. Instalar dependencias:
   - `npm install`
2. (Opcional) Crear un `.env` con `PORT` y `JWT_SECRET`.
3. Iniciar el servidor:
   - `npm start`

Luego abre:
- `http://localhost:3000`

## Para GitHub y Render

### 1. Subir a GitHub
```bash
git add .
git commit -m "Implementar SQLite para persistencia en Render"
git push origin main
```

### 2. Configurar en Render
1. Conecta tu repositorio de GitHub a Render
2. Configura las variables de entorno:
   - `JWT_SECRET`: una clave muy segura
   - `PORT`: 3000 (valor por defecto de Render)
3. En "Build Command" usa: `npm install`
4. En "Start Command" usa: `npm start`

### 3. ¿Cómo funciona?
- **GitHub**: No almacena datos de usuarios (seguro)
- **Render**: Crea base de datos SQLite en `/tmp/database.sqlite`
- **Persistencia**: Los datos sobreviven a reinicios en Render
- **Archivos**: Se guardan en `/tmp/uploads` en Render

### 4. Base de datos
- **Local**: `data/database.sqlite` (se ignora en Git)
- **Render**: `/tmp/database.sqlite` (persistente)
- **Inicialización**: Automática al iniciar el servidor

## Endpoints (API)
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/news`
- `POST /api/news` (multipart/form-data con `title`, `content` y `files[]`)
- `DELETE /api/news/:newsId`
- `GET /api/forum/threads`
- `POST /api/forum/threads`
- `GET /api/forum/threads/:threadId`
- `DELETE /api/forum/threads/:threadId`
- `POST /api/forum/threads/:threadId/replies`
- `DELETE /api/forum/replies/:replyId`
