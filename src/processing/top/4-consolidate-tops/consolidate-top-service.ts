import {Service} from "typedi";
import {LoggingService} from "../../../common";
import {PlayersPointsProcessingService} from "../1-players-points/players-points-processing-service";
import {ProcessingServiceContract} from "../../processing-service-contract";
import {LevelAttributionService} from "../2-level-attribution/level-attribution-service";
import {TOP_LEVEL, TOP_REGIONS, topLevelOrder} from "../../../configuration/configuration.model";
import {ConfigurationService} from "../../../configuration/configuration.service";
import {SumPointsService} from "../3-sum-points/sum-points-service";
import {ConsolidateTopModel, PlayerPosition} from "./consolidate-top-model";
import {PlayerPoints} from "../1-players-points/players-points-processing-model";
import {ClubsIngestionService} from "../../../ingestion/clubs/clubs-ingestion-service";

@Service()
export class ConsolidateTopService implements ProcessingServiceContract<ConsolidateTopModel> {

  private _model: ConsolidateTopModel;

  constructor(
    private readonly loggingService: LoggingService,
    private readonly configurationService: ConfigurationService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly sumPointsService: SumPointsService,
    private readonly levelAttributionService: LevelAttributionService,
    private readonly clubIngestion: ClubsIngestionService
  ) {
  }

  get model(): ConsolidateTopModel {
    return this._model;
  }

  async process(): Promise<void> {
    this.loggingService.info(`Consolidating tops...`);
    this._model = {};

  }

  getConsolidatedTopForWeekName(weekName: number): ConsolidateTopModel {
    const model: ConsolidateTopModel = {};
    for (const region of Object.keys(TOP_REGIONS)) {
      model[region] = {};
      const clubsForRegion = this.configurationService.getAllClubsForRegion(region as TOP_REGIONS);
      const playersForRegion: [string, PlayerPoints][] = Object.entries(this.playersPointsProcessingService.model)
        .filter(([, playerPoints]) => clubsForRegion.includes((playerPoints.club)));
      for (const level of topLevelOrder) {
        const top: PlayerPosition[] = [];
        const uniqueIndexOfLevel: string[] = Object.entries(this.levelAttributionService.model)
          .filter(([, levelAttributed]) => level === levelAttributed)
          .map(([uniqueIndex]) => uniqueIndex);
        const playerForRegionInLevel: [string, PlayerPoints][] = playersForRegion
          .filter(([uniqueIndex]) => uniqueIndexOfLevel.includes(uniqueIndex));
        for (const [uniqueIndex, playerPoints] of playerForRegionInLevel) {
          // get points for player until weekName
          const countedPlayerPoints = this.sumPointsService.getPlayerPoints(uniqueIndex);
          top.push({
            uniqueIndex,
            clubIndex: playerPoints.club,
            clubName: this.clubIngestion.getClubWithUniqueIndex(playerPoints.club).LongName,
            name: playerPoints.name,
            points: countedPlayerPoints
          });
        }

        top.sort((a, b) =>
          ((b.points.total - a.points.total) * 100_000) +
          ((b.points.count5Pts - a.points.count5Pts) * 10_000) +
          ((b.points.count3Pts - a.points.count3Pts) * 1_000) +
          ((b.points.count2Pts - a.points.count2Pts) * 100) +
          ((b.points.count1Pts - a.points.count1Pts) * 10) +
          (a.name.localeCompare(b.name))
        );

        model[region][level] = top
      }
    }
    return model;
  }


  getTopForRegionAndLevel(region: TOP_REGIONS, level: TOP_LEVEL, numberOfPlayer = 12): PlayerPosition[] {
    return this.model[region][level].slice(0, numberOfPlayer - 1);
  }


}
