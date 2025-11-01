import * as path from "path";

import {FileSystemHelper, LoggingService, SeasonsApi} from "../common";
import {
  Configuration,
  FacebookPage,
  LevelsDefinition,
  Mailing,
  PlayerPointsOverrides,
  RegionsDefinition,
  TOP_LEVEL,
  TOP_REGIONS,
} from "./configuration.model";
import {formatISO9075} from "date-fns";
import {RuntimeConfigurationService} from "./runtime-configuration.service";
import admin, {ServiceAccount} from "firebase-admin";
import {GoogleCredentialsLoaderService} from './google-credentials-loader.service';

export class ConfigurationService {

  private _configuration: Configuration;
  private _currentSeason: number | null = null;

  readonly dateStart = new Date();

  constructor(
    private readonly _loggingService: LoggingService,
    private readonly _fileSystemHelper: FileSystemHelper,
    private readonly commandConfiguration: RuntimeConfigurationService,
    // @ts-ignore - Kept for potential future use (currently commented out in init)
    private readonly _googleCredentialsLoader: GoogleCredentialsLoaderService,
    private _firebaseAdmin: admin.app.App,
    private readonly seasonsApi?: SeasonsApi,
  ) {
  }

  async init(): Promise<void> {
    this._loggingService.info(this._loggingService.getLayerInfo('CONFIGURATION'));
    await this.commandConfiguration.init();
    
    // Skip Google credentials loader since Firebase is now initialized in main.ts
    // await this.googleCredentialsLoader.init();

    await this.loadConfigFromFirestore();
    await this.loadCurrentSeason();

    await this.logConfigAsync();
    await this.initFileSystemAsync();
  }

  private async loadCurrentSeason(): Promise<void> {
    try {
      if (this.seasonsApi) {
        // Update axios base URL if it's different from config
        const axiosInstance = (this.seasonsApi as any).axios;
        if (axiosInstance && axiosInstance.defaults.baseURL !== this.bepingUrl) {
          axiosInstance.defaults.baseURL = this.bepingUrl;
        }
        const { data: currentSeason } = await this.seasonsApi.findCurrentSeason();
        this._currentSeason = currentSeason.season;
        this._loggingService.info(`Current season loaded: ${this._currentSeason}`);
      } else {
        // Fallback to hardcoded season if SeasonsApi not available
        this._currentSeason =     26;
        this._loggingService.warn('SeasonsApi not available, using fallback season: 26');
      }
    } catch (error) {
      this._loggingService.warn(`Failed to load current season: ${error instanceof Error ? error.message : 'Unknown error'}. Using fallback: 26`);
      this._currentSeason = 26;
    }
  }

  get currentSeason(): number {
    return this._currentSeason || 26;
  }

  private async logConfigAsync(): Promise<void> {
    this._loggingService.debug(`RUNTIME CONFIGURATION`);
    this._loggingService.trace(`TabT API: ${this._configuration.beping_url}`);
    this._loggingService.trace(`weekName: ${this.commandConfiguration.weekName}`);
    this._loggingService.trace(`weeklySummary: ${this.commandConfiguration.weeklySummary}`);
    this._loggingService.trace(`postToFacebook: ${this.commandConfiguration.postToFacebook}`);
    this._loggingService.trace(`sendViaEmail: ${this.commandConfiguration.sendViaEmail}`);
    this._loggingService.trace(`emails: ${this.emailsRecipients}`);
    this._loggingService.trace(`uploadToFirebase: ${this.commandConfiguration.uploadToFirebase}`);

    this._loggingService.debug(`TOP 6 CONFIGURATION`);

    this._loggingService.debug(`CLUBS`);
    for (const region of Object.values(TOP_REGIONS)) {
      this._loggingService.trace(`- ${region}: ${this.getAllClubsForRegion(region).join(', ')}`);
    }

    this._loggingService.debug(`DIVISIONS`);
    for (const [category, divisions] of Object.entries(this.levelsDefinition)) {
      this._loggingService.trace(`- ${category}: ${divisions.join(', ')}`);
    }

  }

  private async initFileSystemAsync(): Promise<void> {
    this._loggingService.info(this._loggingService.getLayerInfo('🏗 FILE SYSTEM INITIALIZATION'));

    this._fileSystemHelper.createFolderIfNotExist(this.absolutePathOutput);
    this._fileSystemHelper.createFolderIfNotExist(this.absolutePathOutputToday);
  }

  getAllClubsForRegion(top: TOP_REGIONS): string[] {
    return this._configuration.top6.regions_definition[top];
  }

  get allClubsUniqueIndex(): string[] {
    return Object.values(TOP_REGIONS)
      .map((t) => this.getAllClubsForRegion(t))
      .flat(1);
  }

  clubIsInConfig(clubIndex: string): boolean {
    return this.allClubsUniqueIndex.includes(clubIndex);
  }

  get allRegions(): TOP_REGIONS[] {
    return Object.values(TOP_REGIONS);
  }

  get allLevels(): TOP_LEVEL[] {
    return Object.values(TOP_LEVEL);
  }

  get levelsDefinition(): LevelsDefinition {
    return this._configuration.top6.levels_definition
  }

  get allDivisions(): number[] {
    return Object.values(this._configuration.top6.levels_definition).flat();
  }

  get absolutePathOutput(): string {
    return path.join(process.cwd(), this._configuration.output);
  }

  get absolutePathOutputToday(): string {
    return path.join(this.absolutePathOutput, formatISO9075(this.dateStart, {format: 'basic'}))
  }

  getAbsolutePathTechniqueTxtFileName(region: TOP_REGIONS): string {
    return `${this.absolutePathOutputToday}/technique_${region.toLowerCase()}.txt`;
  }

  get absolutePathTechniqueDebugFileName(): string {
    return `${this.absolutePathOutputToday}/technique_debug.json`;
  }

  get absolutePathPlayerPointsFileName(): string {
    return `${this.absolutePathOutputToday}/points_debug.json`;
  }

  get absolutePathLevelAttributionFileName(): string {
    return `${this.absolutePathOutputToday}/level_attribution_debug.json`;
  }

  get absolutePathPointsToCountFileName(): string {
    return `${this.absolutePathOutputToday}/points_to_count_debug.json`;
  }

  get absolutePathConsolidateTopDebugFileName(): string {
    return `${this.absolutePathOutputToday}/tops_debug.json`;
  }

  get absolutePathDivisionsMatchesDebugFileName(): string {
    return `${this.absolutePathOutputToday}/divisions_matches.json`;
  }

  absolutePathConsolidatedTopExcelFileName(region: TOP_REGIONS): string {
    return `${this.absolutePathOutputToday}/tops_${region}.xlsx`;
  }

  absolutePathConsolidatedTopCompleteExcelFileName(region: TOP_REGIONS): string {
    return `${this.absolutePathOutputToday}/tops_complete_${region}.xlsx`;
  }

  getLevelForDivision(divisionId: number): TOP_LEVEL {
    const category = Object.entries(this._configuration.top6.levels_definition)
      .find(([, divisions]: [TOP_LEVEL, number[]]) => divisions.includes(divisionId));
    return category?.[0] as TOP_LEVEL;
  }

  get runtimeConfiguration() {
    return this.commandConfiguration
  }

  get emailConfig(): Mailing {
    return this._configuration.email;
  }

  get facebookConfig() {
    return this._configuration.facebook;
  }

  get firebaseConfig(): ServiceAccount {
    // TODO: move to env?
    return this._configuration.firebase;
  }

  get writeDebugFiles(): boolean {
    return this.runtimeConfiguration.writeFullDebug;
  }

  get emailsRecipients(): string[] {
    return this.runtimeConfiguration.emails.length > 0 ?
      this.runtimeConfiguration.emails :
      this.emailConfig.recipients
  }

  get pointsOverride(): PlayerPointsOverrides {
    return this._configuration.top6.points_overrides;
  }


  private async loadConfigFromFirestore() {
    this._loggingService.debug('LOADING CONFIGURATION FROM FIRESTORE');

    const configurationCollection = this._firebaseAdmin.firestore().collection('configuration');
    const facebook = await configurationCollection.doc('facebook').get();
    const beping_api = await configurationCollection.doc('beping_api').get();
    const levels_definition = await configurationCollection.doc('levels_definition').get();
    const regions_definition = await configurationCollection.doc('regions_definition').get();
    const points_overrides = await configurationCollection.doc('points_overrides').get();
    const excluded_players = await configurationCollection.doc('excluded_players').get();
    const mailing = await configurationCollection.doc('mailing').get();

    // Debug the beping_api data
    this._loggingService.debug(`Beping API data: ${JSON.stringify(beping_api.data())}`);
    this._loggingService.debug(`Beping API URL: ${beping_api.data()?.url}`);

    this._configuration = {
      facebook: facebook.data() as FacebookPage,
      beping_url: beping_api.data()?.url || 'https://api-v2.beping.be',
      top6: {
        levels_definition: levels_definition.data() as LevelsDefinition,
        regions_definition: regions_definition.data() as RegionsDefinition,
        points_overrides: points_overrides.data(),
        excluded_players: excluded_players.data().players,
      },
      email: mailing.data() as Mailing,
      output: 'output',
    }

    this._loggingService.trace('Configuration loaded');
  }

  isPlayerExcluded(uniqueIndex: number) {
    return this._configuration.top6.excluded_players.includes(uniqueIndex);
  }

  get bepingUrl(): string {
    const url = this._configuration.beping_url;
    if (!url) {
      console.warn('⚠️  No beping_url found in Firestore configuration, using default: https://api.beping.be');
      return 'https://api.beping.be';
    }
    return url;
  }
}
