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
    this._loggingService.debug('GOOGLE SERVICE ACCOUNT')
    const pathToFile = this.commandConfigurationService.googleCredentialsJSONPath;
    if (!pathToFile) {
      this._loggingService.error('Google service account information not found!');
      process.exit(1);
    }
    this._loggingService.trace('Loading from ' + pathToFile);
    try {
      const apiKeys = fs.readFileSync(pathToFile, 'utf8');
      const credentials = JSON.parse(apiKeys);
      Container.set(
        'firebase.admin',
        admin.initializeApp({credential: admin.credential.cert(credentials)}),
      );

    } catch (e) {
      this._loggingService.error('Error when loading Google Service Account!');
      process.exit(1);
    }
  }
}
