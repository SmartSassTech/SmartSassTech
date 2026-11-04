// Helper to format phone number as (XXX) XXX-XXXX in real-time
export function formatPhoneNumber(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 10)
  if (digits.length === 0) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

// Helper to check if email format is valid
export function validateEmail(email: string): { isValid: boolean; message: string } {
  if (!email || !email.trim()) {
    return { isValid: true, message: '' } // optional in some forms
  }
  const trimmed = email.trim()
  if (!trimmed.includes('@')) {
    return { isValid: false, message: "Missing '@' in email address (e.g. name@example.com)" }
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, message: 'Please enter a complete domain (e.g. name@gmail.com)' }
  }
  return { isValid: true, message: '' }
}

// Rochester & Monroe County area address suggestions generator
export const ROCHESTER_LOCAL_TOWNS = [
  'Rochester, NY',
  'Webster, NY 14580',
  'Fairport, NY 14450',
  'Pittsford, NY 14534',
  'Penfield, NY 14526',
  'Brighton, NY 14618',
  'Greece, NY 14612',
  'Henrietta, NY 14467',
  'Irondequoit, NY 14617',
  'Victor, NY 14564',
  'East Rochester, NY 14445',
  'Spencerport, NY 14559',
  'Brockport, NY 14420',
  'Chili, NY 14624',
  'Hilton, NY 14468',
  'Mendon, NY 14506'
]

export const COMMON_ROCHESTER_STREETS = [
  'Main St',
  'East Ave',
  'Monroe Ave',
  'Ridge Rd',
  'Fairport Rd',
  'Penfield Rd',
  'Elmwood Ave',
  'University Ave',
  'Buffalo Rd',
  'Lake Ave',
  'South Ave',
  'Winton Rd',
  'Clover St',
  'Highland Ave',
  'Hard Rd',
  'Empire Blvd',
  'Bay Rd',
  'Gravel Rd',
  'Holt Rd',
  'Five Mile Line Rd'
]

export function getAddressSuggestions(query: string): string[] {
  const q = (query || '').trim()
  if (!q || q.length < 2) return []

  const results: string[] = []
  const hasNumbers = /^\d+/.test(q)

  if (hasNumbers) {
    // User typed e.g. "123 Main" or "226 Rapha"
    const numberMatch = q.match(/^\d+/)?.[0] || ''
    const rest = q.slice(numberMatch.length).trim()

    if (rest.length > 0) {
      COMMON_ROCHESTER_STREETS.forEach(street => {
        if (street.toLowerCase().includes(rest.toLowerCase())) {
          ROCHESTER_LOCAL_TOWNS.slice(0, 4).forEach(town => {
            results.push(`${numberMatch} ${street}, ${town}`)
          })
        }
      })
    } else {
      // Just numbers typed
      COMMON_ROCHESTER_STREETS.slice(0, 4).forEach(street => {
        results.push(`${numberMatch} ${street}, Rochester, NY`)
      })
    }
  } else {
    // User typed town or street name
    ROCHESTER_LOCAL_TOWNS.forEach(town => {
      if (town.toLowerCase().includes(q.toLowerCase())) {
        results.push(town)
      }
    })
    COMMON_ROCHESTER_STREETS.forEach(street => {
      if (street.toLowerCase().includes(q.toLowerCase())) {
        results.push(`${street}, Rochester, NY`)
      }
    })
  }

  return results.slice(0, 6)
}

// Sundown detection helper
// Returns true if current time is after sunset (~6:30 PM / 18:30) or before sunrise (~6:30 AM)
export function isAfterSundown(): boolean {
  const hour = new Date().getHours()
  const month = new Date().getMonth() // 0 = Jan, 6 = Jul
  // Approximate seasonal sunset in Rochester, NY:
  // Winter (Nov-Feb): ~5:00 PM (17:00)
  // Spring/Fall (Mar-Apr, Sep-Oct): ~6:30 PM (18:30)
  // Summer (May-Aug): ~8:30 PM (20:30)
  let sunsetHour = 18.5
  if (month >= 4 && month <= 7) sunsetHour = 20.5
  else if (month >= 10 || month <= 1) sunsetHour = 17.0

  const sunriseHour = 6.5
  return hour >= sunsetHour || hour < sunriseHour
}
