export const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'د.إ'
  }
  return symbols[currency] || '₹'
}

export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
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
