# Architecture Flow Map (One Page)

This is the end-to-end implementation map for the current portfolio stack.

## 1) Runtime Surfaces

1. Public portfolio app: `app/(portfolio)/*`
2. Sanity Studio CMS: `app/(sanity)/studio/[[...tool]]/*`
3. API/server actions:
   - `actions/create-session.ts` (ChatKit session)
   - `actions/submit-contact-form.ts` (contact submission)

---

## 2) Global App Shell (Portfolio)

Entry:

1. `app/(portfolio)/layout.tsx`

Global providers and services:

1. `ClerkProvider` (auth context)
2. `ThemeProvider` (theme context for UI/client effects)
3. `SidebarProvider` (chat sidebar state)
4. `SanityLive` (live content updates)
5. ChatKit script tag (client runtime dependency)

Layout slots:

1. Main content via `SidebarInset`
2. Right sidebar via `AppSidebar` (hosts AI chat)
3. Floating chat trigger via `SidebarToggle`

---

## 3) Portfolio Page Composition

Request path:

1. `app/(portfolio)/page.tsx`
2. `components/PortfolioContent.tsx`
3. Ordered section render from `components/sections/*.tsx`

Section pattern:

1. Server component defines GROQ query with `defineQuery`
2. Fetches with `sanityFetch(...)` from `sanity/lib/live.ts`
3. Renders content + optional client subcomponents (animations/interactions)

---

## 4) Sanity Read Flow (CMS -> UI)

Config and schema:

1. Env contract: `sanity/env.ts`
2. Studio config: `sanity.config.ts`
3. Schemas: `sanity/schemaTypes/*`
4. Studio nav structure: `sanity/structure.ts`

Runtime read flow:

1. Section server component runs GROQ query
2. `sanityFetch` uses `defineLive(...)` with `client`
3. Returned data is rendered server-side
4. `SanityLive` keeps subscribed content fresh

Images:

1. `urlFor(...)` from `sanity/lib/image.ts`
2. Remote host allowlist in `next.config.ts`

---

## 5) Sanity Studio Flow (Authoring)

Studio route:

1. `app/(sanity)/studio/[[...tool]]/page.tsx` -> `<NextStudio config={...} />`

Studio behavior:

1. Uses schema registry in `sanity/schemaTypes/index.ts`
2. Uses custom sidebar/document grouping in `sanity/structure.ts`
3. Includes Vision plugin for GROQ validation

---

## 6) Clerk Auth Flow

Middleware:

1. `proxy.ts` -> `clerkMiddleware()`

Client gating:

1. `components/SidebarToggle.tsx`: signed-in opens chat, signed-out opens sign-in modal
2. `components/ProfileImage.tsx`: same gating on profile CTA

Server protection:

1. `actions/create-session.ts` calls `auth()`
2. Rejects if no `userId`

---

## 7) AI Chat Flow (OpenAI ChatKit)

UI host:

1. `components/app-sidebar.tsx` renders `ChatWrapper`
2. `components/chat/ChatWrapper.tsx` fetches profile data from Sanity
3. `components/chat/Chat.tsx` configures and mounts `ChatKit`

Session bootstrap:

1. ChatKit requests client secret via `createSession()`
2. `actions/create-session.ts` validates:
   - Clerk auth user
   - `OPENAI_API_KEY`
   - workflow ID env
3. Server action calls `POST https://api.openai.com/v1/chatkit/sessions`
4. Returns `client_secret` to ChatKit client

---

## 8) Contact Form Write Flow (UI -> Server Action -> Sanity)

Client:

1. `components/sections/ContactForm.tsx`
2. On submit, packages `FormData`
3. Calls `submitContactForm(formData)`

Server action:

1. `actions/submit-contact-form.ts`
2. Validates required fields
3. Uses `serverClient.create(...)` with `_type: "contact"`

CMS persistence and review:

1. Schema: `sanity/schemaTypes/contact.ts` (status, notes, timestamps)
2. Studio structure filters:
   - New submissions
   - Archived submissions

---

## 9) UI System Flow (shadcn + Tailwind + Motion)

Design system foundation:

1. `components.json` alias map + registry config
2. `app/globals.css` tokens + Tailwind v4 imports
3. `lib/utils.ts` (`cn`) + `cva` variants

Primitive and feature UI:

1. Core primitives in `components/ui/*`
2. Sidebar state machine in `components/ui/sidebar.tsx`
3. Motion-heavy features:
   - `components/ui/animated-testimonials.tsx`
   - `components/ui/comet-card.tsx`
   - `components/ui/world-map.tsx`
   - `components/world-map-demo.tsx`

---

## 10) End-to-End Request Sequences

### Sequence A: Portfolio page load

1. Browser requests `/`
2. Layout providers initialize
3. `PortfolioContent` renders section tree
4. Each section fetches Sanity content server-side
5. HTML streams to client
6. Client components hydrate (sidebar/chat triggers/animations)

### Sequence B: Open AI chat (signed in)

1. User clicks chat trigger
2. Sidebar opens and mounts `ChatKit`
3. ChatKit calls `createSession()` server action
4. Server validates Clerk user and OpenAI config
5. Server returns ChatKit client secret
6. Chat session starts

### Sequence C: Contact submit

1. User submits contact form
2. Client sends `FormData` to server action
3. Server validates and writes Sanity `contact` document
4. Success/error message returned to UI
5. Submission appears in Studio contact lists

---

## 11) Replication Blueprint (Minimal Order)

1. Build app shell + providers (`ClerkProvider`, theme, layout).
2. Wire Sanity (env, studio route, schemas, client/live helpers).
3. Build section pattern (server component + `defineQuery` + `sanityFetch`).
4. Add sidebar state system and auth-gated chat entry points.
5. Add ChatKit server session action and client chat surface.
6. Add form server action pipeline to CMS document writes.
7. Layer motion/visual components last.
