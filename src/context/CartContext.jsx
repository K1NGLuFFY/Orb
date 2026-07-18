// src/context/CartContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

/** Returns true if a product id belongs to a live API source (not in the products table) */
const isApiProduct = (productId) =>
  typeof productId === 'string' && (
    productId.startsWith('api-movie-') ||
    productId.startsWith('api-anime-') ||
    productId.startsWith('api-book-')
  );

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // cart: array of { productId, quantity, ...productSnapshot }
  // wishlist: array of productIds (strings)
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loadingCart, setLoadingCart] = useState(false);

  // ── Load cart + wishlist from DB whenever currentUser changes ─────────────
  useEffect(() => {
    if (!currentUser) {
      setCart([]);
      setWishlist([]);
      return;
    }
    loadCartAndWishlist();
  }, [currentUser]);

  const loadCartAndWishlist = useCallback(async () => {
    if (!currentUser) return;
    setLoadingCart(true);
    try {
      const [cartRes, wishlistRes] = await Promise.all([
        supabase
          .from('cart_items')
          .select('id, product_id, quantity, products(id, title, price, stock, image_url, category, genre)')
          .eq('user_id', currentUser.id),
        supabase
          .from('wishlist_items')
          .select('product_id')
          .eq('user_id', currentUser.id),
      ]);

      if (!cartRes.error && cartRes.data) {
        // Flatten: merge the joined product row into each cart item
        const hydrated = cartRes.data.map(row => ({
          productId: row.product_id,
          quantity: row.quantity,
          ...(row.products ?? {}),   // title, price, stock, etc.
          id: row.product_id, // keep product id as `id` for downstream compat
        }));
        setCart(hydrated);
      }

      if (!wishlistRes.error && wishlistRes.data) {
        const dbItems = wishlistRes.data.map(row => row.product_id);
        const localKey = `wishlist_api_${currentUser.id}`;
        let apiItems = [];
        try {
          apiItems = JSON.parse(localStorage.getItem(localKey) || '[]');
        } catch (e) {
          console.error('[CartContext] Failed to load api wishlist from localStorage:', e);
        }
        setWishlist([...dbItems, ...apiItems]);
      }
    } catch (err) {
      console.error('[CartContext] Failed to load cart/wishlist:', err);
    } finally {
      setLoadingCart(false);
    }
  }, [currentUser]);

  // ── ADD TO CART ───────────────────────────────────────────────────────────
  const addToCart = async (product, quantity = 1) => {
    if (!currentUser) {
      showToast('Please log in to manage your shelf.', 'error');
      return false;
    }

    const existing = cart.find(item => item.productId === product.id);
    const existingQty = existing ? existing.quantity : 0;

    if (product.stock !== undefined && existingQty + quantity > product.stock) {
      showToast(`Cannot add items. Only ${product.stock} left in stock!`, 'warning');
      return false;
    }

    // ── Live API products: React state only, no DB write ─────────────────
    if (isApiProduct(product.id)) {
      setCart(prev => {
        const idx = prev.findIndex(i => i.productId === product.id);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity };
          return updated;
        }
        return [...prev, { productId: product.id, quantity, ...product, id: product.id }];
      });
      showToast(`Added "${product.title}" to cart.`, 'success');
      return true;
    }

    // ── Seeded products: upsert into cart_items ───────────────────────────
    const { error } = await supabase
      .from('cart_items')
      .upsert(
        { user_id: currentUser.id, product_id: product.id, quantity: existingQty + quantity },
        { onConflict: 'user_id,product_id' }
      );

    if (error) {
      showToast('Failed to update cart. Please try again.', 'error');
      console.error('[CartContext] addToCart error:', error);
      return false;
    }

    // Refresh local state from DB to get the joined product snapshot
    await loadCartAndWishlist();
    showToast(`Added "${product.title}" to cart.`, 'success');
    return true;
  };

  // ── REMOVE FROM CART ──────────────────────────────────────────────────────
  const removeFromCart = async (productId) => {
    if (!currentUser) return;

    const item = cart.find(i => i.productId === productId);
    const title = item?.title ?? 'Item';

    if (isApiProduct(productId)) {
      setCart(prev => prev.filter(i => i.productId !== productId));
      showToast(`Removed "${title}" from cart.`, 'info');
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('product_id', productId);

    if (error) {
      showToast('Failed to remove item. Please try again.', 'error');
      return;
    }

    setCart(prev => prev.filter(i => i.productId !== productId));
    showToast(`Removed "${title}" from cart.`, 'info');
  };

  // ── UPDATE QUANTITY ───────────────────────────────────────────────────────
  const updateQuantity = async (productId, quantity) => {
    if (!currentUser) return;
    if (quantity <= 0) { removeFromCart(productId); return; }

    if (isApiProduct(productId)) {
      setCart(prev =>
        prev.map(i => i.productId === productId ? { ...i, quantity } : i)
      );
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('user_id', currentUser.id)
      .eq('product_id', productId);

    if (!error) {
      setCart(prev =>
        prev.map(i => i.productId === productId ? { ...i, quantity } : i)
      );
    }
  };

  // ── CLEAR CART ────────────────────────────────────────────────────────────
  const clearCart = async () => {
    if (!currentUser) return;

    // Delete all DB-backed cart rows for this user
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', currentUser.id);

    setCart([]);
    showToast('Cleared your shopping cart.', 'info');
  };

  // ── ADD TO WISHLIST ───────────────────────────────────────────────────────
  const addToWishlist = async (productId, productTitle) => {
    if (!currentUser) {
      showToast('Please log in to manage your shelf.', 'error');
      return false;
    }

    if (wishlist.includes(productId)) {
      showToast(`"${productTitle ?? 'Item'}" is already in your wishlist.`, 'info');
      return false;
    }

    if (isApiProduct(productId)) {
      // API products: state only (no FK reference available), persist to localStorage
      const localKey = `wishlist_api_${currentUser.id}`;
      try {
        const stored = JSON.parse(localStorage.getItem(localKey) || '[]');
        if (!stored.includes(productId)) {
          stored.push(productId);
          localStorage.setItem(localKey, JSON.stringify(stored));
        }
      } catch (e) {
        console.error('[CartContext] Failed to save api wishlist to localStorage:', e);
      }
      setWishlist(prev => [...prev, productId]);
      showToast(`Added "${productTitle ?? 'Item'}" to wishlist.`, 'success');
      return true;
    }

    const { error } = await supabase
      .from('wishlist_items')
      .insert([{ user_id: currentUser.id, product_id: productId }]);

    if (error) {
      showToast('Failed to update wishlist. Please try again.', 'error');
      return false;
    }

    setWishlist(prev => [...prev, productId]);
    showToast(`Added "${productTitle ?? 'Item'}" to wishlist.`, 'success');
    return true;
  };

  // ── REMOVE FROM WISHLIST ──────────────────────────────────────────────────
  const removeFromWishlist = async (productId, productTitle) => {
    if (!currentUser) return false;

    if (isApiProduct(productId)) {
      const localKey = `wishlist_api_${currentUser.id}`;
      try {
        const stored = JSON.parse(localStorage.getItem(localKey) || '[]');
        const updated = stored.filter(id => id !== productId);
        localStorage.setItem(localKey, JSON.stringify(updated));
      } catch (e) {
        console.error('[CartContext] Failed to remove api wishlist from localStorage:', e);
      }
      setWishlist(prev => prev.filter(id => id !== productId));
      showToast(`Removed "${productTitle ?? 'Item'}" from wishlist.`, 'info');
      return true;
    }

    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', currentUser.id)
      .eq('product_id', productId);

    if (error) {
      showToast('Failed to remove item. Please try again.', 'error');
      return false;
    }

    setWishlist(prev => prev.filter(id => id !== productId));
    showToast(`Removed "${productTitle ?? 'Item'}" from wishlist.`, 'info');
    return true;
  };

  const value = {
    cart,
    wishlist,
    loadingCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    addToWishlist,
    removeFromWishlist,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
