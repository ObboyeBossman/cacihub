# Assakae Central Assembly — Sermons & Ministry

A full-featured sermon library and ministry hub for **Assakae Central Assembly (CACI)**, Takoradi, Ghana. Browse Spirit-filled sermon series, listen to individual messages in sequence, read key scriptures, and explore church ministries.

Built with **Next.js 16**, **TypeScript**, **Tailwind CSS 4**, **shadcn/ui**, **Prisma (SQLite)**, and **Framer Motion**.

All sermon series cover images are pre-generated static JPEGs in `public/covers/` — no external image API required at runtime.

---

## Features

- **Sermon Series → Sub-Sermons hierarchy** — each series has its own cover, theme, anchor scripture, and metadata; each sermon within has title, description, theme, scripture reference, and multiple Bible quotations
- **Sequential sermon browsing** — messages are ordered by sequence number with prev/next navigation
- **Audio player UI** — play/pause, seek, rewind/forward 15s, progress bar
- **Beautiful scripture quotation cards** — each with reference sidebar + serif verse text
- **6 ministries** with leaders and icons
- **CACI brand theming** — blue `#004BA0` (primary) + red `#C60026` (accent)
- **Fully responsive** with mobile hamburger menu
- **Smooth animations** throughout (Framer Motion)

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ or [Bun](https://bun.sh/) runtime
- npm / pnpm / yarn / bun (any package manager)

### Installation

```bash
# 1. Install dependencies
bun install
# or: npm install

# 2. Create the SQLite database & schema
bun run db:push
# or: npx prisma db push --accept-data-loss

# 3. Seed the database with sample sermon series & ministries
bun run db:seed
# or: bun run prisma/seed.ts

# 4. Start the dev server
bun run dev
# or: npm run dev
```

Then open **http://localhost:3000** in your browser.

### Production Build

```bash
bun run build
bun run start
```

---

## Database Setup

The app uses **Prisma ORM** with **SQLite**. The database file is created at `db/custom.db` (path configured in `.env`).

| Script | Description |
|--------|-------------|
| `bun run db:push` | Create/update the database schema |
| `bun run db:generate` | Regenerate the Prisma Client |
| `bun run db:seed` | Populate sample data (4 series, 20 sermons, 6 ministries) |
| `bun run db:reset` | Reset the database (⚠️ destructive) |

The schema is defined in [`prisma/schema.prisma`](./prisma/schema.prisma) with three models:

- **`SermonSeries`** — a collection of related sermons (cover, theme, anchor text, year, status)
- **`Sermon`** — an individual message within a series (title, description, theme, scripture, quotations, sequence, preacher, date, duration)
- **`Ministry`** — a church department (name, description, leader, icon)

---

## Project Structure

```
.
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Sample data seeder
├── public/
│   ├── covers/              # Pre-generated sermon series cover images (static JPEGs)
│   ├── logo.svg
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── api/             # REST API routes
│   │   │   ├── series/route.ts          # GET all series
│   │   │   ├── series/[id]/route.ts     # GET single series + sermons
│   │   │   ├── sermons/[id]/route.ts    # GET sermon + siblings + prev/next
│   │   │   └── ministries/route.ts      # GET all ministries
│   │   ├── globals.css      # CACI brand theme + animations
│   │   ├── layout.tsx       # Root layout + fonts
│   │   └── page.tsx         # Single-page app with 3 views
│   ├── components/
│   │   ├── caci/            # Custom CACI components
│   │   │   ├── logo.tsx          # SVG shield crest
│   │   │   ├── header.tsx        # View-aware sticky nav
│   │   │   ├── hero.tsx          # Landing hero
│   │   │   ├── series-grid.tsx   # Series card grid
│   │   │   ├── series-card.tsx   # Individual series card
│   │   │   ├── series-detail.tsx # Series detail view
│   │   │   ├── sermon-detail.tsx # Sermon player view
│   │   │   ├── ministry-section.tsx
│   │   │   ├── section-heading.tsx
│   │   │   └── footer.tsx        # Sticky footer
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/
│   │   ├── use-sermons.ts   # Data-fetching hooks
│   │   └── use-mobile.ts
│   ├── lib/
│   │   ├── db.ts            # Prisma client
│   │   ├── sermons.ts       # Types + formatters
│   │   └── utils.ts
│   └── store/
│       └── sermons.ts       # Zustand view-navigation store
├── .env                     # DATABASE_URL (relative path)
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json          # shadcn/ui config
└── eslint.config.mjs
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/series` | All sermon series with sermon counts |
| `GET` | `/api/series/[id]` | Single series with all sermons in sequence |
| `GET` | `/api/sermons/[id]` | Single sermon + sibling list + prev/next |
| `GET` | `/api/ministries` | All ministries |

---

## Brand Colors

Defined as CSS custom properties in `src/app/globals.css`:

```css
--caci-red:        #C60026;   /* Primary accent */
--caci-blue:       #004BA0;   /* Primary brand */
--caci-blue-light: #4D9FFF;
--caci-red-light:  #FF1A46;
--caci-blue-dim:   #003578;
--caci-red-dim:    #8C001A;
```

Full red, blue, and neutral scales are also defined.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn/ui (New York) + Lucide icons |
| Database | Prisma ORM + SQLite |
| State | Zustand (client), React hooks (server) |
| Animations | Framer Motion |
| Fonts | Playfair Display, Cormorant Garamond, Geist |

---

## License

© Assakae Central Assembly. All rights reserved.

> *"All Scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness." — 2 Timothy 3:16*
