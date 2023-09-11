import {Service} from "typedi";
import {LoggingService} from "../../../common";
import {PlayersPointsProcessingService} from "../1-players-points/players-points-processing-service";
import {ProcessingServiceContract} from "../../processing-service-contract";
import {PlayerPoint, PlayerPoints} from "../1-players-points/players-points-processing-model";
import {groupBy} from "lodash";
import {TOP_LEVEL, topLevelOrder} from "../../../configuration/configuration.model";
import {PlayersLevelAttribution} from "./level-attribution-model";
import {ConfigurationService} from '../../../configuration/configuration.service';

@Service()
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
              [levelA, pointsA]: [TOP_LEVEL, PlayerPoint[]],
              [levelB, pointsB]: [TOP_LEVEL, PlayerPoint[]],
            ) =>
              ((pointsB.length - pointsA.length) * 10) + (topLevelOrder.indexOf(levelB) - topLevelOrder.indexOf(levelA)),
          );
        this._model[weekName][uniqueIndex] = (mainLevel?.[0]?.[0] as TOP_LEVEL) ?? TOP_LEVEL.NA;
      }
    }
  }
  getLevelForUniqueIndex(uniqueIndex: string, weekName: number): TOP_LEVEL {
    return this.model[weekName][uniqueIndex];
  }
}
