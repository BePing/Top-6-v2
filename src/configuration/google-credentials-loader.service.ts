import {RuntimeConfigurationService} from './runtime-configuration.service';
import fs from 'fs';
import {LoggingService} from '../common';
import admin from 'firebase-admin';
import {Container, Service} from 'typedi';

@Service()
export class GoogleCredentialsLoaderService {

  constructor(
    private readonly commandConfigurationService: RuntimeConfigurationService,
    private readonly _loggingService: LoggingService,
  ) {
  }

  async init(): Promise<void> {
    this._loggingService.debug('🔧 Initializing Google Service Account...');
    const pathToFile = this.commandConfigurationService.googleCredentialsJSONPath;
    
    if (!pathToFile) {
      this._loggingService.error('❌ Google service account path not found!');
      this._loggingService.error('💡 Please set GOOGLE_SERVICE_ACCOUNT_JSON_CREDENTIALS in your .env file');
      this._loggingService.error('💡 Or provide --googleJSONCredentialsPath command line argument');
      process.exit(1);
    }
    
    this._loggingService.info(`📁 Loading Google credentials from: ${pathToFile}`);
    
    try {
      if (!fs.existsSync(pathToFile)) {
        this._loggingService.error(`❌ Google service account file not found at: ${pathToFile}`);
        this._loggingService.error('💡 Please ensure the file exists and the path is correct');
        process.exit(1);
      }
      
      const apiKeys = fs.readFileSync(pathToFile, 'utf8');
      const credentials = JSON.parse(apiKeys);
      
      Container.set(
        'firebase.admin',
        admin.initializeApp({credential: admin.credential.cert(credentials)}),
      );

      this._loggingService.info('✅ Firebase Admin SDK initialized successfully');
      this._loggingService.trace(`🔑 Using project: ${credentials.project_id}`);
      
    } catch (e) {
      this._loggingService.error('❌ Error loading Google Service Account:', e);
      this._loggingService.error('💡 Please check the JSON file format and permissions');
      process.exit(1);
    }
  }
}
