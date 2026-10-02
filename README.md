# food+

SaaS para identificar alérgenos en alimentos por código de barras o nombre comercial.

## Estructura

```
food+/
├── docker-compose.yml        # PostgreSQL 16 para desarrollo
├── backend/                  # Node + Express 5 + TypeScript + Prisma
│   ├── prisma/schema.prisma  # User, UserAllergy, ScanHistory, RefreshToken
│   └── src/
│       ├── config/           # env validado con Zod
│       ├── controllers/      # capa HTTP (req/res)
│       ├── routes/           # definición de endpoints
│       ├── services/         # lógica de negocio
│       ├── middlewares/      # auth, validación, rate limit, errores
│       ├── validators/       # esquemas Zod
│       ├── lib/              # prisma, utilidades
│       ├── app.ts            # helmet, CORS, cookies, rate limit
│       └── server.ts
└── frontend/                 # Vite + React 19 + Tailwind v4
    └── src/{components,pages,services,hooks,context,types}
```

## Puesta en marcha

1. `npm install` (en la raíz; instala ambos workspaces)
2. `cp backend/.env.example backend/.env` y genera secretos JWT reales
3. Base de datos: `npm run db:up` (Docker) o apunta `DATABASE_URL` a cualquier PostgreSQL
4. `npm run db:migrate` (crea las tablas)
5. En dos terminales: `npm run dev:backend` y `npm run dev:frontend`
6. Abre http://localhost:5173

## API (backend)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | — | Estado de la API y la BD |
| GET | `/api/allergens` | — | Catálogo de alérgenos (clave, etiqueta, alias) |
| POST | `/api/auth/register` | — | `{ email, password, name? }` → crea cuenta e inicia sesión |
| POST | `/api/auth/login` | — | `{ email, password }` |
| POST | `/api/auth/refresh` | cookie refresh | Rota el refresh token y renueva el access token |
| POST | `/api/auth/logout` | — | Revoca la sesión y borra cookies |
| GET | `/api/auth/me` | ✔ | Perfil del usuario autenticado |
| GET/PATCH | `/api/users/me` | ✔ | Ver / actualizar perfil (`{ name }`) |
| GET/PUT | `/api/users/me/allergies` | ✔ | `{ allergies: ["gluten", "lactosa", "maní"] }` (reemplaza la lista) |
| POST | `/api/scan-ingredients` | ✔ | Foto de ingredientes (multipart, campo `image`) → OCR + análisis. Consume 1 escaneo |
| GET | `/api/products/search?q=&page=` | ✔ | Búsqueda por nombre con el estado de cada resultado. Consume 1 escaneo |
| GET | `/api/products/barcode/:barcode` | ✔ | Detalle + análisis de un resultado de búsqueda. Consume 1 escaneo |

Estados del análisis: `SAFE`, `DANGER`, `CAUTION` (trazas), `UNKNOWN` (sin datos de ingredientes).

Plan gratuito: `FREE_SCAN_LIMIT` escaneos (5) por tanda; la tanda empieza con el primer escaneo y se recarga `SCAN_WINDOW_HOURS` (5) horas después. Al agotarlos la API responde `402 SCAN_LIMIT_REACHED` y el frontend muestra el paywall con una cuenta regresiva hasta la recarga (`scansResetAt` en el perfil). Si cambias estos valores, actualiza también `frontend/src/config/plan.ts`.

OCR: tesseract.js (español + inglés). La primera vez descarga los modelos (~15 MB) en `backend/.ocr-cache/`.

Tests del motor de alérgenos: `npm test -w backend`
