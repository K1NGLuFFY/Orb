export const USD_TO_NGN_RATE = 100;

/**
 * Converts a USD amount to Nigerian Naira based on the fixed rate
 * and formats it with the ₦ symbol and commas.
 * Whole Naira amounts only (no decimals).
 *
 * @param {number|string} usdAmount - The price in USD
 * @returns {string} - Formatted Naira string e.g. "₦21,690"
 */
export const formatCurrency = (usdAmount) => {
  if (usdAmount === undefined || usdAmount === null || isNaN(usdAmount)) {
    return '₦0';
  }
  const numericUsd = parseFloat(usdAmount);
  // Convert and round to nearest whole number
  const nairaAmount = Math.round(numericUsd * USD_TO_NGN_RATE);
  
  // Format with commas, no decimals
  return `₦${nairaAmount.toLocaleString('en-US')}`;
};
