# NOTES-SHARING-SYSTEM-PROJECT-Notely-

Notely is a MERN Notes Sharing System where students can:
- Register/Login (bcrypt password hashing + JWT auth)
- Browse notes (search + filter)
- Upload notes (protected)
- Preview notes (PDF/image via MIME type)
- Download notes (protected + download tracking)
- View Profile (My Uploads + My Downloads)

## Tech Stack

- Frontend: React (Vite) + Tailwind CSS + Axios + React Router
- Backend: Node.js + Express + MongoDB (Mongoose) + JWT + Multer + bcryptjs

## Setup (Local)

### 1) Backend

Create `backend/.env` using `backend/.env.example`:

Required:
- `MONGODB_URI`
- `JWT_SECRET`

Run:

`cd backend`

`npm run dev`

Backend runs on `http://localhost:5000`.

### 2) Frontend

Create `frontend/.env` using `frontend/.env.example`.

Run:

`cd frontend`

`npm run dev`

Frontend runs on `http://localhost:5173`.

## API Endpoints (Backend)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/notes` (public list + search/filter)
- `GET /api/notes/:id` (public details)
- `POST /api/notes` (protected upload, form-data `file`)
- `GET /api/notes/:id/download` (protected download + tracking)
- `GET /api/me` (protected profile: user + uploads + downloads)
