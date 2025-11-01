# Scheduled Deployment Guide

This project runs on a schedule using cron-based Docker containers. The application will run automatically at:
- **Sunday**: 18:00 (6 PM)
- **Monday**: 20:00 (8 PM)
- **Thursday**: 08:00 (8 AM)

All times are in **Europe/Brussels** timezone (adjustable via `TZ` environment variable).

### Local Testing

1. **Build the scheduled Docker image:**
   ```bash
   npm run docker:build:scheduled
   ```

2. **Start the scheduled container:**
   ```bash
   npm run docker:compose:scheduled:up
   ```

3. **View logs:**
   ```bash
   npm run docker:compose:scheduled:logs
   ```

4. **Stop the container:**
   ```bash
   npm run docker:compose:scheduled:down
   ```

### Deploying to Coolify

1. **Push to GitHub** (if using GitHub Container Registry):
   ```bash
   docker build -f Dockerfile.scheduled -t ghcr.io/YOUR_USERNAME/top-6-v2:scheduled .
   docker push ghcr.io/YOUR_USERNAME/top-6-v2:scheduled
   ```

2. **In Coolify:**
   - Create a new application
   - Choose "Docker Compose" or "Dockerfile"
   - If using Dockerfile:
     - Dockerfile path: `Dockerfile.scheduled`
     - Build context: `.`
   - If using Docker Compose:
     - Use `docker-compose.scheduled.yml` as your compose file
   - Set environment variables (see below)
   - Mount volumes for:
     - `logs` → `/app/logs`
     - `tmp` → `/app/tmp`
     - `output` → `/app/output`
     - `firebase_sdk.json` → `/app/firebase-credentials/firebase_sdk.json` (read-only)

### Environment Variables

Set these in Coolify:

```env
NODE_ENV=production
TZ=Europe/Brussels
GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS=/app/firebase-credentials/firebase_sdk.json
OPENAI_API_KEY=your-openai-api-key

# Runtime configuration
WEEKLY_SUMMARY=false
PLAYERS_IN_TOP=24
EMAILS=
WEEK_NAME=22
SEND_VIA_EMAIL=false
UPLOAD_TO_FIREBASE=false
POST_TO_FACEBOOK=true
WRITE_FULL_DEBUG=false
```

### Modifying Schedule

Edit `crontab` file to change the schedule:

```cron
# Format: minute hour day-of-month month day-of-week command
# Examples:
# 0 18 * * 0    # Every Sunday at 6 PM
# 0 20 * * 1    # Every Monday at 8 PM
# 0 8 * * 4     # Every Thursday at 8 AM
```

Then rebuild and redeploy the container.

## Monitoring

- **Logs**: Check `/app/logs/scheduled.log` in the container or mounted volume
- **Output**: Check `/app/output` directory for generated files
- **Health**: Container runs `supercronic` which stays alive and monitors cron jobs

## Troubleshooting

1. **Check cron is running:**
   ```bash
   docker exec top-6-scheduled pgrep supercronic
   ```

2. **Check cron schedule:**
   ```bash
   docker exec top-6-scheduled crontab -l
   ```

3. **View application logs:**
   ```bash
   docker exec top-6-scheduled tail -f /app/logs/scheduled.log
   ```

4. **Test manually:**
   ```bash
   docker exec top-6-scheduled runuser -u nodejs -- node /app/dist/main.js
   ```

## Notes

- The scheduled container stays running 24/7 but only executes the application at scheduled times
- All runs are logged to `/app/logs/scheduled.log`
- The container uses `supercronic` which is better suited for Docker than traditional cron
- Timezone can be adjusted via `TZ` environment variable (default: `Europe/Brussels`)

