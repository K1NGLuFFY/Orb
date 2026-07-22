# Orbit
**A retro-inspired, high-performance physical media marketplace.**

Orbit departs from the sterile grid styling of standard e-commerce websites. The user interface mimics the experience of walking through a curated bookstore or library collection. Cover artwork takes visual precedence, stacked side-by-side to replicate physical rows of media shelves. The site aggregates live data for Books, Comics, Anime, Manga, and Movies to create a distinct browsing experience for collectors.

## Tech Stack
* **Frontend:** React 19, Vite 8, Vanilla CSS
* **Backend:** Supabase (Auth, PostgreSQL, Realtime Subscriptions, RPCs)
* **APIs:** TMDB, Jikan (MyAnimeList), Google Books, Open Library

## Key Features
* **Shelving Grid Layout:** A unique browsing interface designed to resemble physical media spines.
* **Live Multi-Source Search:** Queries local database items alongside live fetches from TMDB, Jikan, and Google Books.
* **Real-time Inventory:** Uses Supabase real-time subscriptions to immediately reflect stock changes.
* **Role-based Dashboards:** Dedicated panels for Buyers, Sellers, Staff, and Admins to manage inventory and orders.
* **Graceful API Fallbacks:** Resilient data fetching with exponential backoff and offline seed data fallbacks.

## Screenshots
![Landing Page](./screenshots/landing.png)
*Landing page showing the shelving layout and live activity ticker.*

![Browse Shelf](./screenshots/browse.png)
*Catalog shelf filtering items by category, genre, and price range.*

![Checkout Flow](./screenshots/checkout.png)
*Guarded checkout process displaying billing invoice details.*

## Quick Local Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-username/orbit.git
   cd orbit
   npm install
   ```

2. **Configure Environment**
   Create a `.env` file in the root directory:
   
   | Variable | Description |
   | :--- | :--- |
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase public anon key |
   | `VITE_TMDB_API_KEY` | TMDB API key for movies |
   | `VITE_GOOGLE_BOOKS_KEY` | Google Books API key for books and comics |

3. **Run Development Server**
   ```bash
   npm run dev
   ```

## License
MIT License.
