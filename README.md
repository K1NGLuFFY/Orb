# Orbit — Physical Media Marketplace

Orbit is a frontend-only React marketplace for buying and selling rare print and physical media, including **Anime releases, Manga volumes, Books, Comics, and Movies**. 

Built with React and Vite, the application runs entirely client-side. All catalog listings, user credentials, orders, wishlists, and site preferences are stored and maintained locally in the browser's `localStorage` namespace.

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

## 🔐 Simulated Roster Credentials

To test the multi-role simulation, you can log in directly using the quick-autofill options on the Login page or insert the following credentials manually:

| Profile Role | Email Address | Password | Privileges |
|---|---|---|---|
| **Admin** | `admin@orbit.com` | `admin123` | Control announcements, adjust registration settings, register/remove Staff, ban/lock users, edit or delete any product listing, reset database. |
| **Staff** | `staff@orbit.com` | `staff123` | Lock/unlock Buyer or Seller profiles, delete violating product listings, review analytics. Cannot add Admin or delete Staff. |
| **Seller** | `seller1@orbit.com` / `seller2@orbit.com` | `seller123` | Publish new products, edit/delete own products, track inventory, view store sale receipts. |
| **Buyer** | `buyer1@orbit.com` / `buyer2@orbit.com` | `buyer123` | Search/filter, view items, manage shopping carts, add/remove wishlist, buy items, view receipts. |

---

## ⚠️ Important Disclaimers

### 1. Simulated Authentication
> [!NOTE]
> Authentication is simulated using localStorage. Session state is persistent across browser refreshes but does not communicate with a remote server.

### 2. Password Hashing Practice
> [!IMPORTANT]
> Password hashing is simulated client-side using `bcryptjs` before items are stored in `localStorage` to reflect standard development practices, not as production-grade security.

### 3. API & Asset Attribution
> [!WARNING]
> This product uses sample artwork references and seed attributes mapped from standard public lists. This product uses TMDB metadata but is not endorsed or certified by TMDB.
