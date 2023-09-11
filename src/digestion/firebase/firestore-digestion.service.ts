import {Inject, Service} from "typedi";
import {DigestingServiceContract} from "../digesting-service-contract";
import {ConsolidateTopService} from "../../processing/top/4-consolidate-tops/consolidate-top-service";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService} from "../../common";
import {app, firestore} from "firebase-admin";
import {PlayersPointsProcessingService} from "../../processing/top/1-players-points/players-points-processing-service";
import {LevelAttributionService} from "../../processing/top/2-level-attribution/level-attribution-service";
import {ConsolidateTopModel, PlayerPosition} from "../../processing/top/4-consolidate-tops/consolidate-top-model";
import {TOP_LEVEL} from "../../configuration/configuration.model";
import CollectionReference = firestore.CollectionReference;

interface PlayerPointsHistory {
  points: number,
  level: string,
  position: number,
  weekName: number
}

@Service()
export class FirestoreDigestionService implements DigestingServiceContract {

  uniqueIndexesInTops: string[] = [];

  constructor(
    @Inject('firebase.admin') private readonly firebaseService: app.App,
    private readonly consolidateTopService: ConsolidateTopService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly levelAttributionService: LevelAttributionService,
    private readonly configurationService: ConfigurationService,
    private readonly loggingService: LoggingService,
  ) {
  }

  async digest(): Promise<void> {
    await this.updateTops();
    await this.updateDetails();
  }

  private async updateTops() {
    this.loggingService.info('Saving tops to Firebase...');
    const updateBatch = this.firebaseService.firestore().batch();
    const topsCollection: CollectionReference = this.firebaseService.firestore().collection('/tops');
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
      console.log({clubs, levels});
      updateBatch.set(regionDoc, {clubs, levels});
      this.loggingService.trace('✅ ' + region);

      // Adding indexes into array to update only them
      this.uniqueIndexesInTops.push(...Object.values(levels).flat().map(playerPosition => playerPosition.uniqueIndex));
    }
    await updateBatch.commit();
  }

  private async updateDetails() {
    this.loggingService.info('Saving player details to Firebase...');
    // create a batch update
    const playerPointsCollectionRef = this.firebaseService.firestore().collection('/players-points-details');
    // create chunks of 500 players
    const chunks = this.uniqueIndexesInTops.reduce((acc, uniqueIndex, index) => {
      const chunkIndex = Math.floor(index / 500);
      if (!acc[chunkIndex]) {
        acc[chunkIndex] = [];
      }
      acc[chunkIndex].push(uniqueIndex);
      return acc;
    }, []);

    for(const chunk of chunks) {
      this.loggingService.trace(`Processing chunk of ${chunk.length} players...`);
      for (const uniqueIndex of chunk) {
        const batch = this.firebaseService.firestore().batch();

        const playerPoints = this.playersPointsProcessingService.getPlayerResultsUntilWeekName(uniqueIndex, this.configurationService.runtimeConfiguration.weekName);
        playerPoints.points.sort((a, b) => b.weekName - a.weekName);
        const level = this.levelAttributionService.getLevelForUniqueIndex(uniqueIndex, this.configurationService.runtimeConfiguration.weekName);
        const playerPointsHistory: PlayerPointsHistory[] = await this.getPlayerHistory(uniqueIndex);
        const documentRef = playerPointsCollectionRef.doc(uniqueIndex);
        batch.set(documentRef, {
          ...playerPoints,
          levelAttributed: level,
          history: playerPointsHistory,
        });
        await batch.commit();

      }
    }

    console.log(this.uniqueIndexesInTops.length)
    this.loggingService.trace('✅ ' + this.uniqueIndexesInTops.length + ' players updated');
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

}
