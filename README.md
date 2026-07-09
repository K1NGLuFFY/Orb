# Orbit — Physical Media Marketplace

Orbit is a React physical-media marketplace for browsing, buying, and selling print and physical media (including **Anime releases, Manga volumes, Books, Comics, and Movies**).

The application is integrated with **Supabase** for user authentication, postgres database storage, and realtime stock synchronization.

---

## 🎨 The Spine Design System

This application departs from standard e-commerce grid styles, taking aesthetic cues from libraries and physical media collections:
* **Shelving Grid Layout:** Cover images dominate listings, mimicking rows of physical shelves.
* **Signature Spine Tabs:** Each item features a left vertical colored spine tab representing its category.
  - 🔴 **Anime:** `#FF4D6D`
  - 🟡 **Manga:** `#FFC94D`
  - 🔵 **Books:** `#4EA8DE`
  - 🟣 **Comics:** `#9B5DE5`
  - 🟢 **Movies:** `#00D9C0`
* **Orange Orbital Accent (`--signal`):** `#FF6A3D` is used exclusively for actionable triggers (buttons, active tabs, prices), ensuring clear visual cues.
* **Typography Hierarchy:**
  - **Display:** `Anton` (Google Fonts) in tracked-out, all-caps styles for section headers and detail titles.
  - **Body:** `Inter` for general copy, buttons, labels, and forms.
  - **Mono:** `JetBrains Mono` for SKU numbers, checkout invoices, order dates, stock tallies, and price figures.

---

## 🔐 Authentication & Roles

Orbit uses **Supabase Auth** to manage user accounts and metadata. The database defines four main user roles, each with RLS (Row-Level Security) policies:
1. **Admin:** Manage global system settings (allow registrations, ticker message), moderation, announcements, and catalog listings.
2. **Staff:** Moderate profiles (lock/activate buyers and sellers) and moderate products.
3. **Seller:** Manage own inventory, add new catalog listings, and view store earnings receipts.
4. **Buyer:** Browse and search, build a wishlist, checkout shopping cart items, and view purchase receipts.

Users can self-register as **Buyer** or **Seller** via the Registration page.

---

## ⚙️ Setup & Configuration

To run Orbit locally with your own database:

1. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
2. Configure the database schema using the SQL query editor on your Supabase dashboard (profiles, products, orders, cart_items, wishlist_items, announcements, and settings tables).
3. Build and launch:
   ```bash
   npm install
   npm run dev
   ```

---

## ⚠️ API & Asset Attribution

> [!WARNING]
> This product uses sample artwork references and seed attributes mapped from standard public lists. This product uses TMDB metadata but is not endorsed or certified by TMDB.
