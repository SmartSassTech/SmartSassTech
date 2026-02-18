# Knowledge Base Web Application

A modern, responsive knowledge base platform similar to Apple Support and Microsoft Support. Built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

✅ **Article Management** - Browse and filter knowledge base articles
✅ **Multi-Filter Support** - Filter by topic categories and device types
✅ **Search Functionality** - Full-text search across articles
✅ **Responsive Design** - Works on desktop, tablet, and mobile devices
✅ **Featured Articles** - Highlight important articles on the home page
✅ **Markdown Support** - Write articles in Markdown with YAML frontmatter
✅ **Custom Color Scheme** - Professional color palette matching your brand

## Project Structure

```
webapp/
├── app/                          # Next.js app directory
│   ├── page.tsx                 # Home page
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── articles/
│   │   ├── page.tsx             # Articles browse page
│   │   └── [slug]/
│   │       └── page.tsx         # Individual article page
├── components/                   # Reusable React components
│   ├── Navigation.tsx           # Top navigation bar
│   ├── Footer.tsx               # Footer component
│   ├── ArticleCard.tsx          # Article preview card
│   ├── CategoryCard.tsx         # Category card
│   └── FilterBar.tsx            # Article filter and search
├── lib/
│   ├── articles.ts              # Article data loading
│   └── constants.ts             # Constants and utilities
├── public/                       # Static files
├── package.json                 # Dependencies
├── tailwind.config.ts           # Tailwind CSS config
└── tsconfig.json                # TypeScript config
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. Navigate to the webapp directory:
```bash
cd webapp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

### Running the Dev Server

```bash
npm run dev
```

The application will start on `http://localhost:3000` with hot-reload enabled.

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Configuration

### Color Scheme

The custom colors are defined in `tailwind.config.ts`:

```
- Primary Navy: #2E3B69
- Cream: #E3DDDC
- Slate: #5B6486
- Muted: #898CA3
- Light: #B6B5BF
- Pale: #D1D6E0
- Dark: #4A4A4A
- Background: #F0F0F0
```

### Categories

Topic categories are defined in `lib/constants.ts`:
- Scam Protection & Online Safety
- Device Setup & Troubleshooting
- Internet & WiFi
- Passwords & Account Security
- Online Shopping & Banking
- Communication
- Printing & Documents
- Streaming & Entertainment
- Photos & Files
- Health & Wellness Tech
- Accessibility Features

Device categories:
- Computers & Laptops
- Phones & Tablets
- Printers & Scanners
- Internet & WiFi
- Email & Online Accounts
- Smart TVs & Streaming Devices
- Smart Home Devices
- Safety & Security
- Other Devices & Accessories

## Article Format

Articles are stored as Markdown files in the `../articles/` directory with YAML frontmatter:

```markdown
---
title: How to Use an Internet Browser
category: Device Setup & Troubleshooting
description: A beginner's guide to browsing the internet
devices:
  - Windows PC
  - Mac
  - iPhone
difficulty: Beginner
featured: true
tags:
  - Internet Browsers
  - Getting Started
---

# Article content here...
```

### Article Fields

- **title** (required): Article title
- **category** (required): Topic category
- **description** (required): Short description for previews
- **devices** (required): Array of device types
- **difficulty** (required): Beginner, Intermediate, or Advanced
- **featured** (optional): Boolean, shows on home page
- **topic** (optional): URL-friendly category slug
- **tags** (optional): Array of searchable tags

## Adding New Articles

1. Create a new `.md` file in the `../articles/` directory
2. Add required YAML frontmatter fields
3. Write content in Markdown
4. The article will automatically appear in the app

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel dashboard
3. Deploy automatically on every push

### Other Platforms

```bash
npm run build
```

The `.next` directory contains the production build.

## Technologies Used

- **Next.js 14** - React framework with SSR and SSG
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Gray Matter** - YAML frontmatter parsing
- **Marked** - Markdown parsing

## Performance

- **Static Generation** - Articles are pre-rendered for fast load times
- **Incremental Static Regeneration** - Add new articles without rebuilding
- **Responsive Images** - Optimized for all device sizes
- **SEO Friendly** - Proper meta tags and structured data

## Troubleshooting

### Articles Not Loading

Ensure:
1. Article files are in `../articles/` directory
2. Files have `.md` extension
3. YAML frontmatter is valid
4. The articles directory is readable

### Build Errors

Clear cache and reinstall:
```bash
rm -rf .next node_modules
npm install
npm run build
```

## Future Enhancements

- [ ] Full-text search with Algolia
- [ ] Article ratings and feedback
- [ ] Multi-language support
- [ ] Video embedding
- [ ] Related articles recommendations
- [ ] User comments and Q&A
- [ ] Analytics integration
- [ ] Dark mode toggle

## License

MIT License - feel free to use this as a foundation for your project.

## Support

For issues or questions, please open an issue in the repository.
