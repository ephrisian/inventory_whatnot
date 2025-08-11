import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function calculateNetProfit(
  soldPrice: number,
  cost: number,
  shippingCost: number = 0,
  materialsCost: number = 0,
  platformFeePercent: number = 0,
  platformFeeFlat: number = 0
): number {
  const platformFeeTotal = (soldPrice * platformFeePercent / 100) + platformFeeFlat
  return soldPrice - cost - shippingCost - materialsCost - platformFeeTotal
}

export function calculateBreakEvenPrice(
  cost: number,
  shippingCost: number = 0,
  materialsCost: number = 0,
  platformFeePercent: number = 0,
  platformFeeFlat: number = 0
): number {
  // Calculate break-even including platform fees
  // Formula: (cost + shipping + materials + flat fee) / (1 - fee percentage)
  const baseCost = cost + shippingCost + materialsCost + platformFeeFlat
  const feeMultiplier = 1 - (platformFeePercent / 100)
  return baseCost / feeMultiplier
}

export function calculateSuggestedPrice(totalCost: number, margin: number = 0.88): number {
  return Math.ceil(totalCost / margin)
}

export function parseJsonSafely<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback
  try {
    return JSON.parse(jsonString) as T
  } catch {
    return fallback
  }
}

export function generateSKU(name: string, category?: string): string {
  const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  const categoryPrefix = category ? category.substring(0, 3).toUpperCase() : 'GEN'
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${categoryPrefix}-${cleanName.substring(0, 8)}-${randomSuffix}`
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}
