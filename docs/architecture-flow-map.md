# Architecture Flow Map

> **Cross-references:** See `core-js-ts-next-sanity-clerk-chatkit-notes.md` for concept explanations.
> See `feature-audit-checklist.md` to inspect and replicate each feature independently.

---

## Stack at a Glance

| Layer | Technology | Role |
|---|---|---|
| Framework | Next.js 14 App Router | Routing, server components, server actions |
| CMS | Sanity v3 | Content authoring, live reads, document writes |
| Auth | Clerk | Sign-in, session, user identity |
| AI Chat | OpenAI ChatKit | AI "twin" chat embedded in sidebar |
| UI System | shadcn/ui + Tailwind v4 | Component primitives + design tokens |
| Animation | Framer Motion + Aceternity | Visual flair on sections |
| Hosting | (deployment target) | — |

> **Why App Router?** Server components allow each portfolio section to fetch its own CMS data without a client-side loading state. Client components are used only where interactivity is required.

---

## 1) Runtime Surfaces

| Surface | Route | Description |
|---|---|---|
| Public portfolio | `app/(portfolio)/*` | Visitor-facing site |
| Sanity Studio | `app/(sanity)/studio/[[...tool]]/*` | Author CMS UI (protected) |
| Server actions | `actions/*.ts` | Backend logic without a dedicated API route |

> **Why route groups?** `(portfolio)` and `(sanity)` are Next.js route groups — they share a segment in the filesystem but the parentheses are stripped from the URL. This lets the two apps have separate layouts without interfering with each other.

---

## 2) Global App Shell

**Entry:** `app/(portfolio)/layout.tsx`

```
ClerkProvider                ← auth context for entire tree
  ThemeProvider              ← light/dark/system theme
    SidebarProvider          ← chat sidebar open/closed state
      SanityLive             ← subscribes to live CMS updates
        SidebarInset         ← main content slot
        AppSidebar           ← right sidebar (hosts AI chat)
        SidebarToggle        ← floating chat trigger button
```

> **Why nest providers this way?** Each provider only wraps what depends on it. `ClerkProvider` is outermost because auth state is needed by both chat and the sidebar toggle. `SanityLive` is a lightweight subscription component, not a heavy provider.

---

## 3) Portfolio Page Composition

```
app/(portfolio)/page.tsx          ← thin entry, delegates everything
  PortfolioContent.tsx            ← orders sections
    sections/HeroSection.tsx
    sections/AboutSection.tsx
    sections/ProjectsSection.tsx
    sections/CertificationsSection.tsx
    sections/TestimonialsSection.tsx
    sections/ContactSection.tsx   ← includes ContactForm client component
```

**Section pattern (repeated for every section):**

1. Server component defines typed GROQ query with `defineQuery`.
2. Calls `sanityFetch(query)` — runs server-side, never exposes API tokens.
3. Renders data as HTML, plus optional `"use client"` sub-components for animation.

> **Why keep the top-level page thin?** It makes section order easy to change in one place (`PortfolioContent`) and keeps each section independently testable.

---

## 4) Sanity Read Flow

```
Sanity dataset (cloud)
  ↓
section server component (GROQ query via defineQuery)
  ↓
sanityFetch() in sanity/lib/live.ts
  ↓
Server-rendered HTML → streamed to browser
  ↑
SanityLive component keeps subscribed content fresh (websocket)
```

**Config chain:**

```
sanity/env.ts          ← validates required env vars
sanity.config.ts       ← studio config (projectId, dataset, schema, plugins)
sanity/schemaTypes/*   ← document models
sanity/structure.ts    ← studio navigation/grouping
sanity/lib/client.ts   ← base read client
sanity/lib/live.ts     ← wraps client with defineLive → exports sanityFetch + SanityLive
sanity/lib/serverClient.ts ← write-capable client (server-only)
sanity/lib/image.ts    ← urlFor() image URL builder
```

**Images:** `urlFor(source).width(x).url()` → `cdn.sanity.io`. Remote host must be allowlisted in `next.config.ts`.

---

## 5) Sanity Studio Flow

```
app/(sanity)/studio/[[...tool]]/page.tsx
  → <NextStudio config={sanityConfig} />
      → loads schemaTypes/index.ts  (all registered document types)
      → loads structure.ts          (custom nav, filtered views, singletons)
      → Vision plugin               (live GROQ query runner for debugging)
```

---

## 6) Clerk Auth Flow

```
proxy.ts (Next middleware)
  → clerkMiddleware()         ← runs on every matched route
  → attaches auth state to request

ClerkProvider (layout.tsx)
  → exposes auth context to all children

UI gating:
  SidebarToggle.tsx           ← signed-in → opens chat | signed-out → opens sign-in modal
  ProfileImage.tsx            ← same pattern

Server protection:
  actions/create-session.ts
    const { userId } = await auth()
    if (!userId) throw                ← rejects unauthenticated requests
```

> **Why Clerk over NextAuth?** Clerk handles hosted UI (sign-in modal, user profile), session management, and server-side `auth()` with minimal setup. No database needed for users.

---

## 7) AI Chat Flow (OpenAI ChatKit)

```
User clicks SidebarToggle (must be signed in)
  ↓
AppSidebar mounts ChatWrapper
  ↓
ChatWrapper (server component)
  → fetches profile data from Sanity  ← personalizes the AI system prompt
  → renders Chat.tsx (client component)
        ↓
        ChatKit mounts, calls createSession()
              ↓
              actions/create-session.ts (server action)
                → auth()                    ← validates Clerk session
                → checks OPENAI_API_KEY     ← server-only env var
                → checks CHATKIT_WORKFLOW_ID
                → POST /v1/chatkit/sessions → OpenAI
                → returns client_secret
              ↓
        ChatKit uses client_secret to start session
```

> **Why a server action for the session?** The `OPENAI_API_KEY` must never reach the browser. The server action acts as a secure proxy — it validates the user, then exchanges credentials with OpenAI server-to-server.

---

## 8) Contact Form Write Flow

```
ContactForm.tsx (client component)
  → user fills form, clicks submit
  → event.preventDefault()
  → packages FormData
  → calls submitContactForm(formData) (server action)
        ↓
        actions/submit-contact-form.ts
          → validates required fields
          → serverClient.create({ _type: "contact", ...fields })
                ↓
                Sanity dataset stores contact document
                  ↓
                  Sanity Studio → structure.ts exposes filtered views:
                    "New Submissions"
                    "Archived Submissions"
```

---

## 9) UI System Flow

```
components.json          ← alias map (@/components/ui) + shadcn registry config
app/globals.css          ← @theme inline (Tailwind v4 tokens) + :root CSS vars
lib/utils.ts             ← cn() helper (clsx + tailwind-merge) + cva

components/ui/*          ← shadcn primitives (Button, Input, Sheet, etc.)
components/ui/sidebar.tsx ← full sidebar state machine (context, mobile/desktop, keyboard)

Motion-heavy UI (Aceternity):
  components/ui/animated-testimonials.tsx
  components/ui/comet-card.tsx
  components/ui/world-map.tsx
  components/ui/background-ripple-effect.tsx
  components/ui/layout-text-flip.tsx
```

> **Why shadcn over a component library?** shadcn copies source into your repo — you own the code, can customize freely, and aren't locked to a versioned package's decisions.

---

## 10) End-to-End Request Sequences

### A — Portfolio page load

```
Browser GET /
  → Next.js matches app/(portfolio)/page.tsx
  → Layout providers initialize (Clerk, Theme, Sidebar, SanityLive)
  → PortfolioContent renders sections in order
  → Each section runs its GROQ query server-side (no client waterfall)
  → Streamed HTML reaches browser
  → Client components hydrate (sidebar toggle, animations, chat trigger)
```

### B — Open AI chat (signed in)

```
User clicks SidebarToggle
  → Sidebar opens
  → ChatWrapper fetches Sanity profile (server)
  → Chat.tsx mounts ChatKit (client)
  → ChatKit calls createSession() server action
  → Server: validate Clerk user + env → call OpenAI → return client_secret
  → ChatKit initializes session with secret
  → Chat is live
```

### C — Contact form submit

```
User submits ContactForm
  → FormData sent to submitContactForm server action
  → Server validates fields
  → serverClient.create({ _type: "contact" }) writes to Sanity
  → Success/error returned to UI
  → Document appears in Studio "New Submissions" view
```

---

## 11) Replication Blueprint (Minimal Order)

Build in this order to avoid dependency problems:

1. **Shell** — Next.js + TypeScript + Tailwind v4 + shadcn aliases + `ClerkProvider` + basic layout.
2. **Sanity read** — env vars, `sanity.config.ts`, schemas, studio route, `client.ts`, `live.ts`, `SanityLive`.
3. **First section** — prove the `defineQuery` + `sanityFetch` + server component pattern works end-to-end.
4. **Sidebar + auth gates** — `SidebarProvider`, `SidebarToggle`, Clerk middleware + sign-in modal.
5. **ChatKit** — `create-session.ts` server action, `ChatWrapper`, `Chat.tsx`, mount in sidebar.
6. **Contact form** — `ContactForm.tsx` client component, `submit-contact-form.ts`, `serverClient`, contact schema.
7. **Remaining sections** — follow the same section pattern.
8. **Motion/Aceternity** — layer in last so they don't block core functionality.
