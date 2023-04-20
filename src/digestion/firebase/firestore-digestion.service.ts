import {Inject, Service} from "typedi";
import {DigestingServiceContract} from "../digesting-service-contract";
import {ConsolidateTopService} from "../../processing/top/4-consolidate-tops/consolidate-top-service";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService} from "../../common";
import {app, firestore} from "firebase-admin";
import {PlayersPointsProcessingService} from "../../processing/top/1-players-points/players-points-processing-service";
import {LevelAttributionService} from "../../processing/top/2-level-attribution/level-attribution-service";
import {PlayerPosition} from "../../processing/top/4-consolidate-tops/consolidate-top-model";
import {TOP_LEVEL} from "../../configuration/configuration.model";
import CollectionReference = firestore.CollectionReference;

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
    const topsCollection: CollectionReference = this.firebaseService.firestore().collection('/tops');
    for (const region of this.configurationService.allRegions) {
      const regionDoc = topsCollection.doc(region);

      const levels: {
        [index: string]: PlayerPosition[]
      } = this.configurationService.allLevels.reduce((acc, level: TOP_LEVEL) => {
        const results: PlayerPosition[] = this.consolidateTopService
          .getTopForRegionAndLevel(region, level, 13)
          .map((playerPosition: PlayerPosition, index: number) => ({...playerPosition, position: index}));
        return {...acc, [level]: results};
      }, {});
      const clubs = this.configurationService.getAllClubsForRegion(region);

      await regionDoc.set({clubs, levels});
      this.loggingService.trace('✅ ' + region);

      // Adding indexes into array to update only them
      this.uniqueIndexesInTops.push(...Object.values(levels).flat().map(playerPosition => playerPosition.uniqueIndex));
    }
  }

  private async updateDetails() {
    this.loggingService.info('Saving player details to Firebase...');
    // create a batch update
    const batch = this.firebaseService.firestore().batch();
    const playerPointsCollectionRef = this.firebaseService.firestore().collection('/players-points-details');

    for (const uniqueIndex of this.uniqueIndexesInTops) {
      const playerPoints = this.playersPointsProcessingService.model[uniqueIndex]
      playerPoints.points.sort((a, b) => b.weekName - a.weekName);
      const level = this.levelAttributionService.model[uniqueIndex];
      const documentRef = playerPointsCollectionRef.doc(uniqueIndex);
      batch.set(documentRef, {
        ...playerPoints,
        levelAttributed: level,
      });
    }
    await batch.commit();
    this.loggingService.trace('✅ ' + this.uniqueIndexesInTops.length + ' players updated');
  }
}
