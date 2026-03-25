# Noticias Blog (COAR Cusco)

Aplicación web para publicar noticias con:
- Registro e inicio de sesión obligatorio
- Creación de cuentas solo con correos terminados en `@cusco.coar.edu.pe`
- Feed de noticias tipo “blog” mostrando el nombre del creador
- Adjuntos de archivos al publicar

## Ejecutar
1. Instalar dependencias:
   - `npm install`
2. (Opcional) Crear un `.env` con `PORT` y `JWT_SECRET`.
3. Iniciar el servidor:
   - `npm start`

Luego abre:
- `http://localhost:3000`

## Endpoints (API)
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/news`
- `POST /api/news` (multipart/form-data con `title`, `content` y `files[]`)

