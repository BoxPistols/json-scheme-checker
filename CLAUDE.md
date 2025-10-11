# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a JSON-LD Schema Viewer tool that visualizes structured data (JSON-LD) from websites. The project is a Node.js/Express application that provides:

1. **CORS Proxy Server** - Bypasses CORS restrictions to access any URL, including localhost sites
2. **Web-based Viewer** - Visualizes JSON-LD data in both table and JSON formats
3. **Standalone Version** - Optional single-file HTML viewer using external CORS proxies

## Project Structure

```plaintext
json-ld-viewer/
├── server.js              # Express server with proxy endpoints
├── package.json           # Dependencies: express, cors, axios
├── package-lock.json      # Lock file
├── vercel.json           # Vercel deployment configuration
├── README.md             # Japanese documentation
├── CLAUDE.md             # This file
├── public/
│   └── index.html        # Main viewer application (integrated with proxy)
└── standalone/
    └── index.html        # Standalone viewer (uses external CORS proxy)
```

## Common Development Commands

**Setup**:
```bash
npm install
```

**Development**:
```bash
npm run dev    # Start with nodemon (auto-reload on changes)
npm start      # Start production server
```

The server runs on `http://localhost:3333` by default (configurable via `PORT` environment variable).

**Testing**:
```bash
# Health check
curl http://localhost:3333/health

# Test proxy endpoint
curl "http://localhost:3333/proxy?url=https://example.com"

# Test JSON-LD extraction
curl -X POST http://localhost:3333/extract-jsonld \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Vercel Deployment**:
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Architecture

### Standalone Viewer (`standalone/index.html`)

- Pure client-side single HTML file with inline CSS and JavaScript
- Uses external CORS proxy service (`https://api.allorigins.win/raw?url=`)
- Extracts JSON-LD by parsing `<script type="application/ld+json">` tags
- Features:
  - Table view with expandable nested objects
  - Syntax-highlighted JSON view
  - One-click JSON copy to clipboard
  - Statistics dashboard (schema count, property count, domain)
  - Sample links for quick testing

### Node.js Proxy Server (`server.js`)

**Technology Stack**: Express.js, Axios, CORS middleware

**API Endpoints**:

1. `GET /proxy?url={TARGET_URL}` - Fetches HTML from any URL, bypassing CORS
   - Converts localhost to IPv4 (127.0.0.1) to avoid IPv6 issues
   - Adds browser-like headers to avoid bot detection
   - 30-second timeout with 5 max redirects

2. `POST /extract-jsonld` - Directly extracts and parses JSON-LD from URL
   - Body: `{ "url": "https://example.com" }`
   - Returns: `{ url, schemas[], count }`
   - Uses regex to extract JSON-LD script tags

3. `GET /health` - Health check endpoint
   - Returns: `{ status: "ok", timestamp }`

4. `GET /` - Landing page with API documentation

**Key Features**:

- CORS enabled for all origins
- Handles connection errors (ECONNREFUSED, ETIMEDOUT) with appropriate status codes
- Serves static frontend from `public/` directory
- localhost URL normalization (localhost → 127.0.0.1)

### Frontend Architecture (Both Viewers)

**Core Functions**:

- `fetchAndDisplay()` - Main orchestration function
- `extractJsonLd(html)` - Parses HTML using DOMParser to find JSON-LD scripts
- `displaySchemas(schemas, url)` - Renders schema cards with statistics
- `createTableView(obj, depth)` - Recursive table generation for nested objects
- `formatJson(obj, indent)` - Syntax-highlighted JSON formatter
- `toggleView(schemaId, view)` - Switches between table/JSON views

**View Modes**:

- **Table View**: Hierarchical table with property name, value, and type columns
  - Arrays rendered as numbered list items
  - Nested objects expandable/collapsible by default (expanded initially)
  - URLs rendered as clickable links
  - Description fields can contain HTML (sanitized)
- **JSON View**: Syntax-highlighted with color-coded types (keys, strings, numbers, booleans, null)

**Data Handling**:

- Nested objects remain expanded by default for better visibility
- Each schema card stores raw JSON in `data-raw` attribute for clipboard operations
- Copy function formats JSON with 2-space indentation

## Development Notes

- The standalone viewer (`standalone/index.html`) can work independently without running the server, but relies on external CORS proxy services which may have limitations
- The main application (`public/index.html` + `server.js`) provides more reliable access, especially for localhost URLs and sites that block CORS proxies
- When testing localhost sites, the proxy automatically converts `localhost` to `127.0.0.1` to prevent IPv6 resolution issues
- The Vercel deployment configuration (`vercel.json`) routes all requests through the Express server
- Both frontend implementations share similar UI/UX but differ in their data fetching approach (external vs custom proxy)
