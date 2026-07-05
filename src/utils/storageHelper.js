import { readStorage, writeStorage, KEYS } from './localStorage';

/**
 * Strict operational middleware layer for querying and mutating data.
 * Enforces Role-Based access and Simulated Row-Level Security (RLS).
 */
export const storageHelper = {
  /**
   * Get products with RLS rules.
   * If the role is Seller, queries automatically enforce: products.filter(item => item.sellerId === currentUserId).
   */
  getProducts: (currentUser) => {
    const products = readStorage(KEYS.PRODUCTS) || [];
    if (currentUser && currentUser.role === 'Seller') {
      return products.filter(item => item.sellerId === currentUser.id);
    }
    return products;
  },

  /**
   * Write products to storage with RLS enforcement.
   * Modifying data targets outside the user's scope fails immediately.
   */
  saveProducts: (products, currentUser) => {
    if (!currentUser) {
      throw new Error("Authentication required.");
    }

    // Admin has universal mutation permission
    if (currentUser.role === 'Admin') {
      writeStorage(KEYS.PRODUCTS, products);
      return true;
    }

    // Staff can moderate (CRUD) products
    if (currentUser.role === 'Staff') {
      writeStorage(KEYS.PRODUCTS, products);
      return true;
    }

    // Seller can only add/update/delete their own listings
    if (currentUser.role === 'Seller') {
      const originalProducts = readStorage(KEYS.PRODUCTS) || [];
      
      // Verify no other seller's products are modified or deleted
      const otherSellersProds = originalProducts.filter(p => p.sellerId !== currentUser.id);
      const hasViolations = otherSellersProds.some(orig => {
        const found = products.find(p => p.id === orig.id);
        if (!found) return true; // original product deleted by seller
        // check for value modifications
        return found.sellerId !== orig.sellerId || 
               found.title !== orig.title || 
               found.category !== orig.category ||
               found.creator !== orig.creator ||
               found.price !== orig.price;
      });

      // Verify no product is added with a different sellerId
      const addedOthers = products.some(p => p.sellerId !== currentUser.id && !originalProducts.some(orig => orig.id === p.id));

      if (hasViolations || addedOthers) {
        throw new Error("Access Denied: Sellers may only manage inventory matching their unique sellerId.");
      }

      writeStorage(KEYS.PRODUCTS, products);
      return true;
    }

    throw new Error("Access Denied: You do not have permission to modify inventory.");
  },

  /**
   * Get users with RLS rules.
   * If Staff, user list omits Admin entries.
   */
  getUsers: (currentUser) => {
    const users = readStorage(KEYS.USERS) || [];
    if (!currentUser) return [];

    if (currentUser.role === 'Admin') {
      return users;
    }

    if (currentUser.role === 'Staff') {
      // Staff cannot manage or view Admins in users list
      return users.filter(u => u.role !== 'Admin');
    }

    // Buyers and Sellers can only access themselves
    return users.filter(u => u.id === currentUser.id);
  },

  /**
   * Write users to storage with RLS enforcement.
   * If Staff, user manipulation parameters omit Admin entries from editing/removal interactions.
   */
  saveUsers: (users, currentUser) => {
    if (!currentUser) {
      throw new Error("Authentication required.");
    }

    // Admin has universal mutation permission
    if (currentUser.role === 'Admin') {
      writeStorage(KEYS.USERS, users);
      return true;
    }

    // Staff can manage profiles, except Admin accounts
    if (currentUser.role === 'Staff') {
      const originalUsers = readStorage(KEYS.USERS) || [];
      const originalAdmins = originalUsers.filter(u => u.role === 'Admin');

      // Ensure no existing Admin is deleted or mutated
      const adminBypassed = originalAdmins.some(orig => {
        const found = users.find(u => u.id === orig.id);
        if (!found) return true; // deleted
        return found.role !== orig.role || found.email !== orig.email || found.status !== orig.status;
      });

      // Ensure no new Admin account is created
      const adminCreated = users.some(u => u.role === 'Admin' && !originalAdmins.some(orig => orig.id === u.id));

      if (adminBypassed || adminCreated) {
        throw new Error("Access Denied: Staff roles are forbidden from managing or creating Admin profiles.");
      }

      writeStorage(KEYS.USERS, users);
      return true;
    }

    // Buyers/Sellers can only modify their own profile
    const originalUsers = readStorage(KEYS.USERS) || [];
    const otherUsers = originalUsers.filter(u => u.id !== currentUser.id);
    const hasViolated = otherUsers.some(orig => {
      const found = users.find(u => u.id === orig.id);
      if (!found) return true; // deleted other user
      return found.role !== orig.role || found.email !== orig.email || found.status !== orig.status;
    });

    if (hasViolated) {
      throw new Error("Access Denied: Profiles can only modify their own local record.");
    }

    writeStorage(KEYS.USERS, users);
    return true;
  }
};
