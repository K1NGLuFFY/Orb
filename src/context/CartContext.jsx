import React, { createContext, useContext, useState, useEffect } from 'react';
import { readStorage, writeStorage, KEYS } from '../utils/localStorage';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Load cart and wishlist when current user changes
  useEffect(() => {
    if (currentUser) {
      const allCarts = readStorage(KEYS.CART) || {};
      const allWishlists = readStorage(KEYS.WISHLIST) || {};
      setCart(allCarts[currentUser.id] || []);
      setWishlist(allWishlists[currentUser.id] || []);
    } else {
      setCart([]);
      setWishlist([]);
    }
  }, [currentUser]);

  const addToCart = (product, quantity = 1) => {
    if (!currentUser) {
      showToast('Please log in to manage your shelf.', 'error');
      return false;
    }
    const allCarts = readStorage(KEYS.CART) || {};
    const userCart = allCarts[currentUser.id] || [];

    const existingIndex = userCart.findIndex(item => item.productId === product.id);
    const existingQty = existingIndex > -1 ? userCart[existingIndex].quantity : 0;

    // Warning: Check stock availability
    if (product.stock !== undefined && existingQty + quantity > product.stock) {
      showToast(`Cannot add items. Only ${product.stock} left in stock!`, 'warning');
      return false;
    }

    if (existingIndex > -1) {
      userCart[existingIndex].quantity += quantity;
    } else {
      userCart.push({ productId: product.id, quantity });
    }

    allCarts[currentUser.id] = userCart;
    writeStorage(KEYS.CART, allCarts);
    setCart([...userCart]);
    showToast(`Added "${product.title}" to cart.`, 'success');
    return true;
  };

  const removeFromCart = (productId) => {
    if (!currentUser) return;
    const allCarts = readStorage(KEYS.CART) || {};
    const userCart = allCarts[currentUser.id] || [];
    const filteredCart = userCart.filter(item => item.productId !== productId);

    allCarts[currentUser.id] = filteredCart;
    writeStorage(KEYS.CART, allCarts);
    setCart(filteredCart);

    // Fetch details for descriptive alert
    const dbProducts = readStorage(KEYS.PRODUCTS) || [];
    const prod = dbProducts.find(p => p.id === productId);
    const title = prod ? prod.title : 'Item';
    showToast(`Removed "${title}" from cart.`, 'info');
  };

  const updateQuantity = (productId, quantity) => {
    if (!currentUser) return;
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const allCarts = readStorage(KEYS.CART) || {};
    const userCart = allCarts[currentUser.id] || [];
    const item = userCart.find(item => item.productId === productId);
    if (item) {
      item.quantity = quantity;
      allCarts[currentUser.id] = userCart;
      writeStorage(KEYS.CART, allCarts);
      setCart([...userCart]);
    }
  };

  const clearCart = () => {
    if (!currentUser) return;
    const allCarts = readStorage(KEYS.CART) || {};
    allCarts[currentUser.id] = [];
    writeStorage(KEYS.CART, allCarts);
    setCart([]);
    showToast('Cleared your shopping cart.', 'info');
  };

  const addToWishlist = (productId) => {
    if (!currentUser) {
      showToast('Please log in to manage your shelf.', 'error');
      return false;
    }
    const allWishlists = readStorage(KEYS.WISHLIST) || {};
    const userWishlist = allWishlists[currentUser.id] || [];

    const dbProducts = readStorage(KEYS.PRODUCTS) || [];
    const prod = dbProducts.find(p => p.id === productId);
    const title = prod ? prod.title : 'Item';

    if (!userWishlist.includes(productId)) {
      userWishlist.push(productId);
      allWishlists[currentUser.id] = userWishlist;
      writeStorage(KEYS.WISHLIST, allWishlists);
      setWishlist([...userWishlist]);
      showToast(`Added "${title}" to wishlist.`, 'success');
    } else {
      showToast(`"${title}" is already in your wishlist.`, 'info');
    }
    return true;
  };

  const removeFromWishlist = (productId) => {
    if (!currentUser) return;
    const allWishlists = readStorage(KEYS.WISHLIST) || {};
    const userWishlist = allWishlists[currentUser.id] || [];
    const filteredWishlist = userWishlist.filter(id => id !== productId);

    allWishlists[currentUser.id] = filteredWishlist;
    writeStorage(KEYS.WISHLIST, allWishlists);
    setWishlist(filteredWishlist);

    const dbProducts = readStorage(KEYS.PRODUCTS) || [];
    const prod = dbProducts.find(p => p.id === productId);
    const title = prod ? prod.title : 'Item';
    showToast(`Removed "${title}" from wishlist.`, 'info');
  };

  const value = {
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    addToWishlist,
    removeFromWishlist
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
