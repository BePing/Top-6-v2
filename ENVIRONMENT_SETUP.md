# Environment Setup Guide

This document explains how to configure environment variables for the championship computation system.

## Environment Variables Loading

The application automatically loads environment variables from a `.env` file using the `dotenv` package. This happens at the very start of the application in `src/main.ts`.

### Setup Steps

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables in the `.env` file:**

### Required Environment Variables

#### `GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS`
**Purpose**: Path to your Firebase service account JSON file
**Example**: `/path/to/your/firebase-service-account.json`
**How to get it**:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file to your project directory
4. Set the full path in this environment variable

#### `OPENAI_API_KEY` (Optional)
**Purpose**: OpenAI API key for AI-powered regional summaries
**Example**: `sk-your-openai-api-key-here`
**How to get it**:
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Set the key in this environment variable
4. Leave empty to disable AI summaries

### Optional Environment Variables

#### `NODE_ENV`
**Purpose**: Application environment
**Default**: `development`
**Options**: `development`, `production`, `test`

#### `DEBUG`
**Purpose**: Enable debug logging
**Default**: `false`
**Options**: `true`, `false`

## How Environment Variables Are Used

### Firebase Configuration
- The system reads `GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS` to locate the Firebase service account file
- This can be overridden with the `--googleJSONCredentialsPath` command line argument
- The path is used to initialize Firebase Admin SDK for Firestore access

### OpenAI Integration
- The `OPENAI_API_KEY` is read directly by the AI Summary Service
- If not provided, AI summaries are automatically disabled
- The system logs whether OpenAI is enabled or disabled during startup

### Command Line vs Environment Variables
The system supports both:
- **Environment Variables**: Set in `.env` file (recommended for development)
- **Command Line Arguments**: Override environment variables when provided

**Priority Order**:
1. Command line arguments (highest priority)
2. Environment variables from `.env` file
3. Default values (lowest priority)

## Startup Logging

When the application starts, it logs the status of key environment variables:

```
🔧 Environment variables loaded:
   - GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS: SET
   - OPENAI_API_KEY: SET
   - NODE_ENV: development
```

## Troubleshooting

### Firebase Issues
If you see errors about Google Service Account:
- ❌ Check that the file path in `GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS` is correct
- ❌ Ensure the JSON file exists and is readable
- ❌ Verify the JSON file format is valid
- ❌ Check file permissions

### OpenAI Issues
If AI summaries are not working:
- ❌ Check that `OPENAI_API_KEY` is set and valid
- ❌ Verify you have sufficient OpenAI credits
- ❌ Check the API key format (should start with `sk-`)

### Environment File Not Loading
If environment variables aren't being loaded:
- ❌ Ensure `.env` file is in the project root directory
- ❌ Check that `.env` file format is correct (no spaces around `=`)
- ❌ Verify the `.env` file is not in `.gitignore`
- ❌ Make sure `dotenv.config()` is called before using variables

## Example .env File

```bash
# Championship Computation Environment Variables

# Firebase Configuration
GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS=/Users/yourusername/project/firebase-key.json

# OpenAI Configuration
OPENAI_API_KEY=sk-1234567890abcdef...

# Runtime Configuration  
NODE_ENV=development
DEBUG=false
```

## Security Notes

- **Never commit your `.env` file to version control**
- Keep your Firebase service account JSON file secure
- Rotate your OpenAI API key regularly
- Use different keys for development and production environments
- Set appropriate file permissions for sensitive files (600 or 644)

The `.env` file is already included in `.gitignore` to prevent accidental commits.