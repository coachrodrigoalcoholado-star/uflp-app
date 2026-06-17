# UFLP - Sistema de Gestión 🎓

Este proyecto es la plataforma de gestión académica y administrativa exclusiva para estudiantes certificados en **ECOA (Escuela de Coaching Ontológico Americano)** en convenio con la **UFLP (Universidad Fray Luca Paccioli)**.

---

## 🚀 Características Principales

- **Acceso y Registro Originales:** Sistema seguro de inicio de sesión y registro de alumnos integrado mediante NextAuth.
- **Gestión de Documentos:** Panel para subir comprobantes, pagos e información requerida para el diploma.
- **Mantenedor de Base de Datos Activa (Keep-Alive):** Endpoint automatizado `/api/health` conectado a UptimeRobot para evitar pausas por inactividad en el plan gratuito de Supabase.
- **Compilación Limpia:** Configuración optimizada en Next.js 16 para despliegues fluidos en Vercel.

---

## 🛠️ Tecnologías y Arquitectura

* **Frontend & Backend:** Next.js 16 (App Router, React 19)
* **Base de Datos:** PostgreSQL en Supabase
* **ORM:** Prisma Client
* **Autenticación:** NextAuth.js
* **Despliegue:** Vercel

---

## 📁 Estructura del Proyecto

* `src/app/` - Rutas de la aplicación (Páginas, APIs, etc.).
  * `(auth)/` - Rutas de autenticación originales (Login, Registro, Recuperar contraseña).
  * `api/health/` - Endpoint de monitoreo keep-alive.
  * `dashboard/` - Panel de usuario y gestor de pagos/documentos.
* `src/components/` - Componentes reutilizables de la interfaz.
* `src/lib/` - Clientes y configuraciones (Prisma, Supabase, etc.).
* `prisma/` - Esquema de la base de datos y migraciones.

---

## ⚙️ Configuración del Entorno (`.env`)

Para ejecutar el proyecto localmente, debes configurar las siguientes variables en un archivo `.env`:

```env
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
```

---

## 💻 Desarrollo Local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Generar el cliente de base de datos (Prisma):
   ```bash
   npx prisma generate
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

4. Compilar para producción:
   ```bash
   npm run build
   ```
