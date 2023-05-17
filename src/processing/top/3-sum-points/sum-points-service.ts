import {Service} from "typedi";
import {LoggingService} from "../../../common";
import {PlayersPointsProcessingService} from "../1-players-points/players-points-processing-service";
import {ProcessingServiceContract} from "../../processing-service-contract";
import {LevelAttributionService} from "../2-level-attribution/level-attribution-service";
import {topLevelOrder} from "../../../configuration/configuration.model";
import {PlayersTotalPoints, PlayerTotalPoints} from "./sum-points-model";

@Service()
export class SumPointsService implements ProcessingServiceContract<PlayersTotalPoints> {

  private _model: PlayersTotalPoints;

  constructor(
    private readonly loggingService: LoggingService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly levelAttributionService: LevelAttributionService,
  ) {
  }

  get model(): PlayersTotalPoints {
    return this._model;
  }

  getPlayerPoints(uniqueIndex: string): PlayerTotalPoints {
    return this._model[uniqueIndex];
  }

  async process(): Promise<void> {
    this.loggingService.info(`Counting points...`);
    this._model = {};
    for (const [uniqueIndex] of Object.entries(this.levelAttributionService.model)) {
      const pointsToCount = this.getAllPointsForUniqueIndex(uniqueIndex);

      this._model[uniqueIndex] = {
        total: pointsToCount.reduce((acc, point) => acc + point, 0),
        count1Pts: this.countPtsForUniqueIndex(uniqueIndex, 1),
        count2Pts: this.countPtsForUniqueIndex(uniqueIndex, 2),
        count3Pts: this.countPtsForUniqueIndex(uniqueIndex, 3),
        count5Pts: this.countPtsForUniqueIndex(uniqueIndex, 5),
        count0Pts: this.countPtsForUniqueIndex(uniqueIndex, 0),
      } as PlayerTotalPoints;
    }
  }
  private getAllPointsForUniqueIndex(uniqueIndex: string): number[] {
    const divisionAttributed = this.levelAttributionService.model[uniqueIndex]
    const allPoints = this.playersPointsProcessingService.model[uniqueIndex].points;
    return allPoints
      .filter((playerPoint) => topLevelOrder.indexOf(playerPoint.level) <= topLevelOrder.indexOf(divisionAttributed))
      .map(playerPoint => playerPoint.pointsWon);
  }

  private countPtsForUniqueIndex(uniqueIndex: string, pts: number): number {
    return this.getAllPointsForUniqueIndex(uniqueIndex)
      .reduce((acc, currentValue) => {
        if (currentValue === pts) {
          return acc + 1;
        }
        return acc;
      }, 0)
  }

}
