# Sa Dec Flower Hunt 🌸

A mobile-first web app for the Sa Dec Flower Festival (Dec 27, 2025). Tourists can scan QR codes on flower pots to discover the story behind each flower and collect digital stamps to redeem gifts.

## 🚀 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS (Tet Holiday Theme)
- **Database & Auth:** Supabase

## 🎨 Vibe

Minimalist, fast, joyful.
Colors:
- **Tet Red:** `#D72638` (Luck)
- **Tet Yellow:** `#FFD700` (Prosperity)
- **Tet Green:** `#00A86B` (Freshness)

## 🛠️ Local Development

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd sa-dec-flower-hunt
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 Deployment Guide

### 1. Supabase Setup

1.  Create a new project on [Supabase](https://supabase.com/).
2.  Go to the **SQL Editor** in your Supabase dashboard.
3.  Copy the content of `supabase/schema.sql` from this repository.
4.  Paste it into the SQL Editor and run it to create the database tables and security policies.

### 2. Vercel Deployment

1.  Push your code to a GitHub repository.
2.  Go to [Vercel](https://vercel.com/) and create a **New Project**.
3.  Import your GitHub repository.
4.  In the **Environment Variables** section, add:
    - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
5.  Click **Deploy**.

Your app is now live! 🎉
