import {LoggingService} from "../../../common";
import {PlayersPointsProcessingService} from "../1-players-points/players-points-processing-service";
import {ProcessingServiceContract} from "../../processing-service-contract";
import {LevelAttributionService} from "../2-level-attribution/level-attribution-service";
import {topLevelOrder} from "../../../configuration/configuration.model";
import {PlayersTotalPoints, PlayerTotalPoints} from "./sum-points-model";
import {ConfigurationService} from '../../../configuration/configuration.service';

export class SumPointsService implements ProcessingServiceContract<PlayersTotalPoints> {

  private _model: PlayersTotalPoints;

  constructor(
    private readonly loggingService: LoggingService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly levelAttributionService: LevelAttributionService,
    private readonly configurationService: ConfigurationService,
  ) {
  }

  get model(): PlayersTotalPoints {
    return this._model;
  }

  getPlayerPoints(uniqueIndex: string, weekName: number): PlayerTotalPoints {
    return this._model[weekName][uniqueIndex];
  }

  async process(): Promise<void> {
    this.loggingService.info(`Counting points...`);
    this._model = {};
    for (let weekName = 1; weekName <= this.configurationService.runtimeConfiguration.weekName; weekName++) {
      this._model[weekName] = {};

      for (const [uniqueIndex] of Object.entries(this.levelAttributionService.model[weekName])) {
        const pointsToCount = this.getAllPointsForUniqueIndex(uniqueIndex, weekName);
        this._model[weekName][uniqueIndex] = {
          total: pointsToCount.reduce((acc, point) => acc + point, 0),
          count1Pts: this.countPtsForUniqueIndex(pointsToCount, 1),
          count2Pts: this.countPtsForUniqueIndex(pointsToCount, 2),
          count3Pts: this.countPtsForUniqueIndex(pointsToCount, 3),
          count5Pts: this.countPtsForUniqueIndex(pointsToCount, 5),
          count0Pts: this.countPtsForUniqueIndex(pointsToCount, 0),
        } as PlayerTotalPoints;
      }
    }
  }

  private getAllPointsForUniqueIndex(uniqueIndex: string, weekName: number): number[] {
    const divisionAttributed = this.levelAttributionService.getLevelForUniqueIndex(uniqueIndex, weekName);
    const allPoints = this.playersPointsProcessingService.getPlayerResultsUntilWeekName(uniqueIndex, weekName).points;
    return allPoints
      .filter((playerPoint) => topLevelOrder.indexOf(playerPoint.level) <= topLevelOrder.indexOf(divisionAttributed))
      .map(playerPoint => playerPoint.pointsWon);
  }

  private countPtsForUniqueIndex(pointsToCount: number[], pts: number): number {
    return pointsToCount.reduce((acc, currentValue) => currentValue === pts ? acc + 1 : acc, 0)
  }

}
