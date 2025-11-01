import {DigestingServiceContract} from "../digesting-service-contract";
import {ConsolidateTopService} from "../../processing/top/4-consolidate-tops/consolidate-top-service";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService} from "../../common";
import {app, firestore} from "firebase-admin";
import {PlayersPointsProcessingService} from "../../processing/top/1-players-points/players-points-processing-service";
import {LevelAttributionService} from "../../processing/top/2-level-attribution/level-attribution-service";
import {ConsolidateTopModel, PlayerPosition} from "../../processing/top/4-consolidate-tops/consolidate-top-model";
import {TOP_LEVEL, TOP_REGIONS} from "../../configuration/configuration.model";
import {FirebaseConfigService} from "../../configuration/firebase-config.service";
import {AiSummaryService, AISummary, RegionAnalytics} from "../ai-summary/ai-summary.service";
import CollectionReference = firestore.CollectionReference;

interface PlayerPointsHistory {
  points: number,
  level: string,
  position: number,
  weekName: number
}

interface ComputationMetadata {
  timestamp: Date;
  weekName: number;
  version: string;
  totalPlayersProcessed: number;
  regionsProcessed: string[];
  levelsProcessed: string[];
}

interface RegionSummary {
  region: string;
  totalPlayers: number;
  playersByLevel: { [level: string]: number };
  topPlayersByLevel: { [level: string]: PlayerPosition[] };
  clubs: string[];
  lastUpdated: Date;
  aiSummary?: AISummary;
}

interface RankingDocument {
  uniqueIndex: string;
  name: string;
  clubIndex: string;
  clubName: string;
  region: string;
  level: string;
  position: number;
  points: {
    total: number;
    breakdown: {
      count5Pts: number;
      count3Pts: number;
      count2Pts: number;
      count1Pts: number;
      count0Pts: number;
    };
  };
  weekName: number;
  lastUpdated: Date;
}

export class FirestoreDigestionService implements DigestingServiceContract {

  uniqueIndexesInTops: string[] = [];

  constructor(
    private readonly firebaseService: app.App,
    private readonly consolidateTopService: ConsolidateTopService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly levelAttributionService: LevelAttributionService,
    private readonly configurationService: ConfigurationService,
    private readonly loggingService: LoggingService,
    private readonly firebaseConfigService: FirebaseConfigService,
    private readonly aiSummaryService: AiSummaryService,
  ) {
  }

  async digest(): Promise<void> {
    const startTime = new Date();
    this.loggingService.info('Starting enhanced Firestore digestion...');
    
    await this.saveComputationMetadata(startTime);
    await this.updateTops();
    await this.updateDetails();
    await this.saveRankingsFlattened();
    await this.saveRegionSummaries();
    
    this.loggingService.info(`Firestore digestion completed in ${Date.now() - startTime.getTime()}ms`);
  }

  private async updateTops() {
    this.loggingService.info('Saving tops to Firebase...');
    
    await this.firebaseConfigService.executeWithRetry(async () => {
      const firestore = this.firebaseService.firestore();
      const updateBatch = firestore.batch();
      const topsCollection: CollectionReference = firestore.collection('/tops');
      
      for (const region of this.configurationService.allRegions) {
        const regionDoc = topsCollection.doc(region);

        const levels: {
          [index: string]: PlayerPosition[]
        } = this.configurationService.allLevels.reduce((acc, level: TOP_LEVEL) => {
          const results: PlayerPosition[] = this.consolidateTopService
            .getTopForRegionAndLevel(region, level, this.configurationService.runtimeConfiguration.weekName, 200)
            .map((playerPosition: PlayerPosition, index: number) => ({...playerPosition, position: index}));
          return {...acc, [level]: results};
        }, {});
        
        const clubs = this.configurationService.getAllClubsForRegion(region);
        const documentData = {
          clubs, 
          levels, 
          lastUpdated: new Date(),
          weekName: this.configurationService.runtimeConfiguration.weekName
        };
        
        updateBatch.set(regionDoc, documentData);
        this.loggingService.trace('✅ ' + region);

        // Adding indexes into array to update only them
        this.uniqueIndexesInTops.push(...Object.values(levels).flat().map(playerPosition => playerPosition.uniqueIndex));
      }
      
      await updateBatch.commit();
    }, 3, 1000, 'updateTops');
  }

  private async updateDetails() {
    this.loggingService.info('Saving player details to Firebase...');
    const playerPointsCollectionRef = this.firebaseService.firestore().collection('/players-points-details');
    
    // Improved batching - use Firestore's 500 operation limit per batch more efficiently
    const BATCH_SIZE = 500;
    const chunks = this.chunkArray(this.uniqueIndexesInTops, BATCH_SIZE);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      this.loggingService.trace(`Processing batch ${i + 1}/${chunks.length} with ${chunk.length} players...`);
      
      const batch = this.firebaseService.firestore().batch();
      const timestamp = new Date();

      for (const uniqueIndex of chunk) {
        const playerPoints = this.playersPointsProcessingService.getPlayerResultsUntilWeekName(uniqueIndex, this.configurationService.runtimeConfiguration.weekName);
        playerPoints.points.sort((a, b) => b.weekName - a.weekName);
        const level = this.levelAttributionService.getLevelForUniqueIndex(uniqueIndex, this.configurationService.runtimeConfiguration.weekName);
        const playerPointsHistory: PlayerPointsHistory[] = await this.getPlayerHistory(uniqueIndex);
        
        const documentRef = playerPointsCollectionRef.doc(uniqueIndex);
        batch.set(documentRef, {
          ...playerPoints,
          levelAttributed: level,
          history: playerPointsHistory,
          lastUpdated: timestamp,
          weekName: this.configurationService.runtimeConfiguration.weekName,
        });
      }
      
      await batch.commit();
      this.loggingService.trace(`✅ Batch ${i + 1}/${chunks.length} completed`);
    }

    this.loggingService.info(`✅ ${this.uniqueIndexesInTops.length} players updated in ${chunks.length} batches`);
  }

  private async getPlayerHistory(uniqueIndex: string): Promise<PlayerPointsHistory[]> {
    const lastWeekNameForHistory = this.configurationService.runtimeConfiguration.weekName;
    const history: PlayerPointsHistory[] = [];
    for (let weekName = 1; weekName <= lastWeekNameForHistory; weekName++) {
      const consolidateTopModel: ConsolidateTopModel = this.consolidateTopService.model[weekName];
      for (const region of Object.keys(consolidateTopModel)) {
        for (const level of Object.keys(consolidateTopModel[region])) {
          const playerPositionIndex = consolidateTopModel[region][level].findIndex(playerPosition => playerPosition.uniqueIndex === uniqueIndex);
          if (playerPositionIndex !== -1) {
            history.push({
              points: consolidateTopModel[region][level][playerPositionIndex].points.total,
              level,
              position: playerPositionIndex + 1,
              weekName: weekName,
            });
          }
        }
      }
    }
    return history;
  }

  private async saveComputationMetadata(timestamp: Date): Promise<void> {
    this.loggingService.info('Saving computation metadata...');
    
    const metadata: ComputationMetadata = {
      timestamp,
      weekName: this.configurationService.runtimeConfiguration.weekName,
      version: process.env.npm_package_version || '2.6.0',
      totalPlayersProcessed: 0, // Will be updated after processing
      regionsProcessed: this.configurationService.allRegions,
      levelsProcessed: this.configurationService.allLevels,
    };

    const metadataRef = this.firebaseService.firestore().collection('/computation-metadata').doc(`week-${this.configurationService.runtimeConfiguration.weekName}`);
    await metadataRef.set(metadata);
    
    this.loggingService.trace('✅ Computation metadata saved');
  }

  private async saveRankingsFlattened(): Promise<void> {
    this.loggingService.info('Saving flattened rankings for efficient querying...');
    
    const rankingsCollection = this.firebaseService.firestore().collection('/rankings');
    const timestamp = new Date();
    const BATCH_SIZE = 500;
    const rankingDocuments: RankingDocument[] = [];

    for (const region of this.configurationService.allRegions) {
      for (const level of this.configurationService.allLevels) {
        const playersInLevel = this.consolidateTopService
          .getTopForRegionAndLevel(region, level, this.configurationService.runtimeConfiguration.weekName, 1000);
        
        playersInLevel.forEach((playerPosition: PlayerPosition, index: number) => {
          rankingDocuments.push({
            uniqueIndex: playerPosition.uniqueIndex,
            name: playerPosition.name,
            clubIndex: playerPosition.clubIndex,
            clubName: playerPosition.clubName,
            region,
            level,
            position: index + 1,
            points: {
              total: playerPosition.points.total,
              breakdown: {
                count5Pts: playerPosition.points.count5Pts,
                count3Pts: playerPosition.points.count3Pts,
                count2Pts: playerPosition.points.count2Pts,
                count1Pts: playerPosition.points.count1Pts,
                count0Pts: playerPosition.points.count0Pts,
              }
            },
            weekName: this.configurationService.runtimeConfiguration.weekName,
            lastUpdated: timestamp,
          });
        });
      }
    }

    // Clear existing rankings for this week
    const existingQuery = rankingsCollection.where('weekName', '==', this.configurationService.runtimeConfiguration.weekName);
    const existingDocs = await existingQuery.get();
    const deleteChunks = this.chunkArray(existingDocs.docs, BATCH_SIZE);
    
    for (const chunk of deleteChunks) {
      const batch = this.firebaseService.firestore().batch();
      chunk.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    // Save new rankings in batches
    const rankingChunks = this.chunkArray(rankingDocuments, BATCH_SIZE);
    
    for (let i = 0; i < rankingChunks.length; i++) {
      const chunk = rankingChunks[i];
      const batch = this.firebaseService.firestore().batch();
      
      chunk.forEach(ranking => {
        // Create sanitized document ID
        const docId = this.sanitizeDocumentId(`${ranking.weekName}-${ranking.region}-${ranking.level}-${ranking.uniqueIndex}`);
        const docRef = rankingsCollection.doc(docId);
        batch.set(docRef, ranking);
      });
      
      await batch.commit();
      this.loggingService.trace(`✅ Rankings batch ${i + 1}/${rankingChunks.length} completed`);
    }

    this.loggingService.info(`✅ ${rankingDocuments.length} ranking documents saved`);
  }

  private async saveRegionSummaries(): Promise<void> {
    this.loggingService.info('Saving region summaries with AI analysis...');
    
    const summariesCollection = this.firebaseService.firestore().collection('/region-summaries');
    const timestamp = new Date();
    const currentWeek = this.configurationService.runtimeConfiguration.weekName;

    // Build analytics data for AI processing
    const regionAnalytics: RegionAnalytics[] = [];
    
    for (const region of this.configurationService.allRegions) {
      const clubs = this.configurationService.getAllClubsForRegion(region);
      const playersByLevel: { [level: string]: number } = {};
      const topPlayersByLevel: { [level: string]: PlayerPosition[] } = {};
      let totalPlayers = 0;

      for (const level of this.configurationService.allLevels) {
        const allPlayersInLevel = this.consolidateTopService
          .getTopForRegionAndLevel(region, level, currentWeek, 1000);
        const topPlayersInLevel = this.consolidateTopService
          .getTopForRegionAndLevel(region, level, currentWeek, 10);
        
        playersByLevel[level] = allPlayersInLevel.length;
        topPlayersByLevel[level] = topPlayersInLevel;
        totalPlayers += allPlayersInLevel.length;
      }

      // Prepare analytics with previous week comparison if available
      const analytics: RegionAnalytics = {
        region,
        weekName: currentWeek,
        totalPlayers,
        playersByLevel,
        topPlayersByLevel,
        clubs
      };

      // Add previous week comparison if we have historical data
      if (currentWeek > 1) {
        analytics.previousWeekComparison = this.buildPreviousWeekComparison(region, currentWeek);
      }

      regionAnalytics.push(analytics);
    }

    // Generate AI summaries for all regions
    const aiSummaries = await this.aiSummaryService.generateBatchSummaries(regionAnalytics);

    // Save region summaries with AI analysis
    const batch = this.firebaseService.firestore().batch();

    regionAnalytics.forEach((analytics, index) => {
      const aiSummary = aiSummaries[index];
      
      const summary: RegionSummary = {
        region: analytics.region,
        totalPlayers: analytics.totalPlayers,
        playersByLevel: analytics.playersByLevel,
        topPlayersByLevel: analytics.topPlayersByLevel,
        clubs: analytics.clubs,
        lastUpdated: timestamp,
        ...(aiSummary && { aiSummary })
      };

      const docRef = summariesCollection.doc(`${analytics.region}-week-${currentWeek}`);
      batch.set(docRef, summary);
    });

    await batch.commit();
    
    const aiEnabledCount = aiSummaries.filter(s => s !== null).length;
    this.loggingService.info(`✅ Region summaries saved (${aiEnabledCount}/${regionAnalytics.length} with AI analysis)`);
  }

  private buildPreviousWeekComparison(region: string, currentWeek: number): RegionAnalytics['previousWeekComparison'] {
    const previousWeek = currentWeek - 1;
    
    try {
      // Get current and previous week top players for comparison
      const newTopPlayers: PlayerPosition[] = [];
      const playersWhoDropped: PlayerPosition[] = [];
      const biggestPointGains: Array<{ player: PlayerPosition; pointGain: number }> = [];
      
      // Compare players across all levels
      for (const level of this.configurationService.allLevels) {
        const currentTopPlayers = this.consolidateTopService
          .getTopForRegionAndLevel(region as TOP_REGIONS, level, currentWeek, 20);
        const previousTopPlayers = this.consolidateTopService
          .getTopForRegionAndLevel(region as TOP_REGIONS, level, previousWeek, 20);

        const previousPlayerMap = new Map(
          previousTopPlayers.map(p => [p.uniqueIndex, p])
        );

        // Find new top players and biggest point gains
        currentTopPlayers.forEach((currentPlayer, index) => {
          const previousPlayer = previousPlayerMap.get(currentPlayer.uniqueIndex);
          
          if (!previousPlayer && index < 10) {
            // New player in top 10
            newTopPlayers.push(currentPlayer);
          } else if (previousPlayer) {
            // Calculate point gain
            const pointGain = currentPlayer.points.total - previousPlayer.points.total;
            if (pointGain > 0) {
              biggestPointGains.push({ player: currentPlayer, pointGain });
            }
          }
        });

        // Find players who dropped out of top rankings
        previousTopPlayers.slice(0, 10).forEach(previousPlayer => {
          const stillInTop = currentTopPlayers
            .slice(0, 10)
            .some(current => current.uniqueIndex === previousPlayer.uniqueIndex);
          
          if (!stillInTop) {
            playersWhoDropped.push(previousPlayer);
          }
        });
      }

      // Sort biggest point gains
      biggestPointGains.sort((a, b) => b.pointGain - a.pointGain);

      // Analyze club performance changes
      const clubPerformanceChanges: Array<{ club: string; change: 'up' | 'down' | 'stable'; playersInTop: number }> = [];
      const clubs = this.configurationService.getAllClubsForRegion(region as TOP_REGIONS);

      clubs.forEach(clubIndex => {
        const currentTopCount = this.countClubPlayersInTop(region as TOP_REGIONS, clubIndex, currentWeek);
        const previousTopCount = this.countClubPlayersInTop(region as TOP_REGIONS, clubIndex, previousWeek);
        
        let change: 'up' | 'down' | 'stable' = 'stable';
        if (currentTopCount > previousTopCount) change = 'up';
        else if (currentTopCount < previousTopCount) change = 'down';

        if (currentTopCount > 0 || previousTopCount > 0) {
          const clubName = this.getClubName(clubIndex);
          clubPerformanceChanges.push({
            club: clubName,
            change,
            playersInTop: currentTopCount
          });
        }
      });

      return {
        newTopPlayers: newTopPlayers.slice(0, 5),
        playersWhoDropped: playersWhoDropped.slice(0, 3),
        biggestPointGains: biggestPointGains.slice(0, 5),
        clubPerformanceChanges: clubPerformanceChanges.filter(c => c.change !== 'stable' || c.playersInTop >= 3)
      };

    } catch (error) {
      this.loggingService.warn(`Failed to build previous week comparison for ${region}:`, error);
      return undefined;
    }
  }

  private countClubPlayersInTop(region: TOP_REGIONS, clubIndex: string, weekName: number): number {
    let count = 0;
    
    for (const level of this.configurationService.allLevels) {
      const topPlayers = this.consolidateTopService
        .getTopForRegionAndLevel(region, level, weekName, 10);
      count += topPlayers.filter(p => p.clubIndex === clubIndex).length;
    }
    
    return count;
  }

  private getClubName(clubIndex: string): string {
    try {
      // Try to get club name from clubs ingestion service through consolidate service
      return this.consolidateTopService['clubIngestion'].getClubWithUniqueIndex(clubIndex)?.LongName || clubIndex;
    } catch {
      return clubIndex;
    }
  }

  private sanitizeDocumentId(id: string): string {
    // Replace invalid Firestore document ID characters with underscores
    // Invalid characters: / \ . # [ ] * 
    return id.replace(/[/\\#[\]*]/g, '_').replace(/\./g, '_');
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

}
