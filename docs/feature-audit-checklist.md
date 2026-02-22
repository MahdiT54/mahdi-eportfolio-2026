# Feature Audit Checklist — Portfolio Stack

> **Purpose:** Inspect each feature independently, understand how it works, and extract a reusable pattern for future projects.
> **Cross-references:** `architecture-flow-map.md` for system context · `core-js-ts-next-sanity-clerk-chatkit-notes.md` for concept explanations.

---

## Environment Variable Quick Reference

Before starting any feature, confirm these are set:

| Variable | Where used | Public? |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity client, studio config | ✅ Yes |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity client, studio config | ✅ Yes |
| `SANITY_API_READ_TOKEN` | `client.ts` / `live.ts` read | ❌ Server only |
| `SANITY_API_WRITE_TOKEN` | `serverClient.ts` write | ❌ Server only |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `ClerkProvider` | ✅ Yes |
| `CLERK_SECRET_KEY` | Clerk middleware + `auth()` | ❌ Server only |
| `OPENAI_API_KEY` | `create-session.ts` | ❌ Server only |
| `CHATKIT_WORKFLOW_ID` | `create-session.ts` | ❌ Server only |

---

## How to Use This Checklist

1. Pick one feature section below.
2. Read the files in the listed order.
3. Tick off the audit checks as you verify each behavior.
4. Use the "Replication Notes" as your starting template for the next project.

---

## 1) Sanity CMS

### Prerequisites

- [ ] Sanity project created at [sanity.io](https://sanity.io) with project ID and dataset.
- [ ] Read token and write token generated in the Sanity dashboard.
- [ ] `next-sanity` and `@sanity/image-url` installed.

### Read order

1. `sanity/env.ts` — env validation with `assertValue`
2. `sanity.config.ts` — studio configuration
3. `app/(sanity)/studio/[[...tool]]/page.tsx` — studio mounting
4. `sanity/schemaTypes/index.ts` — registered document types
5. `sanity/schemaTypes/*.ts` — individual document models
6. `sanity/structure.ts` — custom studio navigation
7. `sanity/lib/client.ts` — base read client
8. `sanity/lib/live.ts` — `sanityFetch` + `SanityLive`
9. `sanity/lib/serverClient.ts` — write client
10. `sanity/lib/image.ts` — `urlFor` image builder

### Audit checks

- [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are validated in `env.ts`.
- [ ] Studio mounts at `/studio` via `[[...tool]]` catch-all route.
- [ ] `schemaTypes/index.ts` registers every document type needed.
- [ ] Singleton documents (e.g. profile, site settings) are modeled in `structure.ts` using `S.document()` without a list.
- [ ] Section server components use `defineQuery` + `sanityFetch` — never raw `client.fetch`.
- [ ] `serverClient` (write token) is only imported in server actions, never client components.
- [ ] Images use `urlFor(ref).width(x).url()` and `cdn.sanity.io` is in `next.config.ts` `remotePatterns`.
- [ ] `SanityLive` is mounted in the layout so content updates without a page reload.

### Common mistakes

- Importing `serverClient` in a client component — write token gets leaked to the browser.
- Forgetting to add a new schema type to `schemaTypes/index.ts` — the type exists but Studio won't show it.
- Omitting `cdn.sanity.io` from `next.config.ts` — images return 400 errors.
- Using `client.fetch` directly instead of `sanityFetch` — bypasses the live integration.

### Replication notes

**Minimal setup order:**
1. `npm install next-sanity @sanity/image-url`
2. Create `sanity/env.ts` with `assertValue` checks.
3. Create `sanity.config.ts` and `app/(sanity)/studio/[[...tool]]/page.tsx`.
4. Create at least one schema type and register it.
5. Create `sanity/lib/client.ts`, `live.ts`, `serverClient.ts`, `image.ts`.
6. Create one server component section using `defineQuery` + `sanityFetch` to prove the read flow works.

**Reusable pattern:**
```ts
// Any section server component
const MY_QUERY = defineQuery(`*[_type == "myType"][0]{ field1, field2 }`);
const { data } = await sanityFetch({ query: MY_QUERY });
```
Copy this pattern for every new section. Only the GROQ query changes.

---

## 2) Clerk Authentication

### Prerequisites

- [ ] Clerk application created at [clerk.com](https://clerk.com).
- [ ] Publishable key and secret key from Clerk dashboard.
- [ ] `@clerk/nextjs` installed.

### Read order

1. `proxy.ts` — middleware with `clerkMiddleware()`
2. `app/(portfolio)/layout.tsx` — `ClerkProvider` wrapping
3. `components/SidebarToggle.tsx` — UI gating (signed-in vs signed-out)
4. `components/ProfileImage.tsx` — same gating pattern
5. `actions/create-session.ts` — server-side `auth()` protection

### Audit checks

- [ ] `clerkMiddleware()` is exported from `proxy.ts` as the default Next.js middleware.
- [ ] `matcher` in `proxy.ts` covers the routes you want to protect or read auth on.
- [ ] `ClerkProvider` wraps the entire app tree in `layout.tsx`.
- [ ] UI correctly renders different content for signed-in vs signed-out states.
- [ ] Protected server actions call `auth()` and throw/return early if `userId` is absent.
- [ ] No auth logic exists in client components — only Clerk's pre-built components (`SignedIn`, `SignedOut`, `SignInButton`).

### Common mistakes

- Forgetting `ClerkProvider` in the layout — `auth()` will return null everywhere.
- Not including API routes in the middleware matcher — server actions on those routes won't have auth context.
- Trying to call `auth()` from a client component — it's server-only.

### Replication notes

**One-time setup (same for every project):**
1. `npm install @clerk/nextjs`
2. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`.
3. Create `proxy.ts` (or `middleware.ts`) with `clerkMiddleware()` and matcher.
4. Wrap layout in `<ClerkProvider>`.

**Reusable gating pattern:**
```tsx
// Client component — UI branching
<SignedIn><button onClick={doProtectedThing}>Open</button></SignedIn>
<SignedOut><SignInButton mode="modal"><button>Sign in</button></SignInButton></SignedOut>

// Server action — hard protection
const { userId } = await auth();
if (!userId) throw new Error("Unauthorized");
```

---

## 3) shadcn/ui + Tailwind v4 + TypeScript

### Prerequisites

- [ ] Next.js project initialized with TypeScript.
- [ ] `tailwindcss` v4 and `shadcn` CLI installed.
- [ ] `clsx` and `tailwind-merge` installed.

### Read order

1. `components.json` — alias + registry config
2. `app/globals.css` — Tailwind v4 import + theme tokens
3. `tsconfig.json` — `@/*` path alias
4. `lib/utils.ts` — `cn` helper
5. `components/ui/*` — individual primitives
6. `components/ui/sidebar.tsx` — complex stateful example

### Audit checks

- [ ] `components.json` alias `"ui": "@/components/ui"` matches `tsconfig.json` `paths`.
- [ ] `app/globals.css` has `@import "tailwindcss"` and `@theme inline { ... }` block.
- [ ] CSS variables defined in `:root` back Tailwind utility classes.
- [ ] `@/*` path alias resolves to the project root in `tsconfig.json`.
- [ ] All UI primitives use `cn(...)` for className composition.
- [ ] Complex UI state (sidebar) is in a context provider + custom hook, not duplicated across components.

### Common mistakes

- Alias mismatch between `components.json` and `tsconfig.json` — shadcn CLI generates imports that don't resolve.
- Using `p-4 p-2` without `twMerge` — both classes apply, resulting in unexpected styles.
- Forgetting `"use client"` on components that use hooks — Next.js will throw a server/client boundary error.

### Replication notes

**One-time setup:**
```bash
npx create-next-app@latest my-app --typescript --tailwind
npx shadcn@latest init
```

**shadcn CLI adds a component:**
```bash
npx shadcn@latest add button
```

**`cn` is the single most reusable utility — copy it to every project:**
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 4) Aceternity / Motion Components

### Prerequisites

- [ ] `framer-motion` (or `motion`) installed.
- [ ] Any component-specific dependencies (e.g. `dotted-map` for world map).
- [ ] Components marked `"use client"` since they use browser animation APIs.

### Read order

1. `components.json` — check if registry source is configured
2. `components/ui/comet-card.tsx`
3. `components/ui/animated-testimonials.tsx`
4. `components/ui/background-ripple-effect.tsx`
5. `components/ui/layout-text-flip.tsx`
6. `components/ui/world-map.tsx`
7. `components/world-map-demo.tsx`

### Usage references (where sections consume these)

- `components/sections/CertificationsSection.tsx` — comet card
- `components/sections/TestimonialsSection.tsx` — animated testimonials
- `components/sections/HeroSection.tsx` — layout text flip / background effect
- `components/sections/ContactSection.tsx` — world map

### Audit checks

- [ ] All motion components have `"use client"` at the top.
- [ ] Animation dependencies are installed (`framer-motion`, `dotted-map`, etc.).
- [ ] Motion components live under `components/ui/` — not mixed into section files.
- [ ] Sections import and compose motion components without duplicating animation logic.
- [ ] Components gracefully handle missing data (optional props with fallbacks).

### Common mistakes

- Missing `"use client"` on a motion component — Next.js throws on `useAnimation`, `motion.*`, etc.
- Importing a browser-only library in a server component — it will fail at build time.
- Putting animation logic inside section files — hard to reuse and breaks separation.

### Replication notes

**Pattern for adding a motion component to a section:**
```tsx
// sections/MySection.tsx (server component)
import { MyMotionComponent } from "@/components/ui/my-motion-component";

export default async function MySection() {
  const { data } = await sanityFetch({ query: MY_QUERY });
  return <MyMotionComponent items={data.items} />;  // pass data as props
}
```
The server component owns the data fetch. The client component owns the animation. Never mix them.

---

## 5) OpenAI ChatKit ("AI Twin")

### Prerequisites

- [ ] OpenAI API key with ChatKit access.
- [ ] ChatKit workflow created and workflow ID noted.
- [ ] Clerk auth set up (ChatKit is auth-gated).

### Read order

1. `lib/config.ts` — central config/env helpers
2. `actions/create-session.ts` — session creation server action
3. `components/chat/Chat.tsx` — ChatKit client mount
4. `components/chat/ChatWrapper.tsx` — server wrapper + Sanity profile fetch
5. `components/app-sidebar.tsx` — sidebar host
6. `app/(portfolio)/layout.tsx` — where sidebar is mounted

### Audit checks

- [ ] `OPENAI_API_KEY` is server-only — no `NEXT_PUBLIC_` prefix, never imported in client code.
- [ ] `CHATKIT_WORKFLOW_ID` is server-only.
- [ ] `createSession()` is a server action (`"use server"` or in `actions/` folder).
- [ ] Chat UI calls `createSession()` and receives only `client_secret` — not the raw API key.
- [ ] `ChatWrapper` is a server component that fetches Sanity profile data.
- [ ] `Chat.tsx` is a client component (`"use client"`) that mounts ChatKit.
- [ ] Chat entry point in the UI is gated by Clerk (`SignedIn`).

### Common mistakes

- Calling the OpenAI API directly from a client component — API key is exposed in the browser.
- Skipping Clerk validation in `create-session.ts` — any visitor can create sessions.
- Importing `createSession` in a client component without `"use server"` — it won't run on the server.

### Replication notes

**The core security pattern (reuse for any secret API):**
```ts
// actions/create-session.ts
"use server"
export async function createSession() {
  const { userId } = await auth();             // 1. verify user identity
  if (!userId) throw new Error("Unauthorized");
  const key = assertValue(process.env.SECRET_KEY, "Missing SECRET_KEY");
  const res = await fetch("https://external.api.com/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
  });
  const { short_lived_token } = await res.json();
  return short_lived_token;                    // 2. return only the short-lived token
}
```

**Server/client component split for external chat SDKs:**
```
ChatWrapper (server) → fetches personalization data from CMS
  └─ Chat (client) → mounts SDK using data from parent + createSession()
```
Keep this split for any SDK that needs both server data and browser APIs.

---

## 6) Contact Form → CMS Write Pipeline

### Prerequisites

- [ ] Sanity `serverClient` configured with a write token.
- [ ] Contact schema defined and registered.

### Read order

1. `components/sections/ContactForm.tsx` — client form
2. `actions/submit-contact-form.ts` — server action
3. `sanity/lib/serverClient.ts` — write client
4. `sanity/schemaTypes/contact.ts` — contact document model
5. `sanity/structure.ts` — filtered views in Studio

### Audit checks

- [ ] Form submission calls a single server action — no direct Sanity API calls from the client.
- [ ] Server action validates all required fields before writing.
- [ ] `serverClient.create(...)` uses the correct `_type` matching the registered schema.
- [ ] Contact schema includes a `status` field (`new` / `archived`) for workflow management.
- [ ] Studio structure exposes filtered list views for new and archived submissions.
- [ ] Success and error states are returned to the UI and shown to the user.

### Common mistakes

- Calling `serverClient` from a client component — write token leaks to the browser.
- No server-side validation — invalid or empty data gets written to the CMS.
- Missing `status` field in schema — no way to manage submissions in Studio.

### Replication notes

**Minimal server action write pattern:**
```ts
"use server"
export async function submitForm(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Name is required" };

  await serverClient.create({ _type: "contact", name, status: "new" });
  return { success: true };
}
```

**Minimal contact schema:**
```ts
export const contactType = defineType({
  name: "contact",
  type: "document",
  fields: [
    defineField({ name: "name", type: "string" }),
    defineField({ name: "email", type: "string" }),
    defineField({ name: "message", type: "text" }),
    defineField({
      name: "status",
      type: "string",
      options: { list: ["new", "archived"] },
      initialValue: "new",
    }),
  ],
});
```

---

## 7) Section Composition Pattern (App Router)

### Prerequisites

- [ ] Sanity read flow working (feature 1).
- [ ] At least one schema type registered.

### Read order

1. `app/(portfolio)/page.tsx` — thin entry point
2. `components/PortfolioContent.tsx` — section order controller
3. `components/sections/*.tsx` — individual sections

### Audit checks

- [ ] `page.tsx` contains no business logic — it only renders `PortfolioContent`.
- [ ] `PortfolioContent` controls section order in one place.
- [ ] Each section owns its own GROQ query — no shared query file across sections.
- [ ] Each section independently decides whether it needs `"use client"` sub-components.
- [ ] No section imports data from another section.

### Common mistakes

- Fetching all data in `page.tsx` and passing it down — kills independent section caching and makes page.tsx harder to maintain.
- Using one giant GROQ query for all sections — sections become coupled and can't be reordered cleanly.

### Replication notes

**The repeatable section template:**
```tsx
// components/sections/MySection.tsx
import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";

const MY_SECTION_QUERY = defineQuery(`*[_type == "myType"][0]{ ... }`);

export default async function MySection() {
  const { data } = await sanityFetch({ query: MY_SECTION_QUERY });
  if (!data) return null;

  return (
    <section>
      {/* render data */}
      {/* optionally: <MyClientComponent data={data.interactivePart} /> */}
    </section>
  );
}
```

Copy this template for every new section. Add it to `PortfolioContent` in the desired order.

---

## Quick Replication Sequence (New Project)

Work through features in this order — each one builds on the last:

1. **shadcn + Tailwind v4** — aliases, globals, `cn`, primitives.
2. **Sanity CMS read** — env, config, schemas, studio route, `sanityFetch`, `SanityLive`.
3. **First section** — prove `defineQuery` + `sanityFetch` + server component works end-to-end.
4. **Clerk** — middleware, `ClerkProvider`, sign-in modal, `auth()` in actions.
5. **Sidebar + chat entry** — `SidebarProvider`, `SidebarToggle`, auth gating.
6. **ChatKit** — `create-session.ts` server action, `ChatWrapper`, `Chat.tsx`.
7. **Contact form** — `ContactForm.tsx`, `submit-contact-form.ts`, contact schema, Studio views.
8. **Remaining sections** — repeat the section template.
9. **Motion/Aceternity** — layer in last; never let animation block core functionality.
