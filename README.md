# TableTap — Scan. Tap. Dine.

A complete SaaS QR-based restaurant ordering platform built with Next.js 14, TypeScript, Node.js/Express, PostgreSQL, and Socket.io.

---

## Architecture

```
tabletap/
├── backend/           # Express API + Socket.io  → :4000
├── frontend/          # Customer ordering app     → :3000
├── admin-dashboard/   # Restaurant management     → :3001
├── kitchen-display/   # Kitchen order board       → :3002
├── database/          # SQL schema + seed data
└── docker/            # Nginx reverse proxy config
```

All four apps live in a single **npm workspace** monorepo.

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+ (or Docker)
- A free [Cloudinary](https://cloudinary.com) account

### 1. Clone & install

```bash
git clone https://github.com/your-org/tabletap.git
cd tabletap
npm install          # installs all workspace packages
```

### 2. Environment variables

```bash
cp .env.example .env
# Now edit .env with your real values (see Environment Variables section below)
```

### 3. Set up the database

```bash
# Create the database
createdb tabletap

# Run schema migrations
psql -d tabletap -f database/schema.sql

# Seed with demo data (The Crimson Fork restaurant)
psql -d tabletap -f database/seed.sql
```

### 4. Start all services

```bash
npm run dev
```

This runs all four apps and the backend concurrently using `concurrently`.

| Service          | URL                         |
|------------------|-----------------------------|
| Customer App     | http://localhost:3000        |
| Admin Dashboard  | http://localhost:3001        |
| Kitchen Display  | http://localhost:3002        |
| Backend API      | http://localhost:4000        |

**Demo credentials** (from seed data):
- Email: `owner@thecrimsonfork.com`
- Password: `password123`

---

## Docker Compose (Recommended for Production-like Setup)

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your real values

# Start all services
docker-compose up --build

# Or in detached mode
docker-compose up -d --build
```

Access the platform via Nginx at **http://localhost** (port 80).

The compose stack includes:
- PostgreSQL 15
- Redis 7 (session store / rate limiting)
- Backend API
- Frontend customer app
- Admin dashboard
- Kitchen display
- Nginx reverse proxy

---

## Environment Variables

Copy `.env.example` to `.env` in the project root, then fill in each value:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/tabletap` |
| `JWT_SECRET` | Secret for signing access tokens (≥32 chars) | `your-super-secret-key` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (≥32 chars) | `another-secret-key` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `my-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdef...` |
| `NEXT_PUBLIC_API_URL` | Backend URL (used by frontends) | `http://localhost:4000` |
| `NEXT_PUBLIC_FRONTEND_URL` | Customer app URL (for QR generation) | `http://localhost:3000` |
| `NEXT_PUBLIC_KITCHEN_URL` | Kitchen display URL | `http://localhost:3002` |

---

## Deployment

### Option A — Vercel + Railway (Recommended)

#### 1. Deploy the Backend to Railway

1. Create a new project on [Railway](https://railway.app).
2. Add a **PostgreSQL** plugin — Railway will provide `DATABASE_URL`.
3. Add a **Redis** plugin.
4. Create a new service from the `backend/` folder (or connect your GitHub repo and set the root directory to `backend/`).
5. Add all backend environment variables in the Railway dashboard.
6. Deploy — Railway will run `npm run build && npm start`.

#### 2. Run Database Migrations

From the Railway dashboard, open a shell on the backend service:

```bash
psql $DATABASE_URL -f database/schema.sql
psql $DATABASE_URL -f database/seed.sql
```

Or use the Railway CLI:

```bash
railway run psql $DATABASE_URL -f database/schema.sql
```

#### 3. Deploy Frontends to Vercel

Deploy each Next.js app separately:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy customer app
cd frontend
vercel --prod

# Deploy admin dashboard
cd ../admin-dashboard
vercel --prod

# Deploy kitchen display
cd ../kitchen-display
vercel --prod
```

Set the following environment variables in each Vercel project's settings:

| Project | Required Variables |
|---------|-------------------|
| `frontend` | `NEXT_PUBLIC_API_URL` |
| `admin-dashboard` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_KITCHEN_URL` |
| `kitchen-display` | `NEXT_PUBLIC_API_URL` |

After deploying, update `NEXT_PUBLIC_FRONTEND_URL` on the backend to point to the production customer app URL (needed for correct QR code generation).

---

### Option B — Self-hosted with Docker

1. Provision a VPS (e.g., DigitalOcean Droplet, AWS EC2).
2. Install Docker and Docker Compose.
3. Clone the repo, create `.env`, and run:

```bash
docker-compose -f docker-compose.yml up -d --build
```

4. Point your domain's DNS A record to the server IP.
5. Set up SSL with Certbot / Let's Encrypt or use Cloudflare proxying.

---

## Setting Up Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. From your dashboard, copy the **Cloud name**, **API Key**, and **API Secret**.
3. Paste them into `.env` (or Railway/Vercel environment settings).
4. Menu item images and QR codes are automatically uploaded to Cloudinary.

If Cloudinary credentials are missing, the QR generator falls back to base64 data URLs which work fine locally but are not persisted.

---

## QR Code Flow

1. Admin creates a table via the **Tables** page in the admin dashboard.
2. The backend generates a QR code linking to:
   ```
   {NEXT_PUBLIC_FRONTEND_URL}/r/{restaurantId}/table/{tableNumber}
   ```
3. Admin downloads the QR PNG and prints/places it on the physical table.
4. Customer scans → lands on the restaurant's menu page → orders without login.

---

## Real-time Architecture

Socket.io rooms are used for targeted broadcasts:

| Room | Who joins | Events received |
|------|-----------|-----------------|
| `restaurant:{id}` | Admin dashboard, Kitchen display | `order:new`, `order:statusUpdated` |
| `order:{id}` | Customer order status page | `order:statusUpdated` |

The customer status page also polls the API every 15 seconds as a fallback.

---

## API Reference

Base URL: `{API_URL}/api`

### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register restaurant + owner account |
| POST | `/auth/login` | Login, returns access + refresh tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET  | `/auth/me` | Get current user info |

### Menu (public)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/menu/:restaurantId` | Full menu with categories and items |
| GET | `/menu/:restaurantId/items/:itemId` | Single item detail with options |

### Menu (admin — requires JWT)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/menu/categories` | Create category |
| PUT | `/menu/categories/:id` | Update category |
| DELETE | `/menu/categories/:id` | Delete category |
| POST | `/menu/items` | Create item (multipart w/ image) |
| PUT | `/menu/items/:id` | Update item |
| DELETE | `/menu/items/:id` | Delete item |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| POST | `/orders` | Place order (public) |
| GET | `/orders?restaurantId=&statuses=` | List orders (admin) |
| GET | `/orders/:id` | Get single order (public) |
| PATCH | `/orders/:id/status` | Update order status (admin/kitchen) |

### Tables
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tables/:restaurantId` | List tables |
| POST | `/tables` | Create table |
| GET | `/tables/:id/qr` | Get/generate QR for table |
| DELETE | `/tables/:id` | Delete table |

### Analytics (admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/analytics/:restaurantId/daily` | Today's revenue, orders, hourly breakdown |
| GET | `/analytics/:restaurantId/popular?days=14` | Top menu items |
| GET | `/analytics/:restaurantId/trend` | 30-day revenue trend |

---

## License

MIT
