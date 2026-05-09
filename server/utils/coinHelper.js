/**
 * Utility to convert Currency (INR) to BMS Coins.
 * Default Rate: 1 INR = 1 Coin.
 * @param {Number} amount - Amount in INR
 * @returns {Number} - Amount in Coins
 */
export const currencyToCoins = (amount) => {
  return Math.round(amount);
};

/**
 * Utility to convert BMS Coins back to Currency (INR).
 * @param {Number} coins - Amount in Coins
 * @returns {Number} - Amount in INR
 */
export const coinsToCurrency = (coins) => {
  return coins;
};
