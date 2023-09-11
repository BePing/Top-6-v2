import {Service} from "typedi";
import {ConfigurationService} from "../../configuration/configuration.service";
import {FileSystemHelper, LoggingService} from "../../common";
import {DigestingServiceContract} from "../digesting-service-contract";
import {PlayersPointsProcessingService} from "../../processing/top/1-players-points/players-points-processing-service";
import {LevelAttributionService} from "../../processing/top/2-level-attribution/level-attribution-service";
import {SumPointsService} from "../../processing/top/3-sum-points/sum-points-service";
import {ConsolidateTopService} from "../../processing/top/4-consolidate-tops/consolidate-top-service";
import {
  WeeklyMatchesSummaryProcessingService
} from "../../processing/weekly-matches-summary/weekly-matches-summary-processing-service";
import {DivisionsMatchesIngestionService} from '../../ingestion/divisions-matches/divisions-matches-ingestion-service';

@Service()
export class DebugDigestionService implements DigestingServiceContract {
  constructor(
    private readonly weeklyMatchesSummaryProcessingService: WeeklyMatchesSummaryProcessingService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly levelAttributionService: LevelAttributionService,
    private readonly sumPointsService: SumPointsService,
    private readonly consolidateTopService: ConsolidateTopService,
    private readonly divisionsMatchesIngestionService: DivisionsMatchesIngestionService,
    private readonly configurationService: ConfigurationService,
    private readonly fileSystemHelper: FileSystemHelper,
    private readonly logging: LoggingService) {
  }

  async digest(): Promise<void> {
    this.logging.info(`Saving debug`);

    const debug: [string, object][] = [
      [this.configurationService.absolutePathPlayerPointsFileName, this.playersPointsProcessingService.model],
      [this.configurationService.absolutePathLevelAttributionFileName, this.levelAttributionService.model],
      [this.configurationService.absolutePathPointsToCountFileName, this.sumPointsService.model],
      [this.configurationService.absolutePathConsolidateTopDebugFileName, this.consolidateTopService.model],
      [this.configurationService.absolutePathDivisionsMatchesDebugFileName, this.divisionsMatchesIngestionService.model],
    ];
    if (this.configurationService.runtimeConfiguration.weeklySummary) {
      debug.push([this.configurationService.absolutePathTechniqueDebugFileName, this.weeklyMatchesSummaryProcessingService.model]);
    }
    for (const [file, model] of debug) {
      this.fileSystemHelper.writeToFileA(model, true, file);

    }
  }
}
