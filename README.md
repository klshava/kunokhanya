# Kunokhanya Training Academy Website

A modern, responsive website for Kunokhanya Training Academy built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools—just clean, static files ready for GitHub Pages.

## Features

- **Responsive Design**: Mobile-first approach optimized for 375px, 768px, and 1280px viewports
- **Dark Mode**: Automatic theme detection with manual toggle via sun/moon icon
- **Clean URLs**: Remove `.html` extensions from URLs (e.g., `/courses` instead of `/courses.html`)
- **Accessibility**: WCAG AA contrast compliance, semantic HTML5, keyboard navigation
- **Performance**: Lazy loading images, optimized CSS/JS, smooth scroll behavior
- **Modern Design**: Premium typography, smooth animations, professional layout
- **Brand Colors**: Dark navy blue (#294A70) and vibrant red (#FF005A)

## File Structure

```
kunokhanya/
├── index.html                 # Homepage
├── about.html                 # About Us page
├── courses.html               # Courses & Fees page
├── apply.html                 # How to Apply page
├── faq.html                   # FAQ page
├── contact.html               # Contact Us page
├── 404.html                   # Error page for GitHub Pages
├── .htaccess                  # Apache rewrite rules for clean URLs
├── _redirects                 # Netlify redirects for clean URLs
├── css/
│   ├── style.css              # Global styles and design system
│   └── components.css         # Reusable components (navbar, cards, etc.)
├── js/
│   └── main.js                # Navigation, animations, dark mode
├── assets/                    # Placeholder for images and SVGs
└── README.md                  # This file
```

## Pages

### index.html – Homepage
- Hero section with call-to-action buttons
- Accreditation badges (HWSETA, QCTO)
- Featured courses showcase
- Student testimonials
- Quick contact strip
- Newsletter signup placeholder

### about.html – About Us
- Mission statement
- History and purpose
- Accreditation details
- Important disclaimer (NOT registered with SANC)
- Location and facilities
- Financial accessibility information
- Why choose Kunokhanya section

### courses.html – Courses & Fees
- Main qualifications (HPO, CHW, HBCG, OHBCG)
- Short programmes and part qualifications
- Fees table with placeholder pricing
- Financial assistance options
- Entry requirements for local and foreign nationals

### apply.html – How to Apply
- Walk-in application path
- Online enquiry form (placeholder)
- Step-by-step application process
- Important information about registration fees
- FAQ link

### faq.html – FAQ
- Accordion-style FAQ with smooth animations
- 12 common questions covering:
  - Grade requirements
  - Age limits
  - Weekend classes
  - Foreign nationals
  - Accommodation
  - Job placement
  - Uniforms and stationery
  - Course duration
  - Payment options
  - Qualifications
  - Contact information
  - SANC registration status

### contact.html – Contact Us
- Contact information (phone, email, WhatsApp, fax)
- Office hours and location
- Embedded Google Maps
- Contact form (placeholder)
- Social media links
- Quick links to other pages

### 404.html – Error Page
- Custom 404 page matching site design
- Links back to main pages
- Required for GitHub Pages

## Clean URLs Implementation

This website uses clean URLs (without `.html` extensions). Three methods are provided:

### 1. GitHub Pages (Recommended)
GitHub Pages automatically serves `index.html` for directory requests. Simply use:
- `/` for homepage
- `/about` for about page
- `/courses` for courses page
- etc.

### 2. Apache Server (.htaccess)
If hosting on Apache, the included `.htaccess` file handles URL rewriting:
```apache
RewriteRule ^([^\.]+)$ $1.html [NC,L]
```

### 3. Netlify (_redirects)
If hosting on Netlify, the `_redirects` file provides clean URL routing.

## Design System

### Colors
- **Primary**: `#294A70` (Dark Navy Blue)
- **Accent**: `#FF005A` (Vibrant Red)
- **Light Surface**: `#FFFFFF`
- **Dark Surface**: `#1A1A1A`

### Typography
- **Headings**: Instrument Serif (Google Fonts)
- **Body**: Work Sans (Google Fonts)

### Spacing Scale
- xs: 0.5rem
- sm: 1rem
- md: 1.5rem
- lg: 2rem
- xl: 3rem
- 2xl: 4rem

### Breakpoints
- Mobile: 375px
- Tablet: 768px
- Desktop: 1280px

## JavaScript Features

### Theme Toggle
- Automatic detection of system preference (light/dark mode)
- Manual toggle via sun/moon icon in navbar
- Persisted in localStorage

### Navigation
- Sticky header with scroll detection
- Mobile menu toggle
- Smooth scroll behavior
- Active link highlighting

### Animations
- Fade-in and upward translate on section entry
- Respects `prefers-reduced-motion` for accessibility
- Smooth accordion animations

### Accessibility
- Keyboard navigation support
- Screen reader announcements
- ARIA labels and roles
- Semantic HTML5 structure

## Deployment to GitHub Pages

### Step 1: Create a GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it something like `kunokhanya-website`
3. Initialize with a README (optional)

### Step 2: Upload Files
1. Click "Add file" → "Upload files"
2. Drag and drop the entire `kunokhanya` folder contents
3. Commit the changes

### Step 3: Enable GitHub Pages
1. Go to repository Settings
2. Scroll to "GitHub Pages" section
3. Select "Deploy from a branch"
4. Choose "main" branch and root folder
5. Save

### Step 4: Access Your Site
Your site will be live at: `https://[your-username].github.io/kunokhanya-website/`

Clean URLs will work automatically:
- `https://[your-username].github.io/kunokhanya-website/`
- `https://[your-username].github.io/kunokhanya-website/about`
- `https://[your-username].github.io/kunokhanya-website/courses`

## Customization

### Update Contact Information
Edit the phone, email, and address in all HTML files. Search for:
- `011 331 0205` (phone)
- `082 346 9676` (cell)
- `kunokhanya@safrica.com` (email)
- `30 Von Brandis & Main St` (address)

### Change Brand Colors
Edit `css/style.css` and update the CSS custom properties:
```css
--color-primary: #294A70;
--color-accent: #FF005A;
```

### Add Your Logo
Replace the SVG logo in the navbar with your own. Edit the `<svg>` element in the navbar.

### Update Courses
Edit the course cards in `courses.html` to match your current offerings.

### Connect Forms
The enquiry and contact forms are placeholders. To make them functional, you'll need to:
1. Set up a backend service (Formspree, Netlify Forms, etc.)
2. Update the form `action` attribute
3. Add appropriate form handling

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- No external dependencies (except Google Fonts and Lucide Icons CDN)
- Minimal CSS (~15KB minified)
- Minimal JavaScript (~8KB minified)
- Lazy loading for images
- Optimized for Core Web Vitals

## Accessibility

- WCAG AA contrast compliance
- Semantic HTML5 structure
- Keyboard navigation support
- Screen reader friendly
- Respects `prefers-reduced-motion`
- ARIA labels and roles where appropriate

## License

This website template is provided as-is for Kunokhanya Training Academy.

## Support

For questions or issues with the website, contact:
- **Phone**: 011 331 0205
- **Cell**: 082 346 9676
- **Email**: kunokhanya@safrica.com
- **WhatsApp**: [Chat on WhatsApp](https://wa.me/27823469676)

---

Built with care for Kunokhanya Training Academy. Quality in Style.
