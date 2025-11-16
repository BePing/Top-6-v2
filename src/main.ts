

import * as dotenv from 'dotenv';
import randomIP from 'random-ipv4';

import { container } from "./common/di-container";
import { ServiceFactory } from "./common/service-factory";
import axios from "axios";
import axiosRetry from "axios-retry";

// Load environment variables from .env file
dotenv.config();

// Debug: Log environment variables loading status
console.log('🔧 Environment variables loaded:');
console.log(`   - GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS: ${process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS ? 'SET' : 'NOT SET'}`);
console.log(`   - OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
console.log(`   - MAKE_FACEBOOK_POST_URL: ${process.env.MAKE_FACEBOOK_POST_URL ? 'SET' : 'NOT SET'}`);
console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'NOT SET'}`);

function configureGlobalAxios() {
  // Configure the global axios instance instead of creating a new one
  axiosRetry(axios, {
    retries: 3,
    retryCondition: () => true,
    retryDelay: (retryCount) => retryCount * 5_000,
  });
  return axios;
}

const run = async () => {
  // Set up the container with basic services (register function-types as values)
  container.setMany([
    { id: 'randomip', value: randomIP },
    { id: 'axios', value: configureGlobalAxios() },
  ]);

  // Initialize Firebase Admin if credentials are available
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS) {
    try {
      // Use dynamic imports to avoid linting issues
      const admin = await import('firebase-admin');
      
      // Read the JSON file synchronously instead of importing it
      const fs = await import('fs');
      const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS;
      const serviceAccountData = fs.readFileSync(serviceAccountPath, 'utf8');
      const serviceAccount = JSON.parse(serviceAccountData);
      
      const firebaseApp = admin.default.initializeApp({
        credential: admin.default.credential.cert(serviceAccount)
      });
      container.set('firebase.admin', firebaseApp);
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      container.set('firebase.admin', undefined);
    }
  } else {
    console.log('⚠️  No Firebase credentials provided, Firebase Admin SDK will not be initialized');
    container.set('firebase.admin', undefined);
  }

  // Create and register the configuration service
  const configService = ServiceFactory.createConfigurationService();
  container.set('ConfigurationService', configService);
  await configService.init();

  // Ensure configuration is fully loaded before creating dependent services
  console.log('✅ Configuration service fully initialized');
  
  // Create and run the main services
  const ingestionService = ServiceFactory.createIngestionService();
  const processingService = ServiceFactory.createProcessingService();
  const digestingService = ServiceFactory.createDigestingService();

  console.log('✅ All services created, starting ingestion...');
  await ingestionService.ingest();
  await processingService.process();
  await digestingService.digest();
}

// Run if this is the main module
if (require.main === module) {
  run().catch(console.error);
}



