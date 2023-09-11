import {Service} from "typedi";
import {PlayersPointsProcessingService} from "./1-players-points/players-points-processing-service";
import {LevelAttributionService} from "./2-level-attribution/level-attribution-service";
import {SumPointsService} from "./3-sum-points/sum-points-service";
import {ConsolidateTopService} from "./4-consolidate-tops/consolidate-top-service";
import {LoggingService} from '../../common';

@Service()
export class TopProcessingService {
  constructor(
    private readonly logging: LoggingService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly levelAttribution: LevelAttributionService,
    private readonly sumPointsService: SumPointsService,
    private readonly consolidateTopService: ConsolidateTopService,
  ) {
  }

  async process(weekName: number): Promise<void> {
    this.logging.info(this.logging.getLayerInfo(`🧮 Top processing for week ${weekName}`));
    await this.playersPointsProcessingService.process();
    await this.levelAttribution.process();
    await this.sumPointsService.process();
    await this.consolidateTopService.process();

  }

}
