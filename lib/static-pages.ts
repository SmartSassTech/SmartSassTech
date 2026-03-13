/**
 * Static site pages that should appear in search results.
 * These are pages that don't come from Notion but are important
 * parts of the site that users should be able to find via search.
 */

export interface StaticPageEntry {
  id: string
  title: string
  description: string
  url: string
  type: 'Page' | 'Service'
  badge?: string
  /** Extra keywords that help this page surface in search */
  keywords: string[]
}

export const STATIC_PAGES: StaticPageEntry[] = [
  {
    id: 'page-scam-prevention',
    title: 'Scam Prevention & Protection',
    description:
      'Essential resources for scam prevention, reporting fraud, and protecting your identity online. Includes links to BBB Scam Tracker, FTC, AARP fraud resources, and more.',
    url: '/scam-prevention',
    type: 'Page',
    badge: 'Safety',
    keywords: [
      'scam', 'fraud', 'phishing', 'identity theft', 'robocall', 'spam',
      'report', 'protection', 'safety', 'suspicious', 'email', 'virus',
      'malware', 'hack', 'stolen', 'security', 'help', 'prevent',
      'bbb', 'ftc', 'aarp', 'do not call', 'telemarketing',
    ],
  },
  {
    id: 'page-about',
    title: 'About SmartSass Tech',
    description:
      'Learn about SmartSass Tech — who we are, our mission, and how we help seniors and families navigate technology with confidence.',
    url: '/about',
    type: 'Page',
    badge: 'About',
    keywords: [
      'about', 'who', 'team', 'mission', 'company', 'story', 'senior',
      'family', 'rochester', 'technology', 'help',
    ],
  },
  {
    id: 'page-contact',
    title: 'Contact SmartSass Tech',
    description:
      'Get in touch with SmartSass Tech. Call, email, or fill out our contact form. We serve the Rochester, NY area.',
    url: '/contact',
    type: 'Page',
    badge: 'Contact',
    keywords: [
      'contact', 'phone', 'email', 'call', 'reach', 'support',
      'message', 'help', 'question', 'rochester',
    ],
  },
  {
    id: 'page-booking',
    title: 'Book a Tech Support Session',
    description:
      'Schedule a one-on-one tech support session. Available for remote and in-person help with any device or tech issue.',
    url: '/booking',
    type: 'Page',
    badge: 'Booking',
    keywords: [
      'book', 'appointment', 'schedule', 'session', 'calendar',
      'remote', 'in-person', 'help', 'support',
    ],
  },
  {
    id: 'page-pricing',
    title: 'Plans & Pricing',
    description:
      'View our tech support plans: Standard Support, The Monthly Master, and The Tech Scholar. Flexible options for every need.',
    url: '/pricing',
    type: 'Page',
    badge: 'Pricing',
    keywords: [
      'pricing', 'price', 'cost', 'plan', 'subscription', 'monthly',
      'session', 'bundle', 'discount', 'pay', 'afford',
    ],
  },
  {
    id: 'page-articles',
    title: 'Browse All Guides & Articles',
    description:
      'Explore our complete library of easy-to-follow tech guides, how-to articles, and troubleshooting tips.',
    url: '/articles',
    type: 'Page',
    badge: 'Resources',
    keywords: [
      'articles', 'guides', 'how-to', 'tutorial', 'resources',
      'knowledge base', 'browse', 'learn', 'tips',
    ],
  },
  {
    id: 'page-rewards',
    title: 'SmartSass Rewards Program',
    description:
      'Earn points on every purchase and redeem them for discounts. 100 points = 5% off your next service.',
    url: '/rewards',
    type: 'Page',
    badge: 'Rewards',
    keywords: [
      'rewards', 'points', 'earn', 'redeem', 'discount', 'loyalty',
      'program', 'save',
    ],
  },
]
