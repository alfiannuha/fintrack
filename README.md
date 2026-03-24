# FinTrack PWA

Progressive Web App untuk pencatatan keuangan personal dengan shared wallet functionality.

## 🚀 Quick Deploy

Deploy to production in 5 minutes:

```bash
./deploy.sh
```

See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for detailed instructions.

## Tech Stack

- **Frontend**: Next.js 14+ (TypeScript, App Router, PWA)
- **Backend**: Go 1.26+ (Gin Framework)
- **Database**: MongoDB Atlas
- **UI**: Shadcn UI + Tailwind CSS

## Project Structure

```
fintrack/
├── frontend/          # Next.js application
├── backend/           # Go REST API
└── README.md
```

## Prerequisites

1. **Node.js** v18+ dan pnpm
2. **Go** v1.21+
3. **MongoDB Atlas** connection string

## Quick Start

### 1. Clone dan Setup

```bash
cd fintrack
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env dan isi MONGO_URI dengan connection string MongoDB Anda

# Install dependencies (otomatis saat build)
go mod tidy

# Build
go build -o bin/server ./cmd/main.go

# Run
./bin/server
# atau
go run ./cmd/main.go
```

Server akan berjalan di `http://localhost:8080`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Run development server
pnpm dev
```

Frontend akan berjalan di `http://localhost:3000`

## Environment Variables

### Backend (.env)

```bash
PORT=8080
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/fintrack
DB_NAME=fintrack
JWT_SECRET=your-secret-key-min-32-chars
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_VAPID_KEY=your-vapid-public-key
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Registrasi user baru |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/join` | Join wallet dengan kode |

## Development

### Frontend Commands

```bash
pnpm dev          # Development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linter
```

### Backend Commands

```bash
go run ./cmd/main.go          # Run server
go build -o bin/server .      # Build binary
```

## Deployment

### Frontend (Vercel)

1. Push code ke GitHub
2. Connect repository ke Vercel
3. Set environment variables di Vercel
4. Deploy otomatis pada setiap push

### Backend (Railway / Fly.io)

1. Buat akun di Railway.app atau Fly.io
2. Connect GitHub repository
3. Set environment variables
4. Deploy otomatis

### Database (MongoDB Atlas)

1. Buat cluster di [MongoDB Atlas](https://cloud.mongodb.com)
2. Dapatkan connection string
3. Whitelist IP addresses atau gunakan 0.0.0.0/0 untuk development

## Features

### Phase 1 - Setup & Authentication ✅
- [x] Project initialization
- [x] Authentication system (register, login, join)
- [x] JWT middleware
- [x] Invitation code generator
- [x] Database schema

### Phase 2 - Core Features (Coming Soon)
- [ ] Quick Transaction
- [ ] Dashboard dengan charts
- [ ] Category management
- [ ] Budget control
- [ ] Transaction history
- [ ] Monthly reports

### Phase 3 - Advanced Features (Coming Soon)
- [ ] Recurring transactions
- [ ] Auto categorization
- [ ] Financial insights
- [ ] OCR receipt

### Phase 4 - PWA & Polish (Coming Soon)
- [ ] Installable PWA
- [ ] Offline mode
- [ ] Push notifications
- [ ] Production deployment

## Documentation

See [Project Plan](./FinTrack_PWA_Project_Plan.txt) for detailed documentation.

## License

MIT License
