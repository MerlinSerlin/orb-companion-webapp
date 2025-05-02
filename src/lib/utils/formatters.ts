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