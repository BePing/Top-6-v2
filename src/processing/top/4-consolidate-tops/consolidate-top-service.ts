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

export class ConsolidateTopService implements ProcessingServiceContract<ConsolidateTopModel> {

  private _model: ConsolidateTopModel;

  constructor(
    private readonly loggingService: LoggingService,
    private readonly configurationService: ConfigurationService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly sumPointsService: SumPointsService,
    private readonly levelAttributionService: LevelAttributionService,
    public readonly clubIngestion: ClubsIngestionService, // Made public to allow access from FirestoreDigestionService
  ) {
  }

  get model(): ConsolidateTopModel {
    return this._model;
  }

  async process(): Promise<void> {
    this.loggingService.info(`Consolidating tops...`);
    this._model = {};
    for (let weekName = 1; weekName <= this.configurationService.runtimeConfiguration.weekName; weekName++) {
      this._model[weekName] = {};
      for (const region of Object.keys(TOP_REGIONS)) {
        this._model[weekName][region] = {};
        const clubsForRegion = this.configurationService.getAllClubsForRegion(region as TOP_REGIONS);
        const playersForRegion: [string, PlayerPoints][] = Object.entries(this.playersPointsProcessingService.model).filter(([, playerPoints]) => clubsForRegion.includes((playerPoints.club)));
        for (const level of topLevelOrder) {
          const top: PlayerPosition[] = [];
          const uniqueIndexOfLevel: string[] = Object.entries(this.levelAttributionService.model[weekName]).filter(([, levelAttributed]) => level === levelAttributed).map(([uniqueIndex]) => uniqueIndex);
          const playersForRegionInLevel: string[] = playersForRegion.filter(([uniqueIndex]) => uniqueIndexOfLevel.includes(uniqueIndex)).map(([uniqueIndex]) => uniqueIndex);
          for (const uniqueIndex of playersForRegionInLevel) {
            const countedPlayerPoints = this.sumPointsService.getPlayerPoints(uniqueIndex, weekName);
            const playerPoints = this.playersPointsProcessingService.getPlayerResultsUntilWeekName(uniqueIndex, weekName);
            const club = this.clubIngestion.getClubWithUniqueIndex(playerPoints.club);
            if (!club) {
              this.loggingService.warn(`Club with uniqueIndex ${playerPoints.club} not found for player ${playerPoints.name}`);
              continue;
            }
            top.push({
              uniqueIndex,
              clubIndex: playerPoints.club,
              clubName: club.longName,
              name: playerPoints.name,
              points: countedPlayerPoints,
            });
          }

          top.sort((a, b) =>
            ((b.points.total - a.points.total) * 100_000) +
            ((b.points.count5Pts - a.points.count5Pts) * 10_000) +
            ((b.points.count3Pts - a.points.count3Pts) * 1_000) +
            ((b.points.count2Pts - a.points.count2Pts) * 100) +
            ((b.points.count1Pts - a.points.count1Pts) * 10) +
            (a.name.localeCompare(b.name)),
          );

          this._model[weekName][region][level] = top
        }
      }
    }

  }


  getTopForRegionAndLevel(region: TOP_REGIONS, level: TOP_LEVEL, weekname: number, numberOfPlayer = 12): PlayerPosition[] {
    return this.model[weekname][region][level].slice(0, numberOfPlayer - 1);
  }


}
