# Guía de Instalación y Configuración

Esta guía detalla los pasos para configurar y ejecutar el proyecto COAR Community & Control Maestro en tu entorno local.

## 📋 Requisitos Previos

### Software Requerido

- **Node.js**: Versión >= 22 y < 27
  - [Descargar Node.js](https://nodejs.org/)
  - Verificar instalación: `node --version`

- **npm**: Versión >= 9.0 (incluido con Node.js)
  - Verificar instalación: `npm --version`

### Servicios en la Nube (Requeridos para Producción)

Para que el proyecto funcione en cualquier laptop y esté listo para producción, usa estos servicios gratuitos:

- **MongoDB Atlas** (Base de datos)
  - [Crear cuenta gratuita](https://www.mongodb.com/cloud/atlas)
  - Crear un cluster gratuito (M0)
  - Obtener la connection string
  - **Importante**: Configura IP whitelist a `0.0.0.0/0` para permitir acceso desde cualquier lugar

- **Resend** (Envío de emails)
  - [Crear cuenta gratuita](https://resend.com)
  - Crear API key en [resend.com/api-keys](https://resend.com/api-keys)
  - En desarrollo usa `onboarding@resend.dev` (gratis)
  - Para producción, configura tu propio dominio

## 🔧 Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd coar-community-&-control-maestro
```

### 2. Instalar Dependencias

```bash
npm install
```

Esto instalará todas las dependencias necesarias para el frontend y backend.

### 3. Configurar Variables de Entorno

Copia el archivo de ejemplo de variables de entorno:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tu configuración:

#### Variables Obligatorias

```bash
# Base de datos MongoDB (usa MongoDB Atlas para producción)
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/coar?retryWrites=true&w=majority

# Secret de sesión (genera uno seguro)
SESSION_SECRET=genera_una_clave_segura_de_al_menos_32_caracteres

# Dominios de email permitidos
ALLOWED_EMAIL_DOMAINS=cusco.coar.edu.pe

# API Key de Resend para emails
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Nota para producción:**
- `MONGODB_URI`: Usa la connection string de MongoDB Atlas (no localhost)
- `SESSION_SECRET`: Genera uno único con `npm run generate:secret`
- `RESEND_API_KEY`: Obtén tu API key de Resend

#### Variables Opcionales

```bash
# Email de administrador inicial
BOOTSTRAP_ADMIN_EMAIL=admin@cusco.coar.edu.pe

# URL pública del sitio
PUBLIC_URL=http://localhost:3000

# Entorno
NODE_ENV=development

# Cloudinary (opcional - para subir imágenes)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=foro-coar
```

### 4. Generar SESSION_SECRET Seguro

El proyecto incluye un script para generar un secret seguro:

```bash
npm run generate:secret
```

Copia el resultado y pégalo en la variable `SESSION_SECRET` de tu archivo `.env`.

### 5. Configurar Resend

1. Ve a [resend.com/api-keys](https://resend.com/api-keys)
2. Crea una nueva API key
3. Copia la API key (comienza con `re_`)
4. Pégala en la variable `RESEND_API_KEY` de tu `.env`

**Nota**: Durante el desarrollo, Resend usa `onboarding@resend.dev` como remitente gratuito. Para producción, configura tu propio dominio en Resend.

### 6. Iniciar MongoDB

#### Si usas MongoDB local:

```bash
# En Linux/Mac
sudo systemctl start mongod

# En Windows
# Inicia MongoDB desde el Services Manager
```

#### Si usas Docker:

```bash
docker start mongodb
```

#### Si usas MongoDB Atlas:

Solo asegúrate de que tu `MONGODB_URI` en `.env` apunte a tu cluster de Atlas.

### 7. Ejecutar el Proyecto

#### Modo Desarrollo

```bash
npm run dev
```

El servidor iniciará en `http://localhost:3002`

#### Modo Producción

```bash
# Construir el proyecto
npm run build

# Iniciar servidor
npm start
```

## 🐛 Solución de Problemas

### Error: "RESEND_API_KEY no está configurada"

**Causa**: La variable `RESEND_API_KEY` no está en tu archivo `.env`

**Solución**:
1. Abre tu archivo `.env`
2. Agrega: `RESEND_API_KEY=re_tu_api_key_aqui`
3. Reinicia el servidor

### Error: "Connection refused" en MongoDB

**Causa**: MongoDB no está ejecutándose

**Solución**:
```bash
# Verificar si MongoDB está corriendo
sudo systemctl status mongod  # Linux/Mac
# o
docker ps | grep mongodb  # Docker

# Iniciar MongoDB
sudo systemctl start mongod  # Linux/Mac
# o
docker start mongodb  # Docker
```

### Error: "EADDRINUSE: address already in use"

**Causa**: El puerto 3002 ya está en uso

**Solución**:
```bash
# Encontrar el proceso usando el puerto
lsof -i :3002

# Matar el proceso
kill -9 <PID>
```

### Error: "Cannot find module"

**Causa**: Dependencias no instaladas correctamente

**Solución**:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📝 Configuración Avanzada

### Configurar CORS

Si tu frontend y backend están en dominios diferentes, configura `CORS_ORIGINS` en `.env`:

```bash
CORS_ORIGINS=https://tu-app.onrender.com,https://otro-dominio.com
```

### Configurar Cookies Seguras

Para producción con HTTPS:

```bash
SESSION_COOKIE_SECURE=true
SESSION_SAME_SITE=none
COOKIE_DOMAIN=.tudominio.com
```

### Configurar Logging

Cambia el nivel de logging en `.env`:

```bash
LOG_LEVEL=debug  # Opciones: error, warn, info, debug
```

## 🚀 Despliegue en Producción

### Render

1. Conecta tu repositorio en [Render](https://render.com)
2. Crea un nuevo Web Service
3. Configura las variables de entorno en el panel de Render
4. El archivo `render.yaml` incluye la configuración necesaria

### Docker

```bash
# Construir imagen
docker build -t coar-community .

# Ejecutar contenedor
docker run -p 3002:3002 --env-file .env coar-community
```

## 🔒 Seguridad en Producción

- **Nunca** commitees tu archivo `.env` al repositorio
- Usa `SESSION_SECRET` generado aleatoriamente (mínimo 32 caracteres)
- Configura `NODE_ENV=production`
- Usa HTTPS en producción
- Restringe `ALLOWED_EMAIL_DOMAINS` a dominios institucionales
- Configura tu propio dominio en Resend (no uses `onboarding@resend.dev` en producción)

## 📞 Soporte

Si encuentras problemas no documentados aquí, abre un issue en el repositorio con:
- Versión de Node.js
- Versión de MongoDB
- Sistema operativo
- Mensaje de error completo
- Pasos para reproducir el problema
