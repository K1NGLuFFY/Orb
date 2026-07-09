// src/utils/storageHelper.js
import { supabase } from '../lib/supabaseClient';

/**
 * Supabase-backed data helper.
 * RLS is enforced server-side. Client-side role checks are no longer needed.
 *
 * NOTE: "products" here means ONLY seeded/DB products with real stock.
 * Live API products (TMDB/Jikan/Google Books) are never stored in this table.
 */
export const storageHelper = {

  // ── PRODUCTS ──────────────────────────────────────────────────────────────

  /**
   * Fetch products from Supabase.
   * RLS: Sellers automatically see all (public read). If you want seller-scoped
   * queries in admin dashboards, pass filters from the calling component.
   */
  getProducts: async ({ category, sellerId } = {}) => {
    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (category) query = query.eq('category', category);
    if (sellerId) query = query.eq('seller_id', sellerId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * Insert a new product.
   * RLS: Only Seller (own seller_id), Staff, or Admin can insert.
   */
  insertProduct: async (product) => {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Update an existing product by id.
   * RLS: Seller (own listing), Staff, Admin.
   */
  updateProduct: async (productId, updates) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Delete a product by id.
   * RLS: Seller (own listing), Staff, Admin.
   */
  deleteProduct: async (productId) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) throw new Error(error.message);
    return true;
  },

  // ── USERS / PROFILES ──────────────────────────────────────────────────────

  /**
   * Fetch profiles.
   * RLS: Own row for Buyers/Sellers; Admin sees all; Staff sees non-Admin.
   * The DB enforces this — no JS role filtering needed here.
   */
  getUsers: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, role, status, deleted_at')
      .is('deleted_at', null)   // hide soft-deleted accounts from listings
      .order('role');

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  /**
   * Update a profile (Admin or Staff action — own profile update is in AuthContext).
   */
  updateUser: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // ── ORDERS ────────────────────────────────────────────────────────────────

  /**
   * Fetch orders.
   * RLS: User sees own; Seller sees orders containing their products; Admin/Staff see all.
   */
  getOrders: async ({ userId } = {}) => {
    let query = supabase
      .from('orders')
      .select('*, profiles(name)')
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────

  getAnnouncements: async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  },

  // ── SETTINGS ──────────────────────────────────────────────────────────────

  getSettings: async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  updateSettings: async (updates) => {
    const { data, error } = await supabase
      .from('settings')
      .update(updates)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
