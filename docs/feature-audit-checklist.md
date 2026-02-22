<!--  @LIC Web Solutions Audit Checklist -->

# Feature Audit Checklist (Portfolio Stack)

Use this file to inspect each feature implementation independently and replicate it in future projects.

## How to use this checklist

1. Pick one feature area.
2. Read files in the exact order listed.
3. Verify behavior with the audit checks.
4. Record notes in the "Replication Notes" block for that feature.

---

## 1) Sanity CMS

### Read order

1. `sanity/env.ts`
2. `sanity.config.ts`
3. `app/(sanity)/studio/[[...tool]]/page.tsx`
4. `sanity/schemaTypes/index.ts`
5. `sanity/schemaTypes/*.ts`
6. `sanity/structure.ts`
7. `sanity/lib/client.ts`
8. `sanity/lib/live.ts`
9. `sanity/lib/serverClient.ts`
10. `sanity/lib/image.ts`

### Audit checks

- [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are required and validated.
- [ ] Studio is mounted at `/studio` and loads config from `sanity.config.ts`.
- [ ] `schemaTypes/index.ts` includes every required document type.
- [ ] Singleton docs are modeled in structure (e.g. profile/site settings).
- [ ] Read path uses `sanityFetch` (`next-sanity/live`) in server components.
- [ ] Write path (forms/actions) uses `serverClient`.
- [ ] Image rendering uses `urlFor(...)` and `next.config.ts` allows `cdn.sanity.io`.

### Replication notes

- Notes:
- Gaps:
- Reusable pattern:

---

## 2) Clerk Authentication

### Read order

1. `proxy.ts`
2. `app/(portfolio)/layout.tsx`
3. `components/SidebarToggle.tsx`
4. `components/ProfileImage.tsx`
5. `actions/create-session.ts`

### Audit checks

- [ ] Clerk middleware is enabled globally in `proxy.ts`.
- [ ] App tree is wrapped with `ClerkProvider`.
- [ ] UI branches correctly for signed-in vs signed-out users.
- [ ] Protected server actions use `auth()` and reject unauthenticated access.
- [ ] Client sign-in entry points are explicit (`SignInButton` or `openSignIn`).

### Replication notes

- Notes:
- Gaps:
- Reusable pattern:

---

## 3) shadcn/ui + Tailwind v4 + TypeScript

### Read order

1. `components.json`
2. `app/globals.css`
3. `tsconfig.json`
4. `lib/utils.ts`
5. `components/ui/*`
6. `components/ui/sidebar.tsx`

### Audit checks

- [ ] `components.json` alias `"ui": "@/components/ui"` is present.
- [ ] Tailwind v4 imports exist in `app/globals.css`.
- [ ] Theme tokens are defined with CSS variables.
- [ ] TypeScript path alias `@/*` is configured.
- [ ] UI primitives import `cn` and follow consistent variant patterns (`cva` where needed).
- [ ] Complex UI state (sidebar) is encapsulated in a provider + hook.

### Replication notes

- Notes:
- Gaps:
- Reusable pattern:

---

## 4) Aceternity / Motion Components

### Read order

1. `components.json` (registry config)
2. `components/ui/comet-card.tsx`
3. `components/ui/animated-testimonials.tsx`
4. `components/ui/background-ripple-effect.tsx`
5. `components/ui/layout-text-flip.tsx`
6. `components/ui/world-map.tsx`
7. `components/world-map-demo.tsx`

### Usage references

1. `components/sections/CertificationsSection.tsx`
2. `components/sections/TestimonialsSection.tsx`
3. `components/sections/HeroSection.tsx`
4. `components/sections/ContactSection.tsx`

### Audit checks

- [ ] Motion-based components are client components (`"use client"`).
- [ ] Animation dependencies exist (`motion`, optional libs like `dotted-map`).
- [ ] Visual components are isolated under `components/ui`.
- [ ] Feature sections consume UI components without duplicating animation logic.

### Replication notes

- Notes:
- Gaps:
- Reusable pattern:

---

## 5) OpenAI ChatKit ("AI Twin")

### Read order

1. `lib/config.ts`
2. `actions/create-session.ts`
3. `components/chat/Chat.tsx`
4. `components/chat/ChatWrapper.tsx`
5. `components/app-sidebar.tsx`
6. `app/(portfolio)/layout.tsx`

### Audit checks

- [ ] `OPENAI_API_KEY` is server-only and not exposed to client.
- [ ] Workflow ID is sourced from env and validated.
- [ ] Session creation is server action only.
- [ ] Chat UI obtains secret via `createSession()`.
- [ ] Sidebar integration is decoupled from chat internals.
- [ ] Chat entry is auth-gated via Clerk in UI.

### Replication notes

- Notes:
- Gaps:
- Reusable pattern:

---

## 6) Contact Form to CMS Write Pipeline

### Read order

1. `components/sections/ContactForm.tsx`
2. `actions/submit-contact-form.ts`
3. `sanity/lib/serverClient.ts`
4. `sanity/schemaTypes/contact.ts`
5. `sanity/structure.ts`

### Audit checks

- [ ] Client form submits through one server action.
- [ ] Required fields are validated server-side.
- [ ] Server action creates typed Sanity document (`_type: "contact"`).
- [ ] Contact schema supports workflow state (`new`, `archived`).
- [ ] Studio structure exposes filtered views by status.

### Replication notes

- Notes:
- Gaps:
- Reusable pattern:

---

## 7) Section Composition Pattern (App Router)

### Read order

1. `app/(portfolio)/page.tsx`
2. `components/PortfolioContent.tsx`
3. `components/sections/*.tsx`

### Audit checks

- [ ] Top-level page is thin and delegates composition.
- [ ] Each section owns its own query and rendering.
- [ ] Section order is controlled centrally in one file.
- [ ] Server/client boundaries are intentional per section.

### Replication notes

- Notes:
- Gaps:
- Reusable pattern:

---

## Quick Replication Sequence (New Project)

1. Set up Next.js + TypeScript + Tailwind v4 + shadcn aliases.
2. Add Sanity schemas, studio route, and fetch helpers.
3. Add Clerk middleware + provider + sign-in gates.
4. Add ChatKit server session action + chat sidebar shell.
5. Add animated UI components and wire them per section.
6. Add form write pipeline and CMS review workflow.
