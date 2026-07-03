<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# COAR Community & Control Maestro

[![Node Version](https://img.shields.io/badge/node-%3E%3D22%20%3C27-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)

Plataforma de comunidad estudiantil para el COAR Cusco con foro anónimo, ranking de profesores, sistema de créditos, apuestas, objetos perdidos y más.

## � Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Documentación de API](#-documentación-de-api)
- [Testing](#-testing)
- [Seguridad](#-seguridad)
- [Despliegue](#-despliegue)
- [Scripts Disponibles](#-scripts-disponibles)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## � Características

### Funcionalidades Principales

- **Foro Anónimo**: Publicaciones y comentarios con categorías temáticas
- **Ranking de Profesores**: Sistema de calificaciones y reviews
- **Sistema de Créditos**: Compra de paquetes y leaderboard top 10
- **Apuestas**: Eventos de predicción con sistema de apuestas
- **Objetos Perdidos**: Publicación y búsqueda de objetos perdidos
- **Noticias/Diario Mural**: Noticias categorizadas por área
- **Mensajes Privados**: Sistema de mensajería entre usuarios
- **Notificaciones en Tiempo Real**: Socket.io para actualizaciones instantáneas
- **Panel de Admin**: Gestión para moderadores y administradores
- **Autenticación**: Registro con email institucional y verificación

### Características Técnicas

- **Arquitectura RESTful**: API diseñada siguiendo principios REST
- **Validación de Datos**: Zod para validación de formularios y schemas
- **Sistema de Sesiones**: Express Session con persistencia en MongoDB
- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **Logging Avanzado**: Winston para logging estructurado
- **Manejo de Errores**: Sistema centralizado de manejo de errores
- **TypeScript**: Tipado estático en todo el proyecto

## 🛠️ Stack Tecnológico

### Frontend
- React 18 con TypeScript
- React Router DOM para navegación
- TailwindCSS v4 para estilos
- Lucide React para iconos
- Framer Motion para animaciones
- Socket.io Client para tiempo real
- Zod para validación de formularios

### Backend
- Node.js con Express.js
- MongoDB con Mongoose
- Socket.io para WebSockets
- Express Session con connect-mongo
- Bcryptjs para hashing de contraseñas
- Resend para emails de verificación
- Winston para logging
- Helmet para seguridad
- Rate limiting con express-rate-limit

## 📋 Requisitos Previos

- **Node.js**: >= 22 < 27
- **MongoDB**: 4.4+ (local o en la nube)
- **npm**: >= 9.0
- **Cuenta de Resend**: Para envío de emails (obtén API key en resend.com)

## 🔧 Instalación y Configuración

Para una guía detallada de instalación, consulta [docs/setup.md](docs/setup.md).

Para desplegar en producción y que funcione desde cualquier lugar, consulta [docs/deployment.md](docs/deployment.md).

### Instalación Rápida

1. **Clonar el repositorio e instalar dependencias:**
   ```bash
   git clone <repository-url>
   cd coar-community-&-control-maestro
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env
   # Editar .env con tus configuraciones
   npm run generate:secret  # Generar SESSION_SECRET seguro
   ```

3. **Ejecutar en desarrollo:**
   ```bash
   npm run dev
   ```

4. **Construir para producción:**
   ```bash
   npm run build
   npm start
   ```

## 📁 Estructura del Proyecto

```
coar-community-&-control-maestro/
├── src/
│   ├── components/          # Componentes React
│   │   ├── AdminPanel.tsx
│   │   ├── Forum.tsx
│   │   ├── LoginNew.tsx
│   │   └── ...
│   ├── lib/                # Utilidades frontend
│   │   ├── utils.ts
│   │   └── validation.ts   # Esquemas Zod
│   ├── server/             # Backend
│   │   ├── models/        # Modelos Mongoose
│   │   │   ├── User.ts
│   │   │   ├── Forum.ts
│   │   │   ├── Community.ts
│   │   │   ├── Message.ts
│   │   │   └── Notification.ts
│   │   ├── routes/        # Rutas Express
│   │   │   ├── api.ts
│   │   │   ├── auth-new.ts
│   │   │   └── upload.ts
│   │   ├── middleware/    # Middleware Express
│   │   │   ├── auth.ts
│   │   │   ├── requireApiSession.ts
│   │   │   └── routeAsync.ts
│   │   ├── lib/          # Utilidades backend
│   │   │   ├── emailService.ts
│   │   │   ├── logger.ts
│   │   │   ├── httpError.ts
│   │   │   └── pagination.ts
│   │   ├── config/       # Configuraciones
│   │   └── constants/    # Constantes
│   ├── App.tsx           # Componente principal
│   └── main.tsx          # Punto de entrada
├── docs/                 # Documentación
│   ├── api.md            # Documentación de API
│   └── setup.md          # Guía de instalación
├── tests/                # Tests
│   ├── unit/             # Tests unitarios
│   ├── integration/      # Tests de integración
│   └── e2e/              # Tests end-to-end
├── .env.example          # Variables de entorno ejemplo
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── server.ts             # Punto de entrada del servidor
└── render.yaml           # Configuración para Render
```

## � Documentación de API

La documentación completa de la API está disponible en [docs/api.md](docs/api.md).

### Endpoints Principales

- **Autenticación**: `/api/auth/*` - Registro, login, logout, verificación
- **Usuarios**: `/api/users/*` - Gestión de usuarios y perfiles
- **Foro**: `/api/forum/*` - Publicaciones y comentarios
- **Profesores**: `/api/teachers/*` - Ranking y reviews
- **Apuestas**: `/api/bets/*` - Sistema de apuestas
- **Mensajes**: `/api/messages/*` - Mensajería privada
- **Admin**: `/api/admin/*` - Panel administrativo

## 🧪 Testing

El proyecto incluye suites de tests para garantizar la calidad del código.

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests unitarios
npm run test:unit

# Ejecutar tests de integración
npm run test:integration

# Ejecutar tests con coverage
npm run test:coverage
```

### Estructura de Tests

```
tests/
├── unit/              # Tests unitarios
│   ├── models/        # Tests de modelos Mongoose
│   ├── services/      # Tests de servicios (emailService, etc)
│   └── utils/         # Tests de utilidades
├── integration/       # Tests de integración
│   ├── routes/        # Tests de rutas API
│   └── middleware/    # Tests de middleware
└── e2e/              # Tests end-to-end
    └── flows/         # Flujos completos de usuario
```

## � Seguridad

### Medidas de Seguridad Implementadas

- **Autenticación**: Solo correos institucionales permitidos
- **Verificación**: Email verification requerida para activar cuenta
- **Sesiones**: Express Session con persistencia en MongoDB
- **Headers de Seguridad**: Helmet para headers HTTP seguros
- **Rate Limiting**: Protección contra ataques de fuerza bruta en endpoints sensibles
- **Hashing**: Contraseñas hasheadas con bcrypt (salt rounds: 10)
- **Validación**: Validación de inputs con Zod schemas
- **CORS**: Configuración de CORS restringida
- **Sanitización**: Escape de regex para prevenir injection attacks

## 🚀 Despliegue

### Plataformas Soportadas

#### Render
El proyecto incluye configuración para Render en `render.yaml`.

```bash
# Desplegar en Render
git push render main
```

#### Docker
```bash
# Construir imagen
docker build -t coar-community .

# Ejecutar contenedor
docker run -p 3002:3002 --env-file .env coar-community
```

### Variables de Entorno en Producción

- `NODE_ENV=production`
- `MONGODB_URI`: URL de MongoDB Atlas o instancia propia
- `SESSION_SECRET`: Generar con `npm run generate:secret` (mínimo 32 caracteres)
- `ALLOWED_EMAIL_DOMAINS`: Dominios permitidos separados por coma
- `RESEND_API_KEY`: API key de Resend para envío de emails
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Configuración Cloudinary
- `CLIENT_ORIGIN`: URL del frontend en producción

## 📝 Scripts Disponibles

### Desarrollo
- `npm run dev` - Iniciar servidor en desarrollo con hot reload
- `npm run build` - Construir para producción (frontend + backend)
- `npm start` - Iniciar servidor en producción
- `npm run lint` - Verificar tipos TypeScript

### Utilidades
- `npm run generate:secret` - Generar SESSION_SECRET seguro
- `npm run deploy:local` - Script de despliegue local

### Testing
- `npm test` - Ejecutar todos los tests
- `npm run test:unit` - Ejecutar tests unitarios
- `npm run test:integration` - Ejecutar tests de integración
- `npm run test:coverage` - Ejecutar tests con coverage report

## 🤝 Contribución

Para contribuir al proyecto, por favor lee [CONTRIBUTING.md](CONTRIBUTING.md).

### Proceso de Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios siguiendo [Conventional Commits](https://www.conventionalcommits.org/)
4. Push a la rama (`git push origin feature/nueva-feature`)
5. Abre un Pull Request con descripción detallada

### Código de Conducta

- Ser respetuoso con otros contribuidores
- Seguir los estándares de código del proyecto
- Escribir tests para nuevas funcionalidades
- Actualizar la documentación cuando sea necesario

## 📄 Licencia

Este proyecto es propiedad del COAR Cusco. Todos los derechos reservados.

## 📞 Soporte

Para reportar bugs o solicitar features, abre un issue en el repositorio.

## 🙏 Agradecimientos

- Comunidad estudiantil del COAR Cusco
- Contribuidores del proyecto
