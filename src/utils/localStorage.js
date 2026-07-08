import { hashPassword } from './crypto';
import initialProducts from '../data/seed.json';

// Local storage key names
export const KEYS = {
  USERS: 'orbit_users',
  PRODUCTS: 'orbit_products',
  ORDERS: 'orbit_orders',
  CART: 'orbit_cart', // format: { userId: [ { productId, quantity } ] }
  WISHLIST: 'orbit_wishlist', // format: { userId: [ productId ] }
  CURRENT_USER: 'orbit_current_user',
  ANNOUNCEMENTS: 'orbit_announcements',
  SETTINGS: 'orbit_settings',
  REPORTS: 'orbit_reports'
};

export const SEED_VERSION_KEY = 'orbit_seed_version';
export const CURRENT_SEED_VERSION = '2026-07-04-v2';


// Seed Users Definition
const getSeedUsers = () => [
  {
    id: 'user-admin-1',
    name: 'Chief Librarian (Admin)',
    email: 'admin@orbit.com',
    passwordHash: hashPassword('admin123'),
    role: 'Admin',
    status: 'active', // active | locked | suspended
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-staff-1',
    name: 'Archive Curator (Staff)',
    email: 'staff@orbit.com',
    passwordHash: hashPassword('staff123'),
    role: 'Staff',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-seller-1',
    name: 'Tokyo Media Imports',
    email: 'seller1@orbit.com',
    passwordHash: hashPassword('seller123'),
    role: 'Seller',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-seller-2',
    name: 'Nostalgia Books & Films',
    email: 'seller2@orbit.com',
    passwordHash: hashPassword('seller123'),
    role: 'Seller',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-buyer-1',
    name: 'Alice Smith',
    email: 'buyer1@orbit.com',
    passwordHash: hashPassword('buyer123'),
    role: 'Buyer',
    status: 'active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'user-buyer-2',
    name: 'Bob Johnson',
    email: 'buyer2@orbit.com',
    passwordHash: hashPassword('buyer123'),
    role: 'Buyer',
    status: 'active',
    createdAt: new Date().toISOString()
  }
];

// Initial System Announcements
const getSeedAnnouncements = () => [
  {
    id: 'ann-1',
    title: 'Welcome to the Grand Opening of Orbit!',
    content: 'Orbit is live. Browse the virtual shelves for retro books, classic anime releases, movies, and comics.',
    date: new Date().toISOString()
  }
];

// Initial Settings
const getSeedSettings = () => ({
  maintenanceMode: false,
  allowNewRegistrations: true,
  themeMode: 'dark',
  announcementTicker: 'Grand Opening Sale! Use promo code ORBIT10 for simulated savings!'
});

// Helper: safe read
export const readStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading key ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Helper: safe write
export const writeStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing key ${key} to localStorage:`, error);
  }
};

// Initialize DB with seed data if empty
export const initializeDB = (forceReset = false) => {
  const existingVersion = localStorage.getItem(SEED_VERSION_KEY);
  if (forceReset || existingVersion !== CURRENT_SEED_VERSION) {
    console.log('Seed version changed or force reset triggered. Clearing and reseeding...');
    localStorage.clear();
    localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
    forceReset = true; // force write below
  }

  // Check if USERS or PRODUCTS is empty, signifying uninitialized state
  const existingUsers = readStorage(KEYS.USERS);
  const existingProducts = readStorage(KEYS.PRODUCTS);

  if (forceReset || !existingUsers || !existingProducts) {
    console.log('Seeding initial Orbit data to localStorage...');
    writeStorage(KEYS.USERS, getSeedUsers());
    writeStorage(KEYS.PRODUCTS, initialProducts);
    writeStorage(KEYS.ORDERS, []);
    writeStorage(KEYS.CART, {});
    writeStorage(KEYS.WISHLIST, {});
    writeStorage(KEYS.ANNOUNCEMENTS, getSeedAnnouncements());
    writeStorage(KEYS.SETTINGS, getSeedSettings());
    writeStorage(KEYS.REPORTS, []);
    // Don't clear currentUser unless it is a force reset
    if (forceReset) {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  }
};

/**
 * Ensures a dynamically fetched live product metadata is cached inside standard localStorage
 * so that offline-only features (cart, wishlist, invoices) can resolve its details.
 */
export const ensureProductRegistered = (product) => {
  if (!product) return;
  const products = readStorage(KEYS.PRODUCTS) || [];
  if (!products.some(p => p.id === product.id)) {
    products.push(product);
    writeStorage(KEYS.PRODUCTS, products);
  }
};


