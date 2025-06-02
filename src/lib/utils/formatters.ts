export const formatNumber = (num: number | string): string => {
  const numericValue = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(numericValue)) return String(num); // Return original if not a number

  if (numericValue >= 1e12) { // Trillions
    return (numericValue / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
  }
  if (numericValue >= 1e9) { // Billions
    return (numericValue / 1e9).toFixed(1).replace(/\.0$/, '') + 'G';
  }
  if (numericValue >= 1e6) { // Millions
    return (numericValue / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (numericValue >= 1e3) { // Thousands
    return numericValue.toLocaleString(); // Add commas for thousands
  }
  // For numbers less than 1000, return as is (or maybe format decimals if needed)
  if (numericValue % 1 !== 0) { // Check if it has decimals
     return parseFloat(numericValue.toFixed(1)).toString(); // Format to 1 decimal place
  }
  return numericValue.toString();
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: 'UTC' 
  })
}

// Define SubscriptionStatus type based on usage in dashboard-content
type SubscriptionStatus = 'active' | 'canceled' | 'ended' | 'pending' | 'upcoming' | undefined;

export const getStatusColor = (status: SubscriptionStatus): string => {
  switch (status) {
    case "active": return "bg-green-500";
    case "canceled": return "bg-red-500";
    case "ended": return "bg-gray-500";
    case "pending": return "bg-yellow-500";
    case "upcoming": return "bg-blue-500";
    default: return "bg-gray-500";
  }
}

// Add other formatters here if needed in the future 

/**
 * Formats a currency value based on the amount, currency code, and optional item name.
 * - Replaces underscores in currencyCode with spaces (e.g., "token_credits" -> "token credits").
 * - Uses "$" for "USD", otherwise uses the formatted currency name.
 * - Places currency symbol/name appropriately (prefix for USD, suffix for others).
 * - Optionally appends a per-item/unit string.
 *
 * @param amount The numeric amount or a string convertible to a number.
 * @param currencyCode The currency code (e.g., "USD", "token_credits").
 * @param options Optional parameters.
 * @param options.itemName The name of the item/unit this price is for (e.g., "Standard Request Tokens", "GB").
 * @param options.perItemSuffix The string to append if itemName is provided (e.g., "/", " per "). Defaults to " / ".
 * @param options.decimalPlaces The number of decimal places to format the amount to. Defaults to 2.
 * @returns A formatted string representing the currency value, e.g., "$10.00 / unit", "50 token credits".
 */
export const formatCurrencyValue = (
  amount: number | string,
  currencyCode: string,
  options?: {
    itemName?: string;
    perItemSuffix?: string;
    decimalPlaces?: number;
  }
): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) {
    // Consider how to handle non-numeric amounts, maybe return a specific string or throw error
    return "Invalid amount"; 
  }

  const formattedCurrencyName = currencyCode.replace(/_/g, ' ');
  const isUSD = currencyCode.toUpperCase() === 'USD';
  const currencyDisplay = isUSD ? '$' : formattedCurrencyName;
  const decimalPlaces = options?.decimalPlaces === undefined ? 2 : options.decimalPlaces;
  
  let formattedAmountString = numericAmount.toFixed(decimalPlaces);
  // Remove .00 for whole numbers, but respect specified decimalPlaces if not 2 (or if amount is not whole after formatting)
  if (decimalPlaces === 2 && numericAmount % 1 === 0) {
     formattedAmountString = numericAmount.toFixed(0);
  }

  let result = "";
  if (isUSD) {
    result = `${currencyDisplay}${formattedAmountString}`;
  } else {
    result = `${formattedAmountString} ${currencyDisplay}`;
  }

  if (options?.itemName) {
    const suffix = options.perItemSuffix === undefined ? " / " : options.perItemSuffix;
    // Avoid redundant currency display if item name is the same as currency (e.g. "0.05 token credits / token credits")
    if (options.itemName.toLowerCase() !== formattedCurrencyName.toLowerCase()) {
         result += `${suffix}${options.itemName}`;
    }
  }

  return result;
}; 