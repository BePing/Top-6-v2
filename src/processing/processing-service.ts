import {LoggingService} from "../common";
import {ErrorProcessingService} from "./error-processing-service/error-processing-service";
import {
  WeeklyMatchesSummaryProcessingService
} from "./weekly-matches-summary/weekly-matches-summary-processing-service";
import {ConfigurationService} from "../configuration/configuration.service";
import {TopProcessingService} from './top/top-processing-service';

export class ProcessingService {

  constructor(
    private readonly logging: LoggingService,
    private readonly weeklyMatchesSummaryProcessingService: WeeklyMatchesSummaryProcessingService,
    private readonly topProcessingService: TopProcessingService,
    private readonly errorProcessingService: ErrorProcessingService,
    private readonly configurationService: ConfigurationService,
  ) {
  }

  async process(): Promise<void> {
    this.logging.info(this.logging.getLayerInfo('🧮 PROCESSING'));

    await this.errorProcessingService.process(); // more init, but respecting contract
    await this.topProcessingService.process(this.configurationService.runtimeConfiguration.weekName);

    if (this.configurationService.runtimeConfiguration.weeklySummary) {
      await this.weeklyMatchesSummaryProcessingService.process();
    }
  }
}
