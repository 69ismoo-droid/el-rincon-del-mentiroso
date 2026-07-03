# Guía de Despliegue en Producción

Esta guía explica cómo desplegar el proyecto COAR Community & Control Maestro para que sea accesible desde cualquier lugar.

## 🎯 Objetivo

Que el proyecto funcione en cualquier laptop y esté disponible en la nube para todos los usuarios del COAR.

## 📦 Servicios en la Nube (Gratuitos)

### 1. MongoDB Atlas (Base de Datos)

**Por qué:** Base de datos en la nube accesible desde cualquier lugar.

**Pasos:**
1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto llamado "COAR Community"
4. Crea un cluster gratuito (M0) - selecciona la región más cercana a Perú
5. Espera a que el cluster se cree (3-5 minutos)
6. En "Database Access", crea un usuario de base de datos:
   - Username: `coar_admin`
   - Password: Genera una contraseña segura
7. En "Network Access", configura IP whitelist:
   - Agrega `0.0.0.0/0` para permitir acceso desde cualquier lugar
8. En "Database", obtén la connection string:
   - Selecciona "Connect" → "Drivers"
   - Copia la connection string (reemplaza `<password>` con tu contraseña)

**Connection string ejemplo:**
```
mongodb+srv://coar_admin:tu_password@cluster0.xxxxx.mongodb.net/coar?retryWrites=true&w=majority
```

---

### 2. Resend (Envío de Emails)

**Por qué:** Servicio de emails confiable y gratuito para desarrollo.

**Pasos:**
1. Ve a [Resend](https://resend.com)
2. Crea una cuenta gratuita
3. Ve a [API Keys](https://resend.com/api-keys)
4. Crea una nueva API key
5. Copia la API key (empieza con `re_`)

**Para producción:**
- Configura tu propio dominio en Resend
- Verifica el dominio con DNS records
- Usa tu dominio como remitente en lugar de `onboarding@resend.dev`

---

### 3. Render (Hosting)

**Por qué:** Hosting gratuito para aplicaciones Node.js con MongoDB Atlas.

**Opciones de despliegue:**

#### Opción A: Render (Recomendado - Gratis)

1. Ve a [Render](https://render.com)
2. Crea una cuenta gratuita
3. Conecta tu repositorio de GitHub
4. Crea un nuevo "Web Service":
   - Name: `coar-community`
   - Region: Oregon (más cercano a Perú)
   - Branch: `main`
   - Build Command: `npm run build`
   - Start Command: `npm start`
5. Configura las variables de entorno:
   - `MONGODB_URI`: Tu connection string de MongoDB Atlas
   - `SESSION_SECRET`: Genera uno seguro
   - `ALLOWED_EMAIL_DOMAINS`: `cusco.coar.edu.pe`
   - `RESEND_API_KEY`: Tu API key de Resend
   - `NODE_ENV`: `production`
6. Despliega y espera a que Render construya la aplicación
7. Obtén la URL pública (ej: `https://coar-community.onrender.com`)

#### Opción B: Railway (Alternativa - Gratis)

1. Ve a [Railway](https://railway.app)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto desde GitHub
4. Railway detectará automáticamente que es un proyecto Node.js
5. Configura las variables de entorno en el panel
6. Despliega y obtén la URL pública

#### Opción C: Vercel (Para frontend) + Render (Para backend)

Si prefieres separar frontend y backend:
- **Frontend**: Vercel (gratis)
- **Backend**: Render (gratis)

---

## 🔧 Preparación del Proyecto

### 1. Actualizar .env para Producción

Crea un archivo `.env.production`:

```bash
# Base de datos MongoDB Atlas
MONGODB_URI=mongodb+srv://coar_admin:tu_password@cluster0.xxxxx.mongodb.net/coar?retryWrites=true&w=majority

# Secret de sesión (genera uno único)
SESSION_SECRET=genera_una_clave_segura_de_al_menos_32_caracteres

# Dominios de email permitidos
ALLOWED_EMAIL_DOMAINS=cusco.coar.edu.pe

# API Key de Resend
RESEND_API_KEY=re_tu_api_key_aqui

# Entorno de producción
NODE_ENV=production

# URL pública del sitio (actualiza con tu URL de despliegue)
PUBLIC_URL=https://coar-community.onrender.com

# Email de bootstrapping para primer admin
BOOTSTRAP_ADMIN_EMAIL=admin@cusco.coar.edu.pe
```

### 2. Generar SESSION_SECRET Seguro

```bash
npm run generate:secret
```

Usa el resultado en tu `SESSION_SECRET`.

### 3. Verificar Dependencias

```bash
npm install
npm run build
```

---

## 🚀 Despliegue Paso a Paso (Render)

### Paso 1: Subir a GitHub

```bash
git add .
git commit -m "Preparar para producción"
git push origin main
```

### Paso 2: Conectar en Render

1. Entra a [Render](https://render.com)
2. Dashboard → "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Configura:
   - **Name**: `coar-community`
   - **Region**: Oregon (us-west)
   - **Branch**: `main`
   - **Runtime**: Node
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`

### Paso 3: Configurar Variables de Entorno

En el panel de Render, agrega estas variables:

| Variable | Valor |
|----------|-------|
| `MONGODB_URI` | Tu connection string de MongoDB Atlas |
| `SESSION_SECRET` | Tu secret generado |
| `ALLOWED_EMAIL_DOMAINS` | `cusco.coar.edu.pe` |
| `RESEND_API_KEY` | Tu API key de Resend |
| `NODE_ENV` | `production` |
| `PUBLIC_URL` | Tu URL de Render |

### Paso 4: Desplegar

1. Click en "Create Web Service"
2. Render clonará tu repositorio
3. Instalará dependencias
4. Construirá el proyecto
5. Iniciará el servidor
6. Te dará una URL pública

### Paso 5: Verificar

Visita tu URL pública y verifica:
- La página carga correctamente
- Puedes registrarte con email institucional
- Los emails de verificación se envían
- El foro funciona

---

## 📱 Acceso desde Cualquier Laptop

Una vez desplegado en la nube:

1. **Usuarios finales**: Solo necesitan la URL pública
   - Ej: `https://coar-community.onrender.com`
   - Funciona en cualquier dispositivo con navegador
   - No necesitan instalar nada

2. **Desarrolladores**: Para hacer cambios:
   - Clonan el repositorio desde GitHub
   - Configuran su `.env` local con las mismas credenciales
   - Hacen cambios y prueban localmente
   - Hacen push a GitHub
   - Render despliega automáticamente

---

## 🔒 Seguridad en Producción

### MongoDB Atlas

- Usa contraseñas fuertes
- Configura IP whitelist si es posible (0.0.0.0/0 para acceso universal)
- Habilita encryption at rest (incluido en M0 gratuito)
- Habilita MongoDB Atlas backups (opcional, pago)

### Resend

- Usa tu propio dominio en producción
- Configura SPF, DKIM, DMARC records
- No expongas tu API key en el código

### Aplicación

- `SESSION_SECRET` debe ser único y largo (32+ caracteres)
- `NODE_ENV=production` en producción
- Usa HTTPS (Render lo incluye gratis)
- Rate limiting configurado
- Helmet para headers seguros

---

## 🔄 Actualizaciones

Para actualizar la aplicación:

1. Haz cambios en tu laptop
2. Commit y push a GitHub
3. Render detecta el cambio automáticamente
4. Reconstruye y despliega
5. Los cambios están en vivo en minutos

---

## 📊 Monitoreo

### Render Dashboard

- Ver logs en tiempo real
- Ver métricas de uso
- Ver historial de despliegues
- Configurar alertas

### MongoDB Atlas

- Ver métricas de base de datos
- Ver slow queries
- Ver storage usage
- Configurar alerts

---

## 💰 Costos

**Plan Gratuito:**
- MongoDB Atlas M0: 512 MB storage (gratis)
- Render: 750 hours/month (gratis)
- Resend: 3,000 emails/month (gratis)

**Total: $0/mes** para uso moderado del COAR.

---

## 🆘 Solución de Problemas

### Error: "MongoDB connection timeout"

**Causa:** IP whitelist no configurada correctamente

**Solución:**
- En MongoDB Atlas → Network Access
- Agrega `0.0.0.0/0` para permitir acceso desde cualquier lugar

### Error: "RESEND_API_KEY no está configurada"

**Causa:** Variable de entorno no configurada en Render

**Solución:**
- En Render dashboard → Environment
- Agrega `RESEND_API_KEY=re_tu_key`

### Error: "Build failed"

**Causa:** Error en build command o dependencias

**Solución:**
- Verifica logs en Render
- Asegúrate de que `npm run build` funciona localmente
- Verifica que todas las dependencias están en package.json

### Error: "Application not responding"

**Causa:** Puerto incorrecto o servidor no inicia

**Solución:**
- Verifica que el servidor escucha en el puerto correcto (Render usa PORT variable)
- Verifica logs de inicio
- Asegúrate de que `npm start` funciona

---

## 📞 Soporte

Si tienes problemas:
1. Revisa logs en Render dashboard
2. Revisa logs en MongoDB Atlas
3. Verifica variables de entorno
4. Revisa la documentación en docs/setup.md
