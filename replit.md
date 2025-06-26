# Luxury Coach Market - Premium Coach Marketplace

## Overview

This is a full-stack RV marketplace application specifically focused on luxury Prevost coaches. The platform combines modern web technologies with automated data scraping to provide a comprehensive marketplace for high-end recreational vehicles. The application features a React frontend with TypeScript, an Express.js backend, PostgreSQL database with Drizzle ORM, and automated web scraping capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI components for accessibility and consistency
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for fast development and optimized builds
- **Component Structure**: Modern component-based architecture with shadcn/ui design system

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript for type safety
- **API Design**: RESTful API with structured endpoints
- **File Uploads**: Static file serving for RV images
- **Middleware**: CORS, JSON parsing, and custom logging middleware

### Database Architecture
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Relational design with proper foreign key relationships
- **Full-Text Search**: PostgreSQL's built-in search capabilities with tsvector

## Key Components

### Core Entities
1. **Users**: Authentication and user management
2. **RV Listings**: Central entity for coach listings
3. **Manufacturers**: Chassis manufacturers (primarily Prevost)
4. **Converters**: Companies that customize the chassis (Marathon, Liberty, etc.)
5. **Chassis Types**: Different chassis models (H3-45, X3-45, etc.)
6. **RV Images**: Multiple images per listing with primary image designation
7. **Favorites**: User bookmarking system
8. **Inquiries**: Contact system for listings

### Search System
- **Full-Text Search**: PostgreSQL tsvector implementation
- **Filtering**: Multi-dimensional filtering by converter, price, year, mileage
- **Sorting**: Price, year, and relevance-based sorting
- **Pagination**: Efficient offset-based pagination

### Web Scraping System
- **Target Site**: prevost-stuff.com
- **Scraper Type**: Detail page scraper with concurrent processing
- **Image Processing**: Downloads and stores up to 20 images per listing
- **Data Extraction**: Comprehensive specification extraction
- **Deduplication**: Uses sourceId for preventing duplicates
- **Automation**: Daily scheduled scraping via GitHub Actions

## Data Flow

### User Search Flow
1. User enters search criteria in frontend
2. Frontend sends query to `/api/search-listings` endpoint
3. Backend processes filters and executes database query
4. Results returned with pagination and facets
5. Frontend displays results with image proxying for external URLs

### Data Ingestion Flow
1. Scraper fetches listing URLs from main page
2. Processes each listing page concurrently (rate limited)
3. Extracts specifications, pricing, and images
4. Downloads images to local storage
5. Creates or updates database records
6. Maintains referential integrity across entities

### Image Handling Flow
1. External images downloaded during scraping
2. Stored locally with unique filenames
3. Database stores local paths
4. Frontend serves images via static file middleware
5. Fallback to proxy endpoint for external images

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Router
- **UI Framework**: Radix UI components, Tailwind CSS
- **HTTP Client**: Axios for API requests
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM with kit for migrations
- **Scraping**: Cheerio for HTML parsing, p-limit for concurrency
- **Build Tools**: Vite, TypeScript, ESBuild

### Development Dependencies
- **Testing**: Not yet implemented
- **Linting**: TypeScript compiler checking
- **Environment**: dotenv for local development

### Python Scripts
- **Web Scraping**: BeautifulSoup4, requests, lxml
- **Database Access**: psycopg2-binary
- **Image Processing**: Built-in libraries

## Deployment Strategy

### Replit Environment
- **Development**: Hot reload with Vite dev server
- **Build Process**: Vite build for frontend, ESBuild for backend
- **Database**: PostgreSQL 16 module
- **Static Files**: Served from public directory
- **Environment Variables**: DATABASE_URL for database connection

### Production Considerations
- **Autoscale Deployment**: Configured for Replit's autoscale target
- **Build Commands**: npm run build for production builds
- **Start Command**: npm run start for production server
- **Port Configuration**: External port 80 maps to internal port 5000

### GitHub Actions Integration
- **Daily Scraping**: Automated daily execution at 5:00 UTC
- **Manual Triggers**: On-demand scraping via workflow dispatch
- **Environment Secrets**: DATABASE_URL stored as repository secret
- **Logging**: Comprehensive logging of scraping activities

## Changelog

- June 26, 2025. Initial setup
- June 26, 2025. Added three core restart components:
  - `prevost_scraper.py`: Standalone scraper for prevost-stuff.com
  - `api.py`: FastAPI backend serving scraped data
  - `SimpleApp.tsx`: Clean React frontend (/simple route)

## User Preferences

Preferred communication style: Simple, everyday language.