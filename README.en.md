# JSON-LD Schema Viewer

English | [日本語](./README.md)

A tool to visualize and validate JSON-LD structured data from websites

Production: https://json-ld-view.vercel.app/

## Key Features

- Bypass CORS restrictions to access any URL
- Verify localhost sites during development
- Switch between table and JSON format display
- Copy JSON data with one click
- Display image URLs with thumbnails
- AI Job Posting Advisor: Automatic analysis from employer/applicant perspectives when JobPosting schema is detected
- AI Blog Reviewer: SEO and content quality analysis for Article/BlogPosting schemas
- Web Advisor (General): SEO/EEAT/accessibility analysis for pages without schemas or with only WebPage schema
- Content Upload Reviewer: AI review of files/text, job posting and resume matching
- Skill Sheet Management: Create and manage engineering resumes

## Table of Contents

- [Key Features](#key-features)
- [User Guide](#user-guide)
  - [JSON-LD Extraction and Display](#json-ld-extraction-and-display)
  - [AI Job Posting Advisor](#ai-job-posting-advisor)
  - [AI Blog Reviewer](#ai-blog-reviewer)
  - [AI Web Advisor](#ai-web-advisor)
  - [Content Upload Reviewer](#content-upload-reviewer)
  - [Skill Sheet Management](#skill-sheet-management)
  - [My API Settings (Custom API Key)](#my-api-settings-custom-api-key)
- [Quick Start (For Developers)](#quick-start-for-developers)
- [Tech Stack](#tech-stack)
- [API Endpoints](#api-endpoints)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)

## User Guide

### JSON-LD Extraction and Display

Easily visualize and validate JSON-LD structured data from any website.

#### Basic Usage (Estimated time: ~1 minute)

**Step 1: Access the Site**

1. Open https://json-ld-view.vercel.app/ in your browser
2. Confirm that the top page is displayed

**Step 2: Enter URL**

1. Click on the "Enter URL" text field at the top of the screen
2. Enter the URL of the website you want to verify
   - Example: `https://schema.org/`
   - Example: `https://developers.google.com/search/docs/appearance/structured-data`
3. Enter the URL in complete format (including `https://` or `http://`)

**Step 3: Extract Data**

1. Click the "Extract" button (on the right side of the URL field)
2. A loading indicator will be displayed
3. After a few seconds, the extracted JSON-LD data will be displayed on the screen

**Expected Results**:
- JSON-LD schema types are displayed (e.g., Organization, Article, JobPosting)
- Data is formatted in an easy-to-read table format
- Thumbnail images are displayed if image URLs are present

**Step 4: Switch Display Format**

1. Click the "Table View" or "JSON View" button at the bottom of the screen
   - **Table View**: Properties and values displayed in table format (initial state)
   - **JSON View**: Displayed in raw JSON format with code formatting
2. The display format switches in real-time

**Step 5: Copy Data**

1. Click the "Copy JSON" button
2. A confirmation message "Copied" will be displayed
3. The copied data can be pasted into any text editor

**Troubleshooting**:
- **"JSON-LD not found" message**: The page does not contain JSON-LD structured data
- **Timeout error**: The target site may be slow to respond. Try again or test with a different URL
- **CORS error**: If an error appears in the browser console, reload the page and try again

#### For Sites Requiring Basic Authentication (Estimated time: ~2 minutes)

You can also extract JSON-LD data from sites that require Basic Authentication (username and password).

**Step 1: Open Authentication Section**

1. Enter the URL in the input field
2. Click the "Authentication" collapsible section below the URL field
3. The authentication information input form will expand

**Step 2: Enter Authentication Information**

1. Enter the authentication username in the "Username" field
2. Enter the password in the "Password" field
3. The password is initially displayed as masked characters (●●●)
4. Click the "Show Password" checkbox to verify the password

**Step 3: Extract Data**

1. Click the "Extract" button
2. Authentication information is automatically sent to access the site
3. If authentication succeeds, JSON-LD data will be displayed

**Expected Results**:
- Authentication succeeds and JSON-LD data is displayed normally
- Authentication information is automatically saved in local storage (per domain)
- Authentication information is auto-filled when accessing the same domain next time

**Step 4: Delete Authentication Information (Optional)**

1. Open the authentication section
2. Click the "Delete" button
3. Saved authentication information is deleted
4. A confirmation message is displayed

**Security Notes**:
- Authentication information is stored only in the browser's local storage
- It is not sent to or stored on the server
- Passwords are not recorded in plain text in server logs

**Troubleshooting**:
- **"401 Unauthorized" error**: Username or password is incorrect
- **Authentication information not saved**: Check if you are using browser private mode

#### Localhost URL Verification (For Developers・Estimated time: ~3 minutes)

You can also verify JSON-LD extraction on localhost sites during development. Since Vercel environment cannot access localhost, you need to run the tool locally.

**Prerequisites**:
- Node.js v18 or higher installed
- pnpm installed (`npm install -g pnpm`)
- The localhost site you want to verify is running

**Step 1: Run Tool Locally**

1. Open terminal
2. Navigate to the project directory
   ```bash
   cd /path/to/json-scheme-checker
   ```
3. Install dependencies (first time only)
   ```bash
   pnpm install
   ```
4. Start development server
   ```bash
   pnpm dev
   ```
5. Confirm "Server is running on http://localhost:3333" message is displayed

**Step 2: Access in Browser**

1. Open `http://localhost:3333` in your browser
2. Confirm the top page is displayed

**Step 3: Enter Localhost URL**

1. Enter the URL of the localhost site you want to verify in the URL field
   - Example: `http://localhost:8000`
   - Example: `http://localhost:3000/blog/article`
2. Click the "Extract" button
3. The tool automatically accesses the localhost site via proxy

**Expected Results**:
- JSON-LD data is successfully extracted from the localhost site
- No CORS restrictions

**Step 4: Test from Mobile Devices on LAN (Optional)**

1. Check your IP address in terminal
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig
   ```
2. Open `http://<your-ip>:3333` in mobile device browser
   - Example: `http://192.168.1.100:3333`
3. You can verify localhost sites from other devices on the same LAN

**Troubleshooting**:
- **Port 3333 in use**: Check process with `lsof -i :3333` and kill with `kill $(lsof -t -i:3333)`
- **Localhost connection error**: Verify that the target localhost site is running
- **IPv6 error**: The tool automatically converts `localhost` to `127.0.0.1`, but if problems occur, use the IP address directly

### AI Job Posting Advisor (Estimated time: ~3 minutes)

AI automatically analyzes and provides advice for job postings where JobPosting schema is detected. Free version allows 50 uses per 24 hours.

**Prerequisites**:
- URL of a job posting page containing JobPosting schema
- Free version: Less than 50 uses within 24 hours
- Or custom OpenAI API key configured (unlimited)

**Step 1: Extract JSON-LD from Job Posting Page**

1. Enter the URL of a job posting page (e.g., Indeed, Wantedly, Green job detail pages)
2. Click the "Extract" button
3. Confirm JSON-LD data is displayed
4. Verify JobPosting schema is included (@type: "JobPosting")

**Expected Results**:
- Job information is displayed in table format
- Fields such as job title, salary, location, employment type are displayed
- "AI Job Posting Advisor" button is automatically displayed

**Step 2: Launch Advisor**

1. Click the "AI Job Posting Advisor" button displayed below the JSON-LD data
2. The advisor panel expands
3. Three analysis perspectives are displayed

**Step 3: Select Analysis Perspective**

Choose from the following three:

1. **Employer Perspective**:
   - For corporate recruiters
   - Specific improvement proposals to enhance job posting appeal
   - Strategies to increase applicants
   - When to select: When you want to improve the job posting

2. **Applicant Perspective**:
   - Evaluation from job seeker's viewpoint
   - Identifies job posting attractiveness and missing information
   - Clarifies points of interest to applicants
   - When to select: When you want to know how applicants feel

3. **Agent Perspective**:
   - For recruitment agents
   - Detailed analysis of technical requirements
   - Candidate matching perspective
   - Market value assessment
   - When to select: When you want to delve into technical requirements

**Step 4: Review AI Analysis**

1. Click the button for your selected perspective
2. "Analyzing..." message is displayed
3. After a few seconds, AI advice is displayed in real-time streaming
4. Displayed in readable format with Markdown formatting (headings, lists, bold)
5. When analysis completes, token usage and cost are displayed (when using My API)

**Expected Results (Employer Perspective Example)**:
- Analysis of job posting strengths and weaknesses
- Specific improvement proposals (bullet points)
- Keyword suggestions to enhance appeal
- Differentiation points from competitors

**Step 5: Export Results (Optional)**

Export buttons appear when analysis is complete:

1. **Export as CSV**:
   - Click "Download CSV" button
   - `advisor_result_<timestamp>.csv` is downloaded
   - Manage analysis results in spreadsheet

2. **Export as HTML**:
   - Click "Download HTML" button
   - `advisor_result_<timestamp>.html` is downloaded
   - Open in browser for printing/sharing

**About Rate Limits**:

- **Free Version (Server API Key)**:
  - 50 uses per 24 hours
  - Independent counts for each advisor (JobPosting, Blog, Web Advisor)
  - Remaining uses displayed at bottom of screen
  - "Rate limit reached" message when limit is hit

- **My API Mode (Custom API Key)**:
  - Unlimited usage
  - Real-time usage and cost tracking
  - OpenAI API charges apply

**Troubleshooting**:
- **"AI Job Posting Advisor" button not displayed**: No JobPosting schema included. Try a different job posting page
- **"Rate limit reached"**: Try again after 24 hours or configure your own API key
- **Analysis stops midway**: Possible network error. Click the button again

### AI Blog Reviewer

AI analyzes blog articles where Article/BlogPosting schema is detected from SEO and content quality perspectives.

**Quick Guide**: Similar to Job Posting Advisor, but for blog articles. Extract JSON-LD from blog articles containing Article/BlogPosting schema, then launch the reviewer for SEO analysis, EEAT evaluation, reader engagement analysis, and content quality assessment.

### AI Web Advisor

Provides comprehensive web optimization advice for pages without schemas or with only WebPage schema.

**Quick Guide**: For general web pages, launch Web Advisor to receive SEO optimization, EEAT evaluation, accessibility evaluation, and priority action items.

### Content Upload Reviewer

Upload files or text for AI review, proofreading, and matching analysis.

**Quick Guide**: Click "Upload" button in header, select review type (blog content, job posting, skill sheet, job×resume matching, general text), input content or upload file, start review, and view results in diff format.

### Skill Sheet Management

Create and manage engineering resumes (skill sheets).

**Quick Guide**: Click "My Skill Sheet" button in header, switch tabs to input information (basic info, professional, work history, projects, skills, certifications, links, profile), auto-save to local storage, export in Markdown/JSON/text format, and send to Content Upload Reviewer for AI review.

### My API Settings (Custom API Key)

Configure your own OpenAI API key to use all features without rate limits.

**Quick Guide**:
1. Click "My API" button in header
2. Enter OpenAI API key (format: `sk-...`)
3. Select model (Free: gpt-5-nano/gpt-4.1-nano, My API: gpt-5/gpt-4.1/gpt-4o/o3 series)
4. Click "Save"
5. Usage and cost displayed after each AI analysis

**Benefits**:
- No rate limits
- Access to high-performance models
- Real-time cost management
- Data not stored on server

## Quick Start (For Developers)

### Local Development

```bash
# Install dependencies
pnpm install

# Start development server (auto-restart)
pnpm dev

# Open in browser
# http://localhost:3333
```

### Environment Variables (For AI Features)

```bash
cp .env.example .env
# Edit .env and set OpenAI API key
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5-nano
```

### Deploy to Vercel

```bash
vercel --prod
```

Set environment variables in Vercel dashboard.

## Tech Stack

- **Backend**: Node.js + Express + Axios
- **Frontend**: Vanilla JavaScript + CSS3 + HTML5
- **AI Features**: OpenAI GPT-5 nano

## API Endpoints

### GET /proxy

Retrieve HTML from specified URL

```bash
curl "http://localhost:3333/proxy?url=https://example.com"
```

### POST /extract-jsonld

Extract JSON-LD directly from URL

```bash
curl -X POST http://localhost:3333/extract-jsonld \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### POST /api/advisor

JobPosting analysis (streaming)

```bash
curl -X POST http://localhost:3333/api/advisor \
  -H "Content-Type: application/json" \
  -d '{"jobPosting": {...}, "mode": "employer"}'
```

### GET /health

Health check

```bash
curl http://localhost:3333/health
```

## Security Notes

### Rate Limiting

Rate limits are managed on the browser side (localStorage). Each advisor has independent limits, so multiple people accessing from the same IP can each use 50 times.

### API Key Management

- Server API key protected by environment variables
- Users can use their own API keys
- `.env` file included in `.gitignore`

## Troubleshooting

| Issue | Solution |
| --------------------- | ----------------------------------------------------- |
| CORS error | Verify server is running, check with `/health` |
| Localhost access fails | Use local environment instead of Vercel, verify port number |
| Timeout | Target site slow to respond, check network |
| AI features not working | Set OpenAI API key, verify environment variables |

## AI Assistant (Claude Code) Utilization

This project actively utilizes AI assistants (Claude Code) to maximize development efficiency. For comprehensive information, we recommend starting with the following guide:

- **[AI Assistant Utilization Guide](./.ai-docs/AI_ASSISTANT_GUIDE.md)** - **(Start here)** Explains the overall picture of AI-related features including MCP, Skills, SubAgent, etc.

### Quick Reference: Main Skills

- `code-review`: Execute code review
- `api-check`: Check API specification quality
- `deploy-check`: Execute pre-deployment checklist

See individual guides for details.

## Documentation

- [Claude Code Development Guide](./CLAUDE.md) - Development environment setup and usage
- [Developer Operations Manual](./DEVELOPMENT.md) - Operations and maintenance guide for developers
- [Claude Code Skills Guide](./.ai-docs/shared/09_CLAUDE_CODE_SKILLS.md) - Custom skills details

## Reference Links

- [Schema.org](https://schema.org/)
- [JSON-LD Specification](https://json-ld.org/)
- [OpenAI API](https://platform.openai.com/)

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss.

---

Last updated: 2025-11-12
