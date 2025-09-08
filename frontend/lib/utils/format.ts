export function formatCurrency(amount: number | string, decimals = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatNumber(amount: number | string, decimals = 4): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

export function formatAddress(address: string, start = 6, end = 4): string {
  if (!address) return '';
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatAPY(apy: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(apy / 100);
}

export function formatTokenAmount(amount: string | number, decimals: number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  
  const divisor = 10 ** decimals;
  const formatted = num / divisor;
  
  // Show more decimals for very small numbers
  if (formatted < 0.0001 && formatted > 0) {
    return '< 0.0001';
  }
  
  return formatNumber(formatted, Math.min(decimals, 8));
}

export function parseTokenAmount(amount: string, decimals: number): bigint {
  if (!amount) return BigInt(0);
  
  try {
    const [whole, fraction = '0'] = amount.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    const result = BigInt(whole + paddedFraction);
    return result;
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return BigInt(0);
  }
}
