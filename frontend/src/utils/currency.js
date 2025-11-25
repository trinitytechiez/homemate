// Currency utility functions

export const getCurrencySymbol = (currency) => {
  const symbols = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'د.إ'
  }
  return symbols[currency] || '₹'
}

export const formatCurrency = (amount, currency = 'INR') => {
  const symbol = getCurrencySymbol(currency)
  return `${symbol} ${amount || 0}`
}

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' }
]

