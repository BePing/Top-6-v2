import {LoggingService} from "../../../common";
import {PlayersPointsProcessingService} from "../1-players-points/players-points-processing-service";
import {ProcessingServiceContract} from "../../processing-service-contract";
import {PlayerPoint, PlayerPoints} from "../1-players-points/players-points-processing-model";
import {groupBy} from "lodash";
import {TOP_LEVEL} from "../../../configuration/configuration.model";
import {PlayersLevelAttribution} from "./level-attribution-model";
import {ConfigurationService} from '../../../configuration/configuration.service';

export class LevelAttributionService implements ProcessingServiceContract<PlayersLevelAttribution> {

  private _model: PlayersLevelAttribution;

  constructor(
    private readonly loggingService: LoggingService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly configurationService: ConfigurationService,
  ) {
  }

  get model(): PlayersLevelAttribution {
    return this._model;
  }

  async process(): Promise<void> {
    this.loggingService.info(`Attributing levels...`);
    this._model = {}

    for (let weekName = 1; weekName <= this.configurationService.runtimeConfiguration.weekName; weekName++) {
      this._model[weekName] = {};
      for (const [uniqueIndex, playerPoints] of Object.entries<PlayerPoints>(this.playersPointsProcessingService.model)) {
        const pointsForWeekname: PlayerPoint[] = playerPoints.points.filter((playerPoint) => playerPoint.weekName <= weekName);
        const pointsPerLevels: [string, PlayerPoint[]][] = Object.entries(groupBy(pointsForWeekname, 'level'));
        const mainLevel =
          pointsPerLevels.sort((
              [_levelA, pointsA]: [TOP_LEVEL, PlayerPoint[]],
              [_levelB, pointsB]: [TOP_LEVEL, PlayerPoint[]],
            ) => {
              // First, sort by count (descending) - level with most matches wins
              const countDiff = pointsB.length - pointsA.length;
              if (countDiff !== 0) {
                return countDiff;
              }
              // If counts are equal, find the first weekName for each level
              const firstWeekA = Math.min(...pointsA.map(p => p.weekName));
              const firstWeekB = Math.min(...pointsB.map(p => p.weekName));
              // Return the level that was played first (earliest weekName)
              return firstWeekA - firstWeekB;
            },
          );
        this._model[weekName][uniqueIndex] = (mainLevel?.[0]?.[0] as TOP_LEVEL) ?? TOP_LEVEL.NA;
      }
    }
  }
  getLevelForUniqueIndex(uniqueIndex: string, weekName: number): TOP_LEVEL {
    return this.model[weekName][uniqueIndex];
  }
}
