import React, { createContext, useContext, useState, useEffect } from 'react';
import { readStorage, writeStorage, KEYS } from '../utils/localStorage';
import { useAuth } from './AuthContext';

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
    if (!currentUser) return false;
    const allCarts = readStorage(KEYS.CART) || {};
    const userCart = allCarts[currentUser.id] || [];

    const existingIndex = userCart.findIndex(item => item.productId === product.id);
    if (existingIndex > -1) {
      userCart[existingIndex].quantity += quantity;
    } else {
      userCart.push({ productId: product.id, quantity });
    }

    allCarts[currentUser.id] = userCart;
    writeStorage(KEYS.CART, allCarts);
    setCart([...userCart]);
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
  };

  const addToWishlist = (productId) => {
    if (!currentUser) return false;
    const allWishlists = readStorage(KEYS.WISHLIST) || {};
    const userWishlist = allWishlists[currentUser.id] || [];

    if (!userWishlist.includes(productId)) {
      userWishlist.push(productId);
      allWishlists[currentUser.id] = userWishlist;
      writeStorage(KEYS.WISHLIST, allWishlists);
      setWishlist([...userWishlist]);
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
