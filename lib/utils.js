import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100)
}

export function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short', 
    day: 'numeric'
  }).format(new Date(date))
}

export function formatRelativeTime(date) {
  const now = new Date()
  const diffMs = now - new Date(date)
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes}m ago`
    }
    return `${diffHours}h ago`
  } else if (diffDays === 1) {
    return '1 day ago'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return formatDate(date)
  }
}

export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getInitials(name) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function truncate(text, length = 100) {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function throttle(func, limit) {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export const SECTORS = [
  'FINTECH', 'HEALTHTECH', 'EDTECH', 'PROPTECH', 'RETAIL', 
  'ENTERPRISE', 'CONSUMER', 'DEEPTECH', 'CLEANTECH', 'MOBILITY'
]

export const STAGES = [
  'PRE_SEED', 'SEED', 'SERIES_A', 'SERIES_B', 'SERIES_C', 'LATER_STAGE'
]

export const GEOS = [
  'US', 'UK', 'EU', 'ASIA', 'LATAM', 'AFRICA', 'GLOBAL'
]

export function formatSector(sector) {
  return sector.replace('TECH', ' Tech').replace(/([A-Z])/g, ' $1').trim()
}

export function formatStage(stage) {
  return stage.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}