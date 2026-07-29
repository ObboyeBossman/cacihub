# Claude Agent Rules — caci-hub

> These rules apply specifically to Claude (Anthropic) when operating as a development agent on this project.
> They extend and are subordinate to the design and quality standards defined in `AGENTS.md`.
> **Read `AGENTS.md` first. Read this file second. Do not begin implementation until both are understood.**

---

## Session Startup (Required Every Chat — Do Not Skip Any Step)

1. Clone or pull the repository so the local copy is on the latest `main` commit.
2. Read `.agents/AGENTS.md` in full.
3. Read this file (`CLAUDE.md`) in full.
4. Set git identity (see **Git Identity** below).
5. Confirm the current branch and last commit before writing any code.
6. Run `git log --oneline origin/main..HEAD` — if any unpushed commits exist from a previous session, push them immediately before starting new work.
7. Explicitly acknowledge the commit-and-push-after-every-file rule before beginning any task.

---

## Git Identity

Configure these values before the first commit of every session — never commit as Claude or any other identity:

```bash
git config user.name "Obboye Bossman"
git config user.email "obboyebossman@gmail.com"
```

---

## Branching Strategy

- **Never work directly on `main` for new features or serious edits.**
- Create a feature branch at the start of every new feature or significant change:

```bash
git checkout -b feat/<feature-name>
```

- Work on that branch. Commit and push every file change to the feature branch as you go (see **Commit Cadence** below).
- When the full feature or objective is complete, run build and all checks on the branch.
- Only after all checks pass clean, merge into `main`:

```bash
git checkout main
git merge feat/<feature-name>
git push origin main
```

- Delete both the local and remote feature branch after a successful merge:

```bash
git branch -d feat/<feature-name>
git push origin --delete feat/<feature-name>
```
- Work directly on `main` **only** for trivial, single-line fixes where a branch would add no value — and only if explicitly agreed.

---

## Commit Cadence — Commit & Push on Every Change

This is the **primary workflow rule** for all development on this project. Violating this rule is not acceptable under any circumstance.

### The Law: One File = One Commit = One Push. Immediately.

The sequence is:

```
1. Write or modify ONE file
2. git add <that file>
3. git commit -m "<type>(<scope>): <description>"
4. git push origin <branch>
5. ONLY THEN move to the next file or task
```

**There is no step 5 without step 4. No exceptions.**

### Hard Rules — These Are Non-Negotiable

- **NEVER** touch a second file before committing and pushing the first.
- **NEVER** leave a commit unpushed. A local commit that has not been pushed does not exist as far as this project is concerned.
- **NEVER** batch multiple file changes into one commit unless they are a single atomic unit (e.g., a component file and its co-located type definition that cannot function independently).
- **NEVER** push multiple commits in one `git push`. Push after every single commit.
- **NEVER** proceed to the next task, next file, or next step in a plan until the previous file is committed AND pushed and the push has returned successfully.
- Each commit message must describe exactly what changed in that one file — not what the feature does overall.

### What a Violation Looks Like — Never Do This

❌ Write 3 files, then commit them all together, then push once.
❌ Write a file, commit it, then write another file before pushing.
❌ Finish a feature, then push all commits at the end.
❌ Say "I'll push when the feature is done."

### What Correct Behaviour Looks Like — Always Do This

✅ Write `components/MyComponent.tsx` → commit → push → confirm push succeeded → then open the next file.
✅ If a push fails, fix the push error immediately before touching any other file.
✅ If unsure whether the last push succeeded, run `git status` and `git log --oneline origin/<branch>..HEAD` to verify — zero unpushed commits before continuing.

### Verification After Every Push

After every `git push`, confirm it succeeded by checking the output. If it did not succeed:
1. Stop all other work immediately.
2. Fix the push error.
3. Push again.
4. Only then continue.

### After the Full Feature or Objective Is Complete

Only once **all files for the feature have been individually committed and pushed** do you:

1. Run the build:

```bash
npm run build
```

2. Fix **every** build error — committing and pushing each fix individually before moving to the next error.

3. Run lint and type-check if available:

```bash
npm run lint       # if present
npm run typecheck  # if present
```

4. Fix any errors, committing and pushing each fix individually.

5. Only when all checks pass clean, merge into `main` and push:

```bash
git checkout main
git merge feat/<feature-name>
git push origin main
```

6. Delete the feature branch locally and remotely:

```bash
git branch -d feat/<feature-name>
git push origin --delete feat/<feature-name>
```

### Summary

| Phase | Action |
|---|---|
| Start of feature | Create feature branch |
| Every single file added or changed | Commit that file → Push immediately → Confirm push → Then and only then move on |
| Build error fix | Commit the fix → Push → Confirm → Move to next error |
| Full feature complete | Run build → Fix errors (commit+push each) → Run lint/typecheck → Fix errors (commit+push each) → Merge to `main` → Push → Delete feature branch |

---

## Security — Credentials & Secrets

- **Never** print, log, echo, commit, or expose any credential (PAT, API key, password, secret).
- Use secrets only for the operation they were provided for.
- After any `git push` that required a PAT embedded in the remote URL, immediately scrub it:

```bash
git remote set-url origin https://github.com/ObboyeBossman/cacihub.git
```

- Do not store or reuse credentials across sessions.

---

## Validation — Must Pass After Every Feature (Not Before Every Push)

Build and lint checks run **after a complete feature or objective is finished** — not before every individual file push. See the **Commit Cadence** section above for the full workflow.

```bash
npm run build
```

- Resolve **all** build errors, committing and pushing each fix individually.
- Also run lint and type-check if they exist in `package.json`:

```bash
npm run lint       # if present
npm run typecheck  # if present
```

- All checks must pass clean before the feature is declared done.
- **Never** leave the repository in a broken state at the end of a session.

---

## Supabase — CLI Required for All Database Changes

Any task that involves changes to the Supabase project (schema changes, migrations, RLS policies, Edge Functions, seed data, storage rules, or any other direct database or project configuration) **must** use the Supabase CLI. No exceptions.

### Required workflow

1. **Install the Supabase CLI** at the start of any session that involves Supabase changes (if not already installed):

```bash
npm install -g supabase
# or
brew install supabase/tap/supabase
```

2. **Link to the project** before making any changes:

```bash
supabase link --project-ref zixkhbtmoxuscmbxgmrp
```

3. **Apply all changes through the CLI** — never make manual changes in the Supabase dashboard:

```bash
# Create a new migration
supabase migration new <migration-name>

# Apply migrations to the remote project
supabase db push

# Pull the current remote schema (to sync local state)
supabase db pull
```

4. **All migration files must be committed** to `supabase/migrations/` as part of the feature branch commit cadence defined above.

### Rules

- **Never** modify the database schema, RLS policies, or any Supabase project config via the Supabase dashboard UI.
- **Never** run raw SQL directly against the production database outside of a tracked migration file.
- Every schema change must have a corresponding migration file in `supabase/migrations/` with a timestamp prefix (e.g. `20260725120000_<name>.sql`).
- If a task requires a seed or data change, use a dedicated migration or a script that runs through the CLI — never ad-hoc SQL.
- After `supabase db push`, confirm the migration applied cleanly before committing the migration file to the feature branch.

---

## Implementation Standards

Follow the conventions established in `AGENTS.md` as the source of truth for design and code quality.
Additionally, as Claude:

- Keep diffs minimal and focused — only change what is required for the task.
- Do not refactor unrelated code unless it directly blocks the task.
- Maintain backward compatibility unless instructed otherwise.
- Write production-ready, readable, maintainable code.
- Prefer semantic HTML, accessible patterns, and mobile-first layout — as defined in `AGENTS.md`.

---

## Communication Protocol

**Before non-trivial work:**
- State the implementation plan in 2–4 sentences.
- Call out assumptions and risks upfront.

**After completing work:**
- Summarise the changes made (what files, what changed, why).
- Report build and lint results explicitly.
- Note any remaining issues or follow-up recommendations.

---

## Context Limit Handling

If the session is approaching its context limit:

1. Do **not** leave the repository mid-file or in an incoherent state.
2. Finish the current file change, commit, and push it to the feature branch.
3. Do **not** merge into `main` — the feature branch is the safe holding place.
4. Leave a clear written summary covering:
   - What was completed
   - What files were committed and pushed
   - What remains before the branch can be merged
   - Assumptions made
   - Recommended next steps for the next session

Every committed file should be pushed to the feature branch — never leave unpushed local commits at session end.

---

## Relationship to AGENTS.md

| Concern | Source of truth |
|---|---|
| Design philosophy & visual language | `AGENTS.md` |
| Interaction & motion principles | `AGENTS.md` |
| Mobile-first & responsive rules | `AGENTS.md` |
| Git identity, branching, security | `CLAUDE.md` (this file) |
| Build validation & push rules | `CLAUDE.md` (this file) |
| Communication & session workflow | `CLAUDE.md` (this file) |

When there is any conflict, `AGENTS.md` wins on design decisions; `CLAUDE.md` wins on workflow and process decisions.
