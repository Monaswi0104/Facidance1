# Facidance

Facidance is an AI-powered face recognition attendance system designed for universities and schools. It automates attendance tracking using advanced computer vision and provides comprehensive dashboards for administrators, teachers, and students.

## Features

- **AI Face Recognition:** Automatically track student attendance by scanning photos or live video feeds using InsightFace and OpenCV.
- **Role-based Dashboards:**
  - **Admin:** Manage departments, programs, courses, and overall system health.
  - **Teacher:** Manage classes, track attendance, and train the facial recognition model incrementally for new students.
  - **Student:** View personal attendance history, AI-powered attendance improvement tips (via Groq/Llama-3), and upload face samples.
- **Fast & Scalable Microservices:** The backend is split into independent FastAPI microservices.
- **Modern Frontend:** Built with Next.js and styled with a sleek, responsive dark-mode UI.

## Tech Stack

### Frontend
- **Framework:** Next.js (React)
- **Styling:** CSS Modules / Styled Components with custom themes
- **API Fetching:** React Query & native fetch

### Backend (Microservices)
- **Framework:** FastAPI (Python)
- **Database:** PostgreSQL
- **ORM:** Prisma Client Python
- **AI/CV:** InsightFace, OpenCV, NumPy
- **LLM Integration:** Groq (Llama-3.1-8b-instant) for personalized student advice

### Infrastructure & Deployment
- **Process Manager:** PM2 (runs the frontend and all 5 backend microservices locally)
- **Containers:** Docker (PostgreSQL database)
- **Networking:** Cloudflare Tunnels (exposing the local application to `facidance.xyz`)

## Architecture

The system consists of the following PM2-managed services:
1. `facidance-frontend`: Next.js UI (Port 3000)
2. `facidance-auth`: Authentication & JWT issuance (Port 8000)
3. `facidance-admin`: Administrator API (Port 8001)
4. `facidance-teacher`: Teacher API (Port 8002)
5. `facidance-student`: Student API (Port 8003)
6. `facidance-face`: Core computer vision & model training API (Port 8004)
7. `facidance-tunnel`: Cloudflare tunnel daemon

## Local Setup & Development

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Docker & Docker Compose
- PM2 (`npm install -g pm2`)

### 1. Database Setup
Start the PostgreSQL database using Docker:
```bash
docker-compose up -d
```
Run Prisma migrations to initialize the schema:
```bash
cd backend/common
prisma db push
```

### 2. Environment Variables
Ensure the following `.env` files are configured:
- Root `.env`: Contains `DATABASE_URL` and `GROQ_API_KEY`.
- Frontend `.env.local`: Contains API routing URLs.

### 3. Start the Application
You can start all microservices and the frontend simultaneously using PM2:
```bash
pm2 start ecosystem.config.js
```
To ensure the application starts automatically on system reboot:
```bash
pm2 save
pm2 startup
```

## Contributing
When contributing, ensure that all new endpoints are added to their respective microservice router and tested for async non-blocking execution.
