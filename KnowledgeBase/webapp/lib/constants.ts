export const TASK_CATEGORIES = [
  'Using Your Devices',
  'Digital Basics',
  'Technology Basics',
  'TV & Streaming',
  'Online Safety & Privacy',
  'Staying Safe Online',
  'Staying in Touch',
  'Photos, Files & Storage',
  'Health & Fitness Devices',
]

export const DEVICE_TYPES = [
  'Computer',
  'Smartphone',
  'Tablet',
  'Smart TV',
  'Streaming Device',
  'Printer',
  'Wearable',
  'Router / Network Equipment',
  'Sound System',
  'Hearing Aids',
]

// Recognized specific devices for normalization
export const SPECIFIC_DEVICES = [
  'iPhone',
  'Android phone',
  'Windows PC',
  'Mac',
  'Chromebook',
  'Roku',
  'Fire TV',
  'Apple TV',
  'Chromecast',
  'Canon Printer',
  'HP Printer',
  'Apple Watch',
  'Fitbit',
]

// Extended platform/app list
export const PLATFORM_CATEGORIES = [
  'Windows 11',
  'iOS',
  'Android',
  'macOS',
  'Roku OS',
  'Fire OS',
  'tvOS',
  'Web Browser',
  'Facebook',
  'Netflix',
  'Hulu',
  'Email',
  'Video Calling',
  'Messaging Apps',
  'Online Banking',
  'Cloud Storage',
  'App Stores',
]

export const ARTICLE_TYPES = [
  'How-To / Setup',
  'Tutorial',
  'Safety / Security',
  'Troubleshooting',
  'Educational',
  'Consumer Decision',
]

export const TOPIC_CATEGORIES = TASK_CATEGORIES // Legacy alias for compatibility

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Using Your Devices': 'smartphone',
    'Digital Basics': 'book-open',
    'Technology Basics': 'book',
    'TV & Streaming': 'tv',
    'Online Safety & Privacy': 'shield',
    'Staying Safe Online': 'lock',
    'Staying in Touch': 'users',
    'Photos, Files & Storage': 'image',
    'Health & Fitness Devices': 'activity',
  }
  return icons[category] || 'folder'
}

export function getDeviceIcon(device: string): string {
  // Mapping new strictly defined device types to icons
  const icons: Record<string, string> = {
    'Computer': 'monitor',
    'Smartphone': 'smartphone',
    'Tablet': 'tablet',
    'Smart TV': 'tv',
    'Streaming Device': 'cast',
    'Printer': 'printer',
    'Wearable': 'watch',
    'Router / Network Equipment': 'wifi',
    'Sound System': 'speaker',
    'Hearing Aids': 'headphones',
  }
  return icons[device] || 'hard-drive'
}

export function getCategoryEmoji(category: string): string {
  const icons: Record<string, string> = {
    'Using Your Devices': '📱',
    'Digital Basics': '💻',
    'Technology Basics': '📚',
    'TV & Streaming': '📺',
    'Online Safety & Privacy': '🛡️',
    'Staying Safe Online': '🔐',
    'Staying in Touch': '👋',
    'Photos, Files & Storage': '📸',
    'Health & Fitness Devices': '🏃',
  }
  return icons[category] || '📂'
}

export function getDeviceEmoji(device: string): string {
  const icons: Record<string, string> = {
    'Computer': '💻',
    'Smartphone': '📱',
    'Tablet': '📟',
    'Smart TV': '📺',
    'Streaming Device': '🔌',
    'Printer': '🖨️',
    'Wearable': '⌚',
    'Router / Network Equipment': '📶',
    'Sound System': '🔊',
    'Hearing Aids': '🦻',
  }
  return icons[device] || '🔌'
}
