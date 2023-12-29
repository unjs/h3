/**
 * Format number using k, m, M to have the shortest possible string.
 */
export function formatNumber(value: number, fractionDigits = 1): string {
  if (value < 1e3)
    { return value.toString() }

  if (value < 1e6)
    { return `${(value / 1e3).toFixed(fractionDigits)}k` }

  if (value < 1e9)
    { return `${(value / 1e6).toFixed(fractionDigits)}m` }

  if (value < 1e12)
    { return `${(value / 1e9).toFixed(fractionDigits)}M` }

  return value.toString()
}
