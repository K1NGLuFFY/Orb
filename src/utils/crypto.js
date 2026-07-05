import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcryptjs.
 * @param {string} password 
 * @returns {string} The hashed password
 */
export const hashPassword = (password) => {
  // Use a low number of salt rounds (e.g., 6) to keep performance fast in-browser
  const salt = bcrypt.genSaltSync(6);
  return bcrypt.hashSync(password, salt);
};

/**
 * Compare a plain-text password with a hash.
 * @param {string} password 
 * @param {string} hash 
 * @returns {boolean} True if they match
 */
export const comparePassword = (password, hash) => {
  try {
    return bcrypt.compareSync(password, hash);
  } catch (error) {
    console.error('Password comparison failed:', error);
    return false;
  }
};
