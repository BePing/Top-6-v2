import { container } from './di-container';
import { LoggingService } from './logging-service';
import { FileSystemHelper } from './file-system.helper';
import { ConfigurationService } from '../configuration/configuration.service';
import { RuntimeConfigurationService } from '../configuration/runtime-configuration.service';
import { GoogleCredentialsLoaderService } from '../configuration/google-credentials-loader.service';
import { IngestionService } from '../ingestion/ingestion-service';
import { ClubsIngestionService } from '../ingestion/clubs/clubs-ingestion-service';
import { DivisionsIngestionService } from '../ingestion/divisions/divisions-ingestion-service';
import { DivisionsMatchesIngestionService } from '../ingestion/divisions-matches/divisions-matches-ingestion-service';
import { WeeklyMatchesSummaryIngestionService } from '../ingestion/weekly-matches-summary/weekly-matches-summary-ingestion-service';
import { ProcessingService } from '../processing/processing-service';
import { DigestingService } from '../digestion/digesting-service';
import { ClubsApi, DivisionsApi, MatchesApi } from './index';
import { TabtClientConfigFactory } from './tabt-client-config-factory';
import { ErrorProcessingService } from '../processing/error-processing-service/error-processing-service';
import { WeeklyMatchesSummaryProcessingService } from '../processing/weekly-matches-summary/weekly-matches-summary-processing-service';
import { TopProcessingService } from '../processing/top/top-processing-service';
import { PlayersPointsProcessingService } from '../processing/top/1-players-points/players-points-processing-service';
import { LevelAttributionService } from '../processing/top/2-level-attribution/level-attribution-service';
import { SumPointsService } from '../processing/top/3-sum-points/sum-points-service';
import { ConsolidateTopService } from '../processing/top/4-consolidate-tops/consolidate-top-service';
import { TeamMatchEntryHelpers } from './team-match-entry-helpers';
import { DebugDigestionService } from '../digestion/debug/debug-digestion-service';
import { TopExcelOutputService } from '../digestion/excel/top-excel-output-service';
import { EmailSenderService } from '../digestion/email-sender/email-sender-service';
import { FacebookPostingService } from '../digestion/facebook-post/facebook-posting-service';
import { ExcelDebugOutputService } from '../digestion/excel-debug/excel-debug-output-service';
import { FirestoreDigestionService } from '../digestion/firebase/firestore-digestion.service';
import { FirebaseMessagingService } from '../digestion/firebase/firebase-messaging.service';
import { AiSummaryService } from '../digestion/ai-summary/ai-summary.service';
import { AxiosInstance } from 'axios';
import admin from 'firebase-admin';
import { FirebaseConfigService } from '../configuration/firebase-config.service';
import { WeeklyMatchesSummaryDigestionService } from '../digestion/weekly-matches-summary/weekly-matches-summary-digestion-service';

export class ServiceFactory {
  // Generic singleton helper method
  private static getSingleton<T>(serviceId: string, factory: () => T): T {
    try {
      const existingService = container.get<T>(serviceId);
      if (existingService) {
        return existingService;
      }
    } catch (error) {
      // Service doesn't exist yet, create it
    }

    const service = factory();
    container.set(serviceId, service);
    return service;
  }

  static createLoggingService(): LoggingService {
    return new LoggingService();
  }

  static createFileSystemHelper(): FileSystemHelper {
    const loggingService = this.createLoggingService();
    return new FileSystemHelper(loggingService);
  }

  static createRuntimeConfigurationService(): RuntimeConfigurationService {
    return new RuntimeConfigurationService();
  }

  static createGoogleCredentialsLoaderService(): GoogleCredentialsLoaderService {
    const runtimeConfigService = this.createRuntimeConfigurationService();
    const loggingService = this.createLoggingService();
    return new GoogleCredentialsLoaderService(runtimeConfigService, loggingService);
  }

  static createConfigurationService(): ConfigurationService {
    const loggingService = this.createLoggingService();
    const fileSystemHelper = this.createFileSystemHelper();
    const runtimeConfigService = this.createRuntimeConfigurationService();
    const googleCredentialsService = this.createGoogleCredentialsLoaderService();
    const firebaseAdmin = container.get<admin.app.App>('firebase.admin');

    return new ConfigurationService(
      loggingService,
      fileSystemHelper,
      runtimeConfigService,
      googleCredentialsService,
      firebaseAdmin
    );
  }

  static createClubsApi(): ClubsApi {
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const axiosInstance = container.get<AxiosInstance>('axios');
    // Ensure axios uses the correct base URL
    axiosInstance.defaults.baseURL = configService.bepingUrl;
    return new ClubsApi(
      TabtClientConfigFactory.createConfiguration(configService.bepingUrl),
      null,
      axiosInstance
    );
  }

  static createMatchesApi(): MatchesApi {
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const axiosInstance = container.get<AxiosInstance>('axios');
    axiosInstance.defaults.baseURL = configService.bepingUrl;
    return new MatchesApi(
      TabtClientConfigFactory.createConfiguration(configService.bepingUrl),
      null,
      axiosInstance
    );
  }

  static createDivisionsApi(): DivisionsApi {
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const axiosInstance = container.get<AxiosInstance>('axios');
    axiosInstance.defaults.baseURL = configService.bepingUrl;
    return new DivisionsApi(
      TabtClientConfigFactory.createConfiguration(configService.bepingUrl),
      null,
      axiosInstance
    );
  }

  static createClubsIngestionService(): ClubsIngestionService {
    return this.getSingleton('ClubsIngestionService', () => {
      const configService = container.get<ConfigurationService>('ConfigurationService');
      const loggingService = this.createLoggingService();
      const clubsApi = this.createClubsApi();

      return new ClubsIngestionService(
        configService,
        loggingService,
        clubsApi
      );
    });
  }

  static createDivisionsIngestionService(): DivisionsIngestionService {
    return this.getSingleton('DivisionsIngestionService', () => {
      const loggingService = this.createLoggingService();
      const divisionsApi = this.createDivisionsApi();

      return new DivisionsIngestionService(
        loggingService,
        divisionsApi
      );
    });
  }

  static createDivisionsMatchesIngestionService(): DivisionsMatchesIngestionService {
    return this.getSingleton('DivisionsMatchesIngestionService', () => {
      const configService = container.get<ConfigurationService>('ConfigurationService');
      const loggingService = this.createLoggingService();
      const matchesApi = this.createMatchesApi();

      return new DivisionsMatchesIngestionService(
        configService,
        loggingService,
        matchesApi
      );
    });
  }

  static createWeeklyMatchesSummaryIngestionService(): WeeklyMatchesSummaryIngestionService {
    return this.getSingleton('WeeklyMatchesSummaryIngestionService', () => {
      const configService = container.get<ConfigurationService>('ConfigurationService');
      const loggingService = this.createLoggingService();
      const matchesApi = this.createMatchesApi();
      const randomIp = container.get<() => string>('randomip');

      return new WeeklyMatchesSummaryIngestionService(
        configService,
        loggingService,
        matchesApi,
        randomIp
      );
    });
  }

  static createIngestionService(): IngestionService {
    const clubsIngestionService = this.createClubsIngestionService();
    const divisionsIngestionService = this.createDivisionsIngestionService();
    const divisionsMatchesIngestionService = this.createDivisionsMatchesIngestionService();
    const weeklyMatchesSummaryIngestionService = this.createWeeklyMatchesSummaryIngestionService();
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const loggingService = this.createLoggingService();

    return new IngestionService(
      clubsIngestionService,
      divisionsIngestionService,
      divisionsMatchesIngestionService,
      weeklyMatchesSummaryIngestionService,
      configService,
      loggingService
    );
  }

  static createErrorProcessingService(): ErrorProcessingService {
    return this.getSingleton('ErrorProcessingService', () => {
      const loggingService = this.createLoggingService();
      return new ErrorProcessingService(loggingService);
    });
  }

  static createWeeklyMatchesSummaryProcessingService(): WeeklyMatchesSummaryProcessingService {
    return this.getSingleton('WeeklyMatchesSummaryProcessingService', () => {
      const loggingService = this.createLoggingService();
      const weeklyMatchesSummaryIngestionService = this.createWeeklyMatchesSummaryIngestionService();
      const divisionsIngestionService = this.createDivisionsIngestionService();
      return new WeeklyMatchesSummaryProcessingService(loggingService, weeklyMatchesSummaryIngestionService, divisionsIngestionService);
    });
  }

  static createTeamMatchEntryHelpers(): TeamMatchEntryHelpers {
    return new TeamMatchEntryHelpers();
  }

  static createPlayersPointsProcessingService(): PlayersPointsProcessingService {
    return this.getSingleton('PlayersPointsProcessingService', () => {
      const divisionsMatchesIngestionService = this.createDivisionsMatchesIngestionService();
      const loggingService = this.createLoggingService();
      const errorProcessingService = this.createErrorProcessingService();
      const configService = container.get<ConfigurationService>('ConfigurationService');
      const teamMatchEntryHelpers = this.createTeamMatchEntryHelpers();

      return new PlayersPointsProcessingService(
        divisionsMatchesIngestionService,
        loggingService,
        errorProcessingService,
        configService,
        teamMatchEntryHelpers
      );
    });
  }

  static createLevelAttributionService(): LevelAttributionService {
    return this.getSingleton('LevelAttributionService', () => {
      const loggingService = this.createLoggingService();
      const playersPointsProcessingService = this.createPlayersPointsProcessingService();
      const configService = container.get<ConfigurationService>('ConfigurationService');
      return new LevelAttributionService(
        loggingService,
        playersPointsProcessingService,
        configService
      );
    });
  }

  static createSumPointsService(): SumPointsService {
    return this.getSingleton('SumPointsService', () => {
      const loggingService = this.createLoggingService();
      const playersPointsProcessingService = this.createPlayersPointsProcessingService();
      const levelAttributionService = this.createLevelAttributionService();
      const configService = container.get<ConfigurationService>('ConfigurationService');
      return new SumPointsService(
        loggingService,
        playersPointsProcessingService,
        levelAttributionService,
        configService
      );
    });
  }

  static createConsolidateTopService(): ConsolidateTopService {
    return this.getSingleton('ConsolidateTopService', () => {
      const loggingService = this.createLoggingService();
      const configService = container.get<ConfigurationService>('ConfigurationService');
      const playersPointsProcessingService = this.createPlayersPointsProcessingService();
      const sumPointsService = this.createSumPointsService();
      const levelAttributionService = this.createLevelAttributionService();
      const clubIngestion = this.createClubsIngestionService();
      return new ConsolidateTopService(
        loggingService,
        configService,
        playersPointsProcessingService,
        sumPointsService,
        levelAttributionService,
        clubIngestion
      );
    });
  }

  static createTopProcessingService(): TopProcessingService {
    const loggingService = this.createLoggingService();
    const playersPointsProcessingService = this.createPlayersPointsProcessingService();
    const levelAttribution = this.createLevelAttributionService();
    const sumPointsService = this.createSumPointsService();
    const consolidateTopService = this.createConsolidateTopService();
    return new TopProcessingService(loggingService, playersPointsProcessingService, levelAttribution, sumPointsService, consolidateTopService);
  }

  static createProcessingService(): ProcessingService {
    const loggingService = this.createLoggingService();
    const weeklyMatchesSummaryProcessingService = this.createWeeklyMatchesSummaryProcessingService();
    const topProcessingService = this.createTopProcessingService();
    const errorProcessingService = this.createErrorProcessingService();
    const configurationService = container.get<ConfigurationService>('ConfigurationService');
    
    return new ProcessingService(
      loggingService,
      weeklyMatchesSummaryProcessingService,
      topProcessingService,
      errorProcessingService,
      configurationService
    );
  }

  static createDebugDigestionService(): DebugDigestionService {
    const weeklyMatchesSummaryProcessingService = this.createWeeklyMatchesSummaryProcessingService();
    const playersPointsProcessingService = this.createPlayersPointsProcessingService();
    const levelAttributionService = this.createLevelAttributionService();
    const sumPointsService = this.createSumPointsService();
    const consolidateTopService = this.createConsolidateTopService();
    const divisionsMatchesIngestionService = this.createDivisionsMatchesIngestionService();
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const fileSystemHelper = this.createFileSystemHelper();
    const loggingService = this.createLoggingService();
    return new DebugDigestionService(
      weeklyMatchesSummaryProcessingService,
      playersPointsProcessingService,
      levelAttributionService,
      sumPointsService,
      consolidateTopService,
      divisionsMatchesIngestionService,
      configService,
      fileSystemHelper,
      loggingService
    );
  }

  static createTopExcelOutputService(): TopExcelOutputService {
    return this.getSingleton('TopExcelOutputService', () => {
      const configService = container.get<ConfigurationService>('ConfigurationService');
      const loggingService = this.createLoggingService();
      const consolidateTopService = this.createConsolidateTopService();
      return new TopExcelOutputService(configService, loggingService, consolidateTopService);
    });
  }

  static createEmailSenderService(): EmailSenderService {
    const loggingService = this.createLoggingService();
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const errorProcessingService = this.createErrorProcessingService();
    return new EmailSenderService(loggingService, configService, errorProcessingService);
  }

  static createFacebookPostingService(): FacebookPostingService {
    const loggingService = this.createLoggingService();
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const aiSummaryService = this.createAiSummaryService();
    return new FacebookPostingService(
      this.createConsolidateTopService(),
      configService,
      loggingService,
      aiSummaryService,
      container.get<AxiosInstance>('axios')
    );
  }

  static createExcelDebugOutputService(): ExcelDebugOutputService {
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const loggingService = this.createLoggingService();
    const playersPointsProcessingService = this.createPlayersPointsProcessingService();
    const levelAttributionService = this.createLevelAttributionService();
    const sumPoints = this.createSumPointsService();
    const errorProcessingService = this.createErrorProcessingService();
    const topExcelOutputService = this.createTopExcelOutputService();
    return new ExcelDebugOutputService(
      configService,
      loggingService,
      playersPointsProcessingService,
      levelAttributionService,
      sumPoints,
      configService,
      errorProcessingService,
      topExcelOutputService
    );
  }


  static createFirebaseConfigService(): FirebaseConfigService {
    const loggingService = this.createLoggingService();
    return new FirebaseConfigService(loggingService);
  }

  static createFirestoreDigestionService(): FirestoreDigestionService {
    const firebaseService = container.get<admin.app.App>('firebase.admin');
    const consolidateTopService = this.createConsolidateTopService();
    const playersPointsProcessingService = this.createPlayersPointsProcessingService();
    const levelAttributionService = this.createLevelAttributionService();
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const loggingService = this.createLoggingService();
    const aiSummaryService = this.createAiSummaryService();
    const firebaseConfigService = this.createFirebaseConfigService();
    return new FirestoreDigestionService(
      firebaseService,
      consolidateTopService,
      playersPointsProcessingService,
      levelAttributionService,
      configService,
      loggingService,
      firebaseConfigService,
      aiSummaryService
    );
  }

  static createFirebaseMessagingService(): FirebaseMessagingService {
    const loggingService = this.createLoggingService();
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const firebaseAdmin = container.get<admin.app.App>('firebase.admin');
    return new FirebaseMessagingService(firebaseAdmin, configService, loggingService);
  }

  static createAiSummaryService(): AiSummaryService {
    const loggingService = this.createLoggingService();
    return new AiSummaryService(loggingService);
  }

  static createWeeklyMatchesSummaryDigestionService(): WeeklyMatchesSummaryDigestionService {
    const loggingService = this.createLoggingService();
    const weeklyMatchesSummaryProcessingService = this.createWeeklyMatchesSummaryProcessingService();
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const fileSystemHelper = this.createFileSystemHelper();
    return new WeeklyMatchesSummaryDigestionService(
        weeklyMatchesSummaryProcessingService,
        configService,
        fileSystemHelper,
        loggingService
    );
  }

  static createDigestingService(): DigestingService {
    const loggingService = this.createLoggingService();
    const configService = container.get<ConfigurationService>('ConfigurationService');
    const weeklyMatchesSummaryDigestionService = this.createWeeklyMatchesSummaryDigestionService();
    const debugDigestionService = this.createDebugDigestionService();
    const emailSenderService = this.createEmailSenderService();
    const excelOutput = this.createTopExcelOutputService();
    const excelDebugOutputService = this.createExcelDebugOutputService();
    const facebookPostingService = this.createFacebookPostingService();
    const firestoreDigestionService = this.createFirestoreDigestionService();
    const firebaseMessagingService = this.createFirebaseMessagingService();
    const aiSummaryService = this.createAiSummaryService();
    
    return new DigestingService(
      loggingService,
      weeklyMatchesSummaryDigestionService,
      debugDigestionService,
      configService,
      emailSenderService,
      excelOutput,
      excelDebugOutputService,
      facebookPostingService,
      firestoreDigestionService,
      firebaseMessagingService,
      aiSummaryService
    );
  }
}
