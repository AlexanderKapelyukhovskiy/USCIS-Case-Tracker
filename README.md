## USCIS Tracking (V2)

Database‑backed Next.js application for tracking USCIS case JSON responses per member & receipt.

### Features
- Google OAuth (NextAuth) authentication.
- Per user members and cases (receipt + type: AP, EAD, I485, I485J).
- Sync fetches three endpoints per case and stores only changed responses (sha256 hash).
- Case details page shows diff vs previous version for each endpoint.

### Local Development
1. Install deps: `npm install`
2. Create `.env.local`:
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_a_strong_random_string
DATABASE_URL=postgresql://user:password@localhost:5432/uscis?schema=public
```
3. Run migrations: `npx prisma migrate dev`
4. Start dev server: `npm run dev`
5. Sign in with Google; add members & cases; sync.

### Sync Endpoints Queried
- Cases: `https://my.uscis.gov/account/case-service/api/cases/{RECEIPT}`
- Receipt info: `https://my.uscis.gov/secure-messaging/api/case-service/receipt_info/{RECEIPT}`
- Case status: `https://my.uscis.gov/account/case-service/api/case_status/{RECEIPT}`

### Deployment (Vercel + Postgres)
1. Provision Vercel Postgres; use `POSTGRES_PRISMA_URL` as `DATABASE_URL` or set datasource to that env var.
2. Set env vars (Production & Preview): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`.
3. Build script runs: `prisma migrate deploy && next build` (configure in `package.json`).
4. After deploy you can seed data via a script using Prisma if needed.

### Prisma
Regenerate client: `npx prisma generate`.
Apply new migrations: `npx prisma migrate dev` (local) / `prisma migrate deploy` (production).

### Notes
- Root `/` shows the v2 dashboard; case details under `/case/[id]`.
- Removed legacy file-based implementation and person folders.

### License
Private/internal use.
