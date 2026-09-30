# Tasks & Notes

A to-do list and notebook that runs entirely in your browser. Built as a
submission for "Build and Deploy a To-Do List App Using AI".

**Live site:** https://ridwan-lawal.github.io/todo-notes-app/

---

## What it does

The brief asked for four things:

| Requirement | How it's met |
| --- | --- |
| Create and manage to-do items | Add, rename, complete, and delete tasks. Completing one moves it into a Completed group; `Clear completed` empties that group. |
| A notes feature | Notes are a separate entity with their own tab — title plus free-form body, editable in place, ordered by most recently edited. |
| At least one additional feature | **Two.** (1) **Due dates**, with tasks grouped into Overdue / Today / Upcoming / No due date and overdue items flagged in red. (2) **Search**, one box filtering the tab you're on — note search covers the body text, not just titles. |
| Deployed to a public website | Deployed to GitHub Pages as a static export via GitHub Actions. Every push to `main` redeploys. |

Also included: All/Active/Completed filters, a remaining-task count, keyboard
support (Enter to save, Escape to cancel), light and dark themes following your
system setting, and a layout that works down to a 375px-wide phone.

## Running it locally

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm lint
pnpm build        # static export → ./out
```

Requires Node 22+. The build takes no environment variables and needs no
services — `pnpm build` produces a folder of static files you can host anywhere.

## How it's built

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4.

```
app/          layout + page (server components; the page just mounts the app)
components/   TaskApp (state) → TodosPanel / NotesPanel → items
lib/          types + parsers, localStorage hook, date helpers, pure list logic
```

Three decisions worth explaining:

**Storage is `localStorage`, read through `useSyncExternalStore`.** The obvious
implementation — read storage in a `useEffect` and call `setState` — causes a
cascading render, and React 19's lint rules reject it. `useSyncExternalStore` is
the right tool: React uses the server snapshot during hydration so there's no
markup mismatch, and subscribing to the `storage` event means two open tabs stay
in sync for free.

**Stored data is treated as untrusted.** Anything read back out of storage may be
corrupt or written by an older version of the app, so `lib/types.ts` parses it
defensively and drops what it can't understand. A hand-corrupted storage value
shows the empty state rather than a white screen.

**Due dates are local `YYYY-MM-DD` strings, never timestamps.** A due date is a
calendar day, not a moment. Storing a timestamp makes "is this due today?" drift
a day either side of UTC depending on the reader's timezone.

The app is entirely client-side, so it builds to a static export and could be
moved to Vercel, Netlify, or any static host without a code change. `basePath`
comes from the environment, so the same build serves from a GitHub Pages
subpath or a domain root.

## Limitations

- **Data is per-browser.** No accounts and no server, so your tasks don't follow
  you to another device, and clearing site data clears them. This was a
  deliberate trade-off: a real database would have meant provisioning, secrets,
  and a class of deployment failures, for a brief that didn't ask for
  multi-device access.
- **No undo.** Deleting a task or note is immediate.
- Editing a task to an empty title is treated as a cancel, rather than silently
  blanking it.

## How AI was used to build this

The whole thing was built in one session with Claude (Claude Code), from an
empty `create-next-app` scaffold. What that actually looked like:

**Interrogating the brief before writing code.** The first pass was the model
pushing back on ambiguity rather than generating: was "using AI" about the build
process or about AI features *in* the product? Should "a notes feature" be a
separate entity or a description field on each task? Those two answers change
the whole shape of the app, and guessing wrong would have cost hours. Deciding
them up front was worth more than any code the model wrote.

**Checking facts instead of assuming them.** Rather than being told what was
installed, the model inspected the repo and environment directly — Next 16.3.7,
Tailwind v4, which CLIs were authenticated — and read the *local* Next.js docs
in `node_modules` to confirm that `output: 'export'` behaves as expected in this
version, instead of relying on recalled API knowledge that may be out of date.

**Letting tooling correct the first attempt.** The initial storage hook used the
conventional `useEffect` + `setState` pattern. React 19's linter rejected it,
and the fix wasn't to silence the rule but to rewrite the hook around
`useSyncExternalStore` — which turned out to be simpler *and* fixed the
hydration story. Similar story in testing: an automated pass found two form
fields sharing the accessible name "Note title", which was a real accessibility
bug, fixed in the app rather than worked around in the test.

**Verifying against a browser, not against vibes.** A Playwright script drives
the real UI through 21 checks — add a task, reload, confirm it survived; set a
past due date and confirm it lands in Overdue; corrupt localStorage and confirm
the app still renders; check nothing overflows at 375px; assert the console is
clean. Crucially the same suite was run against the *production static export*,
served from a sub-path to mimic GitHub Pages, so `basePath` mistakes were caught
before deploying rather than after.

The honest summary: AI wrote essentially all of the code, but the leverage came
from using it to pin down requirements, verify claims against the actual
environment, and test the result — not from asking it for a to-do app and
shipping the first answer.
