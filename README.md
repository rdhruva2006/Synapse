# AI Workflow Builder

A serverless SaaS application for building and executing AI workflows via a node-based visual interface.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React Flow, Tailwind CSS / Vanilla CSS, GraphQL (ws:// subscriptions)
- **Backend**: PostgreSQL (Database), Hasura (GraphQL Engine API), Node.js (Serverless Actions), Docker
- **Architecture**: Edge-based Graph Execution Engine

## Quickstart

### Prerequisites
- Docker Desktop
- Node.js 20+
- Nhost CLI (`npm i -g nhost`)

### 1. Start the Environment
```bash
# Start Postgres, Hasura, Next.js, and the Functions service
docker compose up --build -d
```

### 2. Apply Database Schema & Metadata
```bash
nhost metadata apply
nhost migrate apply
```

### 3. Seed Demo Data
```bash
cd scripts
npm install
npm run seed
```

### 4. Open the App
Navigate to [http://localhost:3000](http://localhost:3000)

---

## Environment Variables
Create a `.env` file in the root if you want to override defaults:
```env
HASURA_ADMIN_SECRET=myadminsecret
NEXT_PUBLIC_HASURA_ENDPOINT=http://localhost:8080/v1/graphql
NEXT_PUBLIC_HASURA_ADMIN_SECRET=myadminsecret
```

---

## Deploying

### Frontend (Vercel)
1. Push this repository to GitHub
2. Import project in Vercel
3. Set Root Directory to `next-app`
4. Add Environment Variables:
   - `NEXT_PUBLIC_HASURA_ENDPOINT` (Point to your production Hasura URL)
   - `NEXT_PUBLIC_HASURA_ADMIN_SECRET`

### Backend (Nhost Cloud or Self-Hosted)
1. Link project with `nhost link`
2. Push to GitHub — Nhost auto-deploys migrations, metadata, and serverless functions

## Running Tests
```bash
cd scripts
npm run test-permissions
```
