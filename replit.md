# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains "LocalLink" — a hyper-local services marketplace mobile app (Expo React Native) with a full PostgreSQL Express API backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Mobile**: Expo React Native (SDK 54) with expo-router

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express 5 API server (port 8080, path /api)
│   │   └── src/
│   │       ├── app.ts           # Express app + CORS config
│   │       ├── index.ts         # Server entry
│   │       ├── middleware/auth.ts # JWT auth middleware
│   │       └── routes/
│   │           ├── auth.ts      # POST /auth/register, /auth/login, GET/PATCH /auth/me
│   │           ├── listings.ts  # CRUD for service listings
│   │           ├── requests.ts  # Service request booking flow
│   │           ├── conversations.ts # Chat conversations + messages
│   │           ├── reviews.ts   # Provider ratings & reviews
│   │           └── notifications.ts # In-app notifications
│   ├── locallink/          # Expo React Native mobile app
│   │   ├── app/
│   │   │   ├── (tabs)/     # Home, Map, Requests, Messages, Profile
│   │   │   ├── (auth)/     # login.tsx, register.tsx
│   │   │   ├── service/[id].tsx  # Service detail + booking modal
│   │   │   ├── request/[id].tsx  # Request detail + status flow
│   │   │   ├── chat/[id].tsx     # Chat screen
│   │   │   ├── create-listing.tsx
│   │   │   └── reviews/[providerId].tsx
│   │   ├── context/AppContext.tsx  # Global state + API integration
│   │   ├── lib/api.ts       # API client (fetch + JWT token management)
│   │   ├── shims/react-native-maps.web.js  # Web shim for maps
│   │   └── metro.config.js  # Web platform shim overrides
│   └── mockup-sandbox/     # Component preview server (port 8081)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks + custom-fetch.ts
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
│       └── src/schema/
│           ├── users.ts         # Users table + auth
│           ├── listings.ts      # Service listings
│           ├── requests.ts      # Service requests (with escrow fields)
│           ├── conversations.ts # Chat conversations + participants
│           ├── messages.ts      # Chat messages
│           ├── reviews.ts       # Ratings & reviews
│           └── notifications.ts # In-app notifications
└── scripts/
```

## Key Decisions

### API URL
- API server previewPath is `/api` (from `.replit-artifact/artifact.toml`)
- Mobile app constructs URL as `https://${EXPO_PUBLIC_DOMAIN}/api`
- CORS configured with `origin: true` to reflect request origin

### Authentication
- JWT tokens (30-day expiry), signed with `JWT_SECRET` env var
- Token stored in AsyncStorage on mobile
- `requireAuth` middleware validates Bearer tokens

### Database Schema (7 tables)
- `users` — profile, role (seeker/provider), rating, earnings
- `listings` — service listings with lat/lng, availability_days, tags
- `service_requests` — booking flow with escrow fields (flat columns)
- `conversations` + `conversation_participants` — chat threading
- `messages` — individual chat messages
- `reviews` — ratings with auto-update of provider/listing rating
- `notifications` — typed notification events

### Mobile Architecture
- `AppContext.tsx` is the global state, backed by API calls
- Seed listings shown until API data loads (fallback)
- Optimistic UI updates + background API sync
- Maps web shim at `shims/react-native-maps.web.js`; metro.config.js uses `resolveRequest` for web platform

### react-native-maps
- Pinned at exactly `1.18.0`
- NOT in app.json plugins array
- Web shim: `shims/react-native-maps.web.js`

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (required)
- `JWT_SECRET` — JWT signing secret (defaults to dev secret)
- `PORT` — Server port (required by API server workflow)
- `EXPO_PUBLIC_DOMAIN` — Set to `$REPLIT_DEV_DOMAIN` for API URL construction

## Design
- Primary: deep navy `#1B3A6B`
- Accent: coral `#FF6B47`
- Font: Inter (400, 500, 600, 700)
- Clean minimal modern aesthetic

## Currency
- All prices displayed in Indian Rupees (₹) — no USD

## Location
- Default map center: Mulund West, Mumbai (19.1726, 72.9538)
- Seed listings: 10 services in Mulund, Mumbai with INR prices
- User location stored in AsyncStorage (`@locallink:user_location`)
- Map radius filter: 1km / 2km (default) / 5km / 10km options
- Haversine formula used for distance calculation (km)

## App Flow
1. `app/index.tsx` — Landing page (unauthenticated)
2. `(auth)/login` or `(auth)/register` — Auth modal
3. `app/set-location.tsx` — Location pinning (after first login)
4. `(tabs)` — Main app with home, map, requests, messages, profile
