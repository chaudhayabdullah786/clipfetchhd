# ClipFetchHD

**ClipFetchHD** is a full-stack web application for downloading publicly accessible Instagram Reels as MP4 files through a simple, responsive interface.

The project includes a production-ready Reel extraction pipeline, video preview and download flow, admin dashboard, CMS, blog management, SEO tools, analytics, theme controls, and configurable advertising placements.

🌐 **Website:** https://clipfetchhd.online

> ClipFetchHD is an independent project and is not affiliated with, endorsed by, or sponsored by Instagram or Meta.

---

## Features

### Instagram Reel Downloader

* Public Instagram Reel URL validation
* Real Reel extraction
* Video preview before download
* MP4 download support
* HTTP range streaming for video previews
* Temporary secure preview/download sessions
* Invalid and unavailable Reel handling
* No demo or fake fallback videos
* Mobile and desktop support

### Modern Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Responsive layout
* Light and dark themes
* Accessible navigation
* Interactive FAQ sections
* Mobile-friendly downloader interface

### Admin Dashboard

Secure admin portal with:

* Dashboard analytics
* Page Content Manager
* Blog Manager
* SEO Manager
* Advertisement Manager
* Site settings
* Light/dark mode
* Protected admin APIs
* Secure session authentication

### Content Management System

The integrated CMS supports:

* Draft and published page versions
* Content blocks
* Rich content editing
* FAQ sections
* Feature sections
* Step-by-step guides
* Page previews
* Publishing workflow
* Version history
* Rollback support
* Per-page SEO configuration

### Blog System

* Create and edit blog posts
* Draft/publish workflow
* Categories
* Tags
* Search
* Featured images
* Markdown/content rendering
* SEO metadata
* Social metadata
* Related content
* Internal linking

### SEO System

ClipFetchHD includes a dynamic SEO management system with:

* Page titles
* Meta descriptions
* Canonical URLs
* Robots directives
* Open Graph tags
* X/Twitter metadata
* JSON-LD structured data
* Dynamic XML sitemap
* Dynamic robots.txt
* SEO diagnostics
* Index/noindex controls
* Social sharing metadata
* Search-engine verification support

### Security

The backend includes protections for:

* SSRF attempts
* Private/local network URLs
* Unsafe protocols
* Invalid media responses
* Unauthorized admin access
* Expired preview/download sessions
* Malicious CMS content
* Unsafe HTML/script injection

Admin passwords are stored using bcrypt hashes.

Sensitive credentials must be configured through environment variables and must never be committed to Git.

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Lucide icons

### Backend

* Node.js
* Express
* TypeScript
* JWT authentication
* bcrypt

### Database

* SQLite

Used for:

* Admin data
* Analytics
* CMS
* Blog posts
* SEO configuration
* Ad configuration
* Content versions

---

## Project Architecture

```text
ClipFetchHD
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── theme/
│   └── App.tsx
│
├── services/
│   └── cms/
│       ├── CMS database
│       ├── SEO engine
│       └── HTML renderer
│
├── public/
│
├── server.ts
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

The exact internal structure may evolve as the project grows.

---

## Application Flow

```text
User
  ↓
Paste public Instagram Reel URL
  ↓
URL validation
  ↓
Instagram extraction provider
  ↓
Media verification
  ↓
Temporary secure session
  ↓
Video preview
  ↓
MP4 download
```

---

## Installation

### 1. Clone the repository

```bash
git clone <YOUR-GITHUB-REPOSITORY-URL>
cd <YOUR-REPOSITORY-FOLDER>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file for local development.

Example:

```env
NODE_ENV=development

SITE_URL=http://localhost:3000

JWT_SECRET=replace-with-a-long-random-secret

ADMIN_USERNAME=your-admin-username

ADMIN_PASSWORD_HASH=your-valid-bcrypt-password-hash

INSTAGRAM_PROVIDER=direct
```

Optional provider configuration may include:

```env
INSTAGRAM_API_BASE_URL=
INSTAGRAM_API_ENDPOINT=
INSTAGRAM_API_KEY=
```

Do not commit real secrets.

---

## Generate an Admin Password Hash

The application expects:

```env
ADMIN_PASSWORD_HASH
```

to contain a valid bcrypt hash rather than a plaintext password.

Generate the hash locally using the project's bcrypt dependency or a secure local Node.js script.

Never place the plaintext admin password in:

* GitHub
* README
* source code
* public environment files
* frontend code

---

## Development

Start the development environment using the project's configured npm script:

```bash
npm run dev
```

Then open the local URL displayed by the development server.

---

## TypeScript Validation

```bash
npx tsc --noEmit
```

---

## Production Build

```bash
npm run build
```

The current production architecture builds the frontend and server application for deployment.

---

## Production Start

The production server is expected to run from the compiled server bundle.

Current production entry:

```bash
node dist/server.cjs
```

Prefer using the package.json start script:

```bash
npm start
```

The `start` script should resolve to the correct production server entry.

---

## Hostinger Deployment

ClipFetchHD is designed to be deployed as a Node.js application.

Recommended Hostinger configuration:

```text
Framework preset: Express
Branch: main
Node version: 22.x
Root directory: ./
```

### Build

Use the repository's production build script:

```bash
npm run build
```

### Start

The production start script should run the compiled Express application:

```bash
npm start
```

The application server should listen using the hosting-provided port when available:

```ts
process.env.PORT
```

with an appropriate local fallback.

Do not hardcode a production-only port.

---

## Hostinger Environment Variables

Configure secrets through:

**Hostinger → Node.js Application → Environment Variables**

Required production configuration:

```env
NODE_ENV=production

SITE_URL=https://clipfetchhd.online

JWT_SECRET=<strong-random-production-secret>

ADMIN_USERNAME=<production-admin-username>

ADMIN_PASSWORD_HASH=<valid-bcrypt-hash>

INSTAGRAM_PROVIDER=direct
```

Optional external provider configuration:

```env
INSTAGRAM_API_BASE_URL=
INSTAGRAM_API_ENDPOINT=
INSTAGRAM_API_KEY=
```

Do not upload a production `.env` file to GitHub.

---

## Domain

Production domain:

```text
https://clipfetchhd.online
```

Recommended canonical host:

```text
https://clipfetchhd.online
```

Production should redirect alternate variants to the preferred HTTPS non-www domain where supported.

---

## Public Routes

Examples include:

```text
/
/how-it-works
/faq
/blog
/about
/contact
/privacy-policy
/terms
/dmca
```

---

## Admin

Admin access is available through:

```text
/admin
```

Admin credentials are intentionally **not documented in this repository**.

Configure them securely through environment variables.

---

## SEO

Production SEO features include:

```text
/sitemap.xml
/robots.txt
```

The application also supports:

* Dynamic canonical URLs
* Open Graph metadata
* X/Twitter cards
* Structured data
* Page-specific metadata
* Index controls
* Blog metadata
* Search Console verification

After production deployment, the sitemap can be submitted to Google Search Console:

```text
https://clipfetchhd.online/sitemap.xml
```

---

## Responsible Use

ClipFetchHD is intended for lawful and responsible use.

Users should only download or reuse media that:

* They own
* They have permission to use
* They are otherwise legally authorized to access and reuse

Downloading content does not automatically grant copyright or redistribution rights.

---

## Privacy & Temporary Media Sessions

The Reel processing pipeline uses temporary preview/download sessions.

Temporary media identifiers are not intended to become permanent public SEO pages.

Application privacy behavior should remain consistent with the published Privacy Policy.

---

## Production Checklist

Before deployment:

* TypeScript passes
* Production build passes
* Environment variables configured
* `.env` excluded from Git
* Admin credentials not committed
* Reel extraction tested
* Video preview tested
* MP4 download tested
* Admin login tested
* CMS tested
* Blog tested
* Theme tested
* Sitemap tested
* robots.txt tested
* Domain configured
* HTTPS active

After deployment:

* Test a real public Reel
* Test admin login
* Test CMS publishing
* Test blog pages
* Verify sitemap
* Verify robots.txt
* Verify canonical URLs
* Add domain to Google Search Console
* Submit sitemap
* Configure Bing Webmaster Tools if required
* Configure analytics if required

---

## License

No open-source license is granted unless a license file is explicitly included in this repository.

All rights are reserved by the project owner unless otherwise stated.

---

## Disclaimer

ClipFetchHD is an independent utility and is not affiliated with Instagram, Meta Platforms, Inc., or any related company.

Instagram and related trademarks belong to their respective owners.
