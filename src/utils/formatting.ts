export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | null): string {
  if (!date) return ''
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'long',
    timeZone: 'Africa/Lagos',
  }).format(new Date(date))
}

export function whatsappHref(number: string, message = ''): string {
  let digits = number.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = `234${digits.slice(1)}`
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
