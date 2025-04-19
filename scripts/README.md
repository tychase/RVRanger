# RV Marketplace Automation Scripts

This directory contains scripts for automating various tasks in the RV Marketplace platform.

## Daily Scraper

The daily scraper automatically fetches and updates RV listings from prevost-stuff.com.

### Manual Execution

To run the scraper manually:

```bash
# Using npm script (once it's added to package.json)
npm run scrape

# Using npx directly
npx tsx scripts/daily_scraper.ts
```

### Automated Execution with GitHub Actions

The scraper is configured to run automatically once per day at 5:00 UTC (midnight or 1am US time, depending on DST) using GitHub Actions.

#### Setup Requirements

1. Add your `DATABASE_URL` as a GitHub repository secret
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `DATABASE_URL`
   - Value: Your PostgreSQL connection string (same as used in Replit)

2. The GitHub workflow will:
   - Check out the latest code
   - Install dependencies
   - Run any pending database migrations
   - Execute the scraper
   - Log the results

#### Manual Trigger

You can also trigger the scraper manually:
1. Go to the Actions tab in your GitHub repository
2. Select "Daily Coach Scrape" workflow
3. Click "Run workflow"

### Monitoring Results

- Check GitHub Actions logs to see scraper results and any errors
- The scraper logs all activity, including which listings were processed and any issues encountered