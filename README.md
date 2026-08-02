# Orbit
*Your unified media catalog and secure digital shelf.*

Orbit is a modern e-commerce platform that allows users to discover, organize, and purchase media across different categories, including movies, anime, books, and manga. It seamlessly merges physical database inventory with live external data sources to create an expansive, unified catalog. Built with strict role-based access controls and secure serverless payment handling, Orbit caters to buyers, sellers, and administrators alike.

## Tech Stack
* **Frontend:** React, Vite, React Router, Lucide Icons
* **Backend:** Supabase (PostgreSQL, Auth, RLS)
* **Serverless Functions:** Vercel serverless (Node.js)
* **Payment Gateway:** Paystack
* **Data Sources:** TMDB API (Movies), Jikan API (Anime), Google Books API (Books), Manga API

## Key Features
* **Unified Catalog:** Browse seeded database items alongside live external API results in one seamless interface.
* **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for Admins, Staff, Sellers, and Buyers via Supabase RLS.
* **Seller Approval Workflow:** Fully in-app administrative notification and approval system for promoting user accounts to sellers, eliminating reliance on fragile external email services.
* **Accountability & Strikes:** Dedicated strike system and instant seller-demotion batch actions giving administrators full control over community integrity.
* **Dual-Role Navigation:** Seamless hybrid dashboards where Sellers inherently act as Buyers, allowing them to manage inventory and browse personal wishlists without complex state toggles.
* **Secure Checkout:** Server-side transaction verification with Paystack, atomic stock decrement, and server-side price locking.
* **Live Wishlist & Cart:** Mix live API products and physical DB items in one persistent shelf.
* **API Proxy Security:** External API keys are kept entirely out of the client bundle using Vercel serverless proxies.

## Screenshots

![Homepage Overview](placeholder-homepage.jpg)
*Homepage and unified catalog interface.*

![Checkout & Paystack](placeholder-checkout.jpg)
*Secure checkout flow with Paystack integration.*

![Role Dashboards](placeholder-dashboard.jpg)
*Role-specific dashboards for inventory and order management.*

## Quick Local Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/K1NGLuFFY/Orb.git
   cd Orb
   npm install
   ```

2. **Run Development Server**
   Because Orbit uses Vercel serverless proxies to securely hide API keys, you **must use the Vercel CLI** to run the project locally. Using standard `npm run dev` (Vite) will not execute the `/api` routes.
   
   ```bash
   npm i -g vercel
   vercel dev
   ```

### Environment Variables
Create a `.env` file in the root directory:

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase public anon key |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key for the frontend popup |
| `PAYSTACK_SECRET_KEY` | Paystack secret key for server-side verification |
| `TMDB_API_KEY` | TMDB API Read Access Token (v4 or v3) |
| `GOOGLE_BOOKS_KEY` | Google Books API key |

## License
MIT License
