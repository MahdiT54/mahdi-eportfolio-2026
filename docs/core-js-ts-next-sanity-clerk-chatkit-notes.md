# Core Concepts Reference
## JS/TS · Next.js App Router · Sanity · Clerk · shadcn · OpenAI ChatKit

> **How to use this file:** Read top to bottom once for orientation, then jump back by section when inspecting a specific feature. Code snippets are minimal — they show the pattern, not the full implementation.
> **Cross-references:** See `architecture-flow-map.md` for where each concept fits in the overall system.

---

## A) Core JS/TS Patterns

### Environment variables — `process.env.X`

```ts
// Server-only (never sent to browser)
const apiKey = process.env.OPENAI_API_KEY;

// Public (safe for browser — prefix required)
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
```

> **Rule of thumb:** If the variable is a secret (API key, write token), it must NOT have `NEXT_PUBLIC_`. Next.js will exclude it from the client bundle automatically.

---

### `assertValue<T>` — runtime env validation + TypeScript narrowing

```ts
function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) throw new Error(errorMessage);
  return v;
}

// Usage
const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "Missing NEXT_PUBLIC_SANITY_PROJECT_ID"
);
```

Two things happen here: the app crashes fast with a clear message if the var is missing, and TypeScript now knows `projectId` is `string`, not `string | undefined`.

> **Reuse in future projects:** Copy this pattern into every `env.ts` or config file. Failing loudly at startup is better than mysterious runtime errors later.

---

### Dynamic route segments

| Syntax | Meaning | Example URL |
|---|---|---|
| `[id]` | Single dynamic segment | `/projects/my-project` |
| `[...tool]` | Catch-all (one or more segments) | `/studio/desk/posts` |
| `[[...tool]]` | Optional catch-all (zero or more) | `/studio` or `/studio/desk` |

Used in this project at `app/(sanity)/studio/[[...tool]]/page.tsx` so Sanity Studio can handle its own internal routing.

---

### `async/await` in server actions

```ts
export async function createSession() {
  const { userId } = await auth();   // wait for Clerk auth result
  if (!userId) throw new Error("Unauthorized");

  const res = await fetch("https://api.openai.com/v1/chatkit/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ ... }),
  });

  const data = await res.json();
  return data.client_secret;
}
```

Each `await` pauses only that async function, not the whole server. Other requests continue normally.

---

### Tuples — `useTransition`

```ts
const [isPending, startTransition] = useTransition();
//     ^ boolean    ^ function
```

React hooks that return tuples give you two related values in one call. `isPending` lets you show a loading state; `startTransition` wraps the work that causes it.

---

### `event.preventDefault()`

```ts
function handleSubmit(event: React.FormEvent) {
  event.preventDefault();  // stop browser's native full-page form submit
  // now handle submit in JS
}
```

Without this, the browser would reload the page and your React handler would never fully execute.

---

## B) TypeScript Essentials

### `.ts` vs `.tsx`

Use `.ts` for files with no JSX. Use `.tsx` when the file renders React elements (`<Component />`).

### Type annotations are compile-time only

```ts
function greet(name: string): string {
  return `Hello, ${name}`;
}
```

`string` annotations disappear after build. They exist only to catch mistakes before the code runs.

### Generics — reusable type contracts

```ts
// Without generic: only works for strings
function assertString(v: string | undefined): string { ... }

// With generic: works for any type
function assertValue<T>(v: T | undefined, msg: string): T { ... }
```

### Structural typing — shape over class

TypeScript checks the shape of an object, not what class it came from. If it has the right properties, it's valid.

---

## C) Next.js App Router

### Server components are the default

Any file in `app/` is a server component unless it has `"use client"` at the top. Server components run only on the server — they can `await` databases and keep secrets safe.

### When to add `"use client"`

```ts
"use client"
// required when using:
// - useState, useEffect, useRef, useContext, useTransition
// - event handlers (onClick, onChange, onSubmit)
// - browser-only APIs (window, document, localStorage)
// - third-party libraries that require a browser (ChatKit, Framer Motion)
```

### Server / client boundary mental model

```
Server component (default)
  → can fetch data, read secrets, render HTML
  → can render client components as children (they hydrate in browser)

Client component ("use client")
  → can use hooks, handle events, access browser APIs
  → CANNOT directly call server-only code or read secret env vars
```

> **Reuse pattern:** For each section, ask: "Does this need interactivity?" If no → keep server component. If yes → extract only the interactive part into a client component and pass data as props from the server parent.

### Route groups — `(name)`

Parentheses in folder names create a route group. The name doesn't appear in the URL. Used here to give `(portfolio)` and `(sanity)` separate layouts.

---

## D) Sanity

### What the stack uses

Studio (authoring UI) + Schema modeling + GROQ queries + Live fetch + Image URL builder + Server-side writes.

### `defineConfig` in `sanity.config.ts`

```ts
export default defineConfig({
  basePath: "/studio",
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  schema: { types: schemaTypes },
  plugins: [structureTool({ structure }), visionTool()],
});
```

Every field you omit falls back to Sanity's internal defaults.

### Schema types

```ts
// sanity/schemaTypes/post.ts
export const postType = defineType({
  name: "post",
  title: "Post",
  type: "document",
  fields: [
    defineField({ name: "title", type: "string" }),
    defineField({ name: "slug", type: "slug" }),
    defineField({ name: "body", type: "array", of: [{ type: "block" }] }),
  ],
});
```

Register all types in `schemaTypes/index.ts`. The Studio shows editors for them; GROQ can query them; server actions can write them.

### `defineQuery` + `sanityFetch` — the section read pattern

```ts
// In a section server component
const HERO_QUERY = defineQuery(`*[_type == "hero"][0]{ title, subtitle, image }`);

const { data } = await sanityFetch({ query: HERO_QUERY });
```

`defineQuery` gives TypeScript the return type. `sanityFetch` (from `sanity/lib/live.ts`) executes it and integrates with `SanityLive` for real-time updates.

### `client.ts` vs `live.ts` vs `serverClient.ts`

| File | Token | Use case |
|---|---|---|
| `client.ts` | viewer (read-only) | base client |
| `live.ts` | viewer | wraps client with `defineLive`; exports `sanityFetch` + `SanityLive` |
| `serverClient.ts` | editor (write) | server actions that create/patch documents |

> **Security note:** `serverClient` uses a write token. It must only be imported in server-only files (server actions, API routes). Never import it in a client component.

### `urlFor` — image URL builder

```ts
import { urlFor } from "@/sanity/lib/image";

<Image src={urlFor(sanityImageRef).width(800).url()} alt="..." />
```

Add `cdn.sanity.io` to the `images.remotePatterns` in `next.config.ts` or Next.js will block the image.

### Folder naming clarity

| Path | What it is |
|---|---|
| `sanity/` | Your source code — schemas, config, client helpers |
| `.sanity/` | Tool-managed cache and build artifacts — don't edit |
| `app/(sanity)/` | Next.js route group for the Studio route — not the same as above |

---

## E) Clerk

### What it handles

Hosted sign-in UI, session cookies, server-side `auth()`, and React hooks/components for conditional rendering.

### Middleware — `proxy.ts`

```ts
import { clerkMiddleware } from "@clerk/nextjs/server";
export default clerkMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
```

This runs before every matched request. It attaches the Clerk auth state so `auth()` and `currentUser()` work in server components and actions.

### Gating UI

```tsx
// Client component
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

<SignedIn>
  <button onClick={openChat}>Open Chat</button>
</SignedIn>
<SignedOut>
  <SignInButton mode="modal">
    <button>Sign in to chat</button>
  </SignInButton>
</SignedOut>
```

### Protecting a server action

```ts
import { auth } from "@clerk/nextjs/server";

export async function createSession() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  // ... proceed
}
```

> **Reuse pattern:** Clerk middleware + `ClerkProvider` is a one-time setup. After that, `auth()` works in any server action and `SignedIn`/`SignedOut` works in any client component.

---

## F) shadcn/ui + Tailwind v4

### `components.json`

Tells the shadcn CLI where to put files and what aliases to use. The key alias:

```json
{
  "aliases": {
    "ui": "@/components/ui",
    "utils": "@/lib/utils"
  }
}
```

Keep this consistent with `tsconfig.json` path aliases so imports work without `../../..`.

### `globals.css` with Tailwind v4

```css
@import "tailwindcss";

@theme inline {
  --color-primary: oklch(0.6 0.2 250);
  --radius: 0.5rem;
}
```

Tailwind v4 uses CSS-first configuration. Design tokens defined here are available as utility classes and via `var(--color-primary)` in custom styles.

### `cn()` utility

```ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn("p-4 rounded", isActive && "bg-blue-500")} />
```

`clsx` handles conditional classes; `twMerge` resolves conflicting Tailwind utilities (e.g. `p-4` + `p-2` → `p-2`).

### `cva` — variant-driven component styling

```ts
const buttonVariants = cva("base-classes", {
  variants: {
    variant: {
      default: "bg-primary text-white",
      outline: "border border-primary",
    },
    size: {
      sm: "h-8 px-3",
      md: "h-10 px-4",
    },
  },
  defaultVariants: { variant: "default", size: "md" },
});
```

> **Why shadcn over a component library?** You own the source. You can modify any component without fighting a versioned API.

---

## G) OpenAI ChatKit

### Architecture split

| Part | File | Type | Why |
|---|---|---|---|
| Data fetch + pass-through | `ChatWrapper.tsx` | Server component | Fetch Sanity profile without exposing tokens |
| Interactive chat UI | `Chat.tsx` | Client component | ChatKit requires browser APIs |
| Session security | `create-session.ts` | Server action | API key must never reach client |

### Session flow in code

```ts
// actions/create-session.ts
export async function createSession() {
  const { userId } = await auth();                      // 1. verify user
  if (!userId) throw new Error("Unauthorized");

  const key = assertValue(process.env.OPENAI_API_KEY, "Missing OPENAI_API_KEY");
  const workflowId = assertValue(process.env.CHATKIT_WORKFLOW_ID, "Missing CHATKIT_WORKFLOW_ID");

  const res = await fetch("https://api.openai.com/v1/chatkit/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: JSON.stringify({ workflow_id: workflowId }),   // 2. call OpenAI
  });

  const { client_secret } = await res.json();
  return client_secret;                                  // 3. return to client (not the API key)
}
```

The client receives only the short-lived `client_secret` — never the master API key.

> **Reuse pattern:** This proxy-action pattern applies to any API that requires a secret. Server action validates user → calls external API server-side → returns only what the client needs.

---

## H) Contact Form Pipeline

### `useTransition` for async form submission

```tsx
"use client"
const [isPending, startTransition] = useTransition();

function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  startTransition(async () => {
    const result = await submitContactForm(formData);
    // handle result
  });
}
```

### Server action validation pattern

```ts
// actions/submit-contact-form.ts
export async function submitContactForm(formData: FormData) {
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  if (!name || !email) return { error: "Name and email are required." };

  await serverClient.create({
    _type: "contact",
    name,
    email,
    status: "new",
    submittedAt: new Date().toISOString(),
  });

  return { success: true };
}
```

---

## I) One-File Mental Model

Where to find each concern:

| Concern | File(s) |
|---|---|
| Content models | `sanity/schemaTypes/*` |
| CMS navigation | `sanity/structure.ts` |
| Data reads | Section server components + `sanityFetch` |
| Data writes | `actions/submit-contact-form.ts` + `serverClient` |
| Auth | `proxy.ts` + `ClerkProvider` + `auth()` in actions |
| AI session | `actions/create-session.ts` |
| Chat UI | `components/chat/ChatWrapper.tsx` + `Chat.tsx` |
| UI tokens | `app/globals.css` |
| UI primitives | `components/ui/*` |
| Design utilities | `lib/utils.ts` (cn, cva) |
