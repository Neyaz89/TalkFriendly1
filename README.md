# TalkFriendly — Mental Wellbeing Platform

> Meaningful human connection, supported by AI.

A world-class Mental Wellbeing Platform MVP built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Framer Motion.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm 10+

### Install & Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Demo credentials:** Any email + any password (e.g. `alex@example.com` / `password123`)

---

## 🏗️ Architecture

Feature-first architecture. Clean, scalable, maintainable.

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Protected app pages
│   │   ├── dashboard/      # Main dashboard + check-in
│   │   ├── ai/             # AI Companion
│   │   ├── journal/        # Journal list, editor, entry
│   │   ├── moods/          # Mood analytics
│   │   ├── listeners/      # Listener browse + profile + booking
│   │   ├── communities/    # Communities + discussion
│   │   ├── circles/        # Listening circles
│   │   ├── events/         # Weekly events
│   │   ├── affirmations/   # Affirmations
│   │   ├── profile/        # User profile
│   │   └── settings/       # App settings
│   ├── auth/               # Auth pages (login, register, OTP)
│   └── page.tsx            # Landing page
│
├── features/               # Feature-specific components & logic
├── components/             # Shared reusable UI components
│   ├── ui/                 # Primitives (Button, Card, Input, etc.)
│   └── layout/             # App shell (Sidebar, TopBar, MobileNav)
│
├── services/               # API service layer (all API calls here)
├── mocks/                  # Mock data for development
├── types/                  # TypeScript interfaces
├── contexts/               # React context providers
├── constants/              # App-wide constants
├── lib/                    # Utilities (axios, utils)
└── hooks/                  # Custom React hooks
```

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#FAF8F6` |
| Primary | `#E97C5A` |
| Secondary | `#F7ECE6` |
| Text | `#1E1E1E` |
| Muted | `#6B7280` |
| Mood Critical | `#EF4444` |
| Mood Low | `#F97316` |
| Mood Okay | `#F59E0B` |
| Mood Good | `#22C55E` |
| Mood Excellent | `#3B82F6` |

---

## 🔌 API Layer

All API calls are in `src/services/`. Every service uses Axios with the base URL from `.env.local`.

When the FastAPI backend is ready:
1. Update `NEXT_PUBLIC_API_URL` in `.env.local`
2. Remove mock delays from each service
3. Replace mock return values with real `apiClient.get/post/patch/delete` calls
4. No changes to components needed

---

## 📱 Features

- **Landing page** — Premium hero, features, testimonials, pricing, FAQ, footer
- **Auth** — Login, register, forgot password, OTP verification (all mocked)
- **Dashboard** — Welcome card, mood chart, streak, daily goals, quick actions
- **Daily Check-in** — Mood selector (5 levels), energy/stress/sleep/anxiety/social sliders, AI insight
- **AI Companion** — Streaming chat, typing indicators, suggested replies, conversation history
- **Journal** — Rich editor with autosave, AI prompts, reflection generation, search & tags
- **Mood Analytics** — Charts (Area + Bar), trend analysis, entry history
- **Listeners** — Browse with filters, detailed profiles, reviews, multi-step booking flow
- **Communities** — Category-based groups, discussion feed, weekly questions, join/leave
- **Listening Circles** — Upcoming sessions, join, set reminders
- **Events** — Weekly wellness events, RSVP
- **Affirmations** — AI-generated, user-created, voice, favorites
- **Profile** — Stats, goals with progress, achievements
- **Settings** — Dark mode, notifications, privacy, language, export data, delete account
- **PWA** — Manifest, service worker, offline page

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 15 (App Router) | Framework |
| React 19 | UI library |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| shadcn/ui (Radix UI) | Component primitives |
| Recharts | Charts |
| React Hook Form + Zod | Forms & validation |
| Axios | HTTP client |
| next-themes | Dark mode |

---

## 📋 Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_NAME=TalkFriendly
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_MOCK_API=true
```

---

Built with ❤️ for TalkFriendly
