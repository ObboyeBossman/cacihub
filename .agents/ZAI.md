# Zai Agent Rules — CACI Hub
# Model: GLM 4 / GLM Turbo (Zhipu AI)
# Role: Agentic Vibe Coder — UI implementation, component work, feature scaffolding

> **Read AGENTS.md first. This file second. No code before both are read.**
> This file defines Zai's specific workflow, constraints, and operating rules for CACI Hub.
> Where this file conflicts with AGENTS.md, AGENTS.md wins on design; this file wins on process.

---

## Project Identity

**CACI Hub** — Church management portal for Assakae Central Assembly (Christ Apostolic Church International, Ghana).

- **Repo:** `https://github.com/ObboyeBossman/cacihub`
- **Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Zustand · Prisma · Supabase (Postgres)
- **Auth:** Phone number + password only. No email. No OTP. First login triggers forced password change.
- **Portals:** Admin Portal (church officers) · Member Portal (registered members)

---

## Session Startup — Required Every Session

Run these steps in order before touching any file:

```bash
# 1. Pull latest main
git checkout main && git pull origin main

# 2. Set git identity — always, every session
git config user.name "Zai"
git config user.email "zai@cacihub.dev"

# 3. Check for leftover unpushed work from last session
git log --oneline origin/main..HEAD

# 4. If unpushed commits exist → push them NOW before starting new work

# 5. Create a feature branch for the new task
git checkout -b feat/<task-name>
```

Do not skip any step. Do not write code on `main`.

---

## Git Identity

Always set before the first commit of every session:

```bash
git config user.name "Zai"
git config user.email "zai@cacihub.dev"
```

---

## Branching

- Never commit directly to `main`.
- Always work on `feat/<name>` or `fix/<name>` branches.
- Merge to `main` only after the build passes clean.

```bash
# Start
git checkout -b feat/<feature-name>

# Finish — only after build passes
git checkout main
git merge feat/<feature-name>
git push origin main
git branch -d feat/<feature-name>
git push origin --delete feat/<feature-name>
```

---

## Commit Cadence — One File, One Commit, One Push

This is the core workflow rule. No exceptions.

```
1. Write or edit ONE file
2. git add <that file>
3. git commit -m "<type>(<scope>): <description>"
4. git push origin <branch>
5. Confirm push succeeded
6. Only then touch the next file
```

### Hard Rules

- Never modify a second file before pushing the first.
- Never batch unrelated files into one commit.
- Never leave local commits unpushed.
- If a push fails → stop everything → fix push → retry → then continue.

### Commit Message Format

```
feat(member-dashboard): add sermon card component
fix(nav): correct active tab highlight on mobile
chore(schema): add uuid default to Member model
```

Types: `feat` · `fix` · `chore` · `refactor` · `style` · `docs`

---

## Vibe Coding Guidelines for GLM

GLM agents tend to generate large blocks of code at once. On CACI Hub, this must be controlled:

### Do
- ✅ Implement one component or one logical unit at a time
- ✅ Follow the existing file and folder structure exactly
- ✅ Use the established Tailwind token patterns already in the codebase
- ✅ Match the mobile-first responsive pattern (mobile default, `md:` for desktop)
- ✅ Keep Zustand state changes minimal and scoped
- ✅ Use `CACISelect` for all custom select inputs

### Don't
- ❌ Generate entire feature folders in one pass — scaffold incrementally
- ❌ Invent new Tailwind classes or color tokens not already in use
- ❌ Add new npm packages without flagging it first
- ❌ Touch `prisma/schema.prisma` without a corresponding migration file in `supabase/migrations/`
- ❌ Refactor unrelated files while implementing a feature
- ❌ Use `email` fields for auth — phone + password only

---

## Key Files — Know These

| File | Purpose |
|---|---|
| `src/lib/store.ts` | Zustand store — all global state |
| `src/components/caci/nav.tsx` | All navigation components (sidebar, mobile nav, FAB) |
| `prisma/schema.prisma` | Database schema — use `@default(uuid())` not `cuid()` |
| `src/app/page.tsx` | Root entry — portal routing logic |
| `.agents/AGENTS.md` | Design philosophy — read before any UI work |

---

## Zustand Rules

- Only persist `screen` state — never persist `stack` (causes browser history bugs)
- Use `portalView` to toggle between Admin and Member portal for admin users
- Do not add new top-level state slices without confirming with the project lead

---

## Prisma / Database Rules

- All new models use `@default(uuid())` — never `@default(cuid())`
- Every schema change needs a migration file: `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`
- Never run raw SQL directly against the database
- Never use `supabase db push` — GitHub auto-deploys migrations on merge to `main`
- Never touch the Supabase dashboard UI for schema changes

---

## UI Patterns — Match These Exactly

### Spacing
Base-8 system: `8 / 16 / 24 / 32 / 48 / 64px` — use Tailwind equivalents (`p-2`, `p-4`, `p-6`, `p-8`, `p-12`, `p-16`)

### Typography
Strict scale: `12 / 14 / 16 / 20 / 24 / 32 / 48px` — never deviate

### Colors
Use only the color tokens already established in the codebase. Do not introduce new hex values.

### Components
- Buttons must be named for what they do ("Save changes", not "Submit")
- Every interactive element needs: default · hover · focus · active · disabled · loading · error states
- Dialogs → bottom sheets on mobile, centered modals on desktop
- Navigation → bottom nav / FAB on mobile, sidebar on desktop

### Logo
The CACI logo is a circular PNG (dove, globe, figures). Do not replace with any SVG placeholder.

---

## Build Validation

Run after every complete feature, before merging:

```bash
npm run build
```

Fix every error. Commit and push each fix individually before moving to the next.

Also run if available:
```bash
npm run lint
npm run typecheck
```

All checks must pass clean before merge to `main`.

---

## Security

- Never log, print, echo, or commit credentials, API keys, PATs, or passwords
- After any push using a PAT in the remote URL, scrub it:

```bash
git remote set-url origin https://github.com/ObboyeBossman/cacihub.git
```

---

## Communication Protocol

**Before starting work:**
- State the implementation plan in 2–4 sentences
- Call out risks or assumptions upfront

**After completing work:**
- List every file changed and what changed in it
- Report build/lint results explicitly
- Note any remaining issues or next steps

---

## Context / Token Limit Handling

GLM Turbo has a limited context window. If approaching the limit mid-task:

1. Finish the current file — do not leave it half-written
2. Commit and push it to the feature branch
3. Do NOT merge to `main`
4. Write a handoff summary covering:
   - What was completed and pushed
   - What files remain
   - What assumptions were made
   - Recommended next steps

Leave the repo clean. Never leave unpushed local commits at session end.

---

## Relationship to Other Agent Files

| Concern | File |
|---|---|
| Design philosophy, visual language, motion | `AGENTS.md` |
| Mobile-first & responsive rules | `AGENTS.md` |
| Zai workflow, git, branching, security | `ZAI.md` (this file) |
| Claude-specific workflow | `CLAUDE.md` |

When in doubt: `AGENTS.md` wins on design. `ZAI.md` wins on Zai's process.
