import {IngestionServiceContract} from "../ingestion-service-contract";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService, MatchesApi} from "../../common";
import {DivisionsMatchesIngestionModel} from "./divisions-matches-ingestion-model";

export class DivisionsMatchesIngestionService implements IngestionServiceContract<DivisionsMatchesIngestionModel> {

  private _model: DivisionsMatchesIngestionModel;

  constructor(
    private readonly config: ConfigurationService,
    private readonly logging: LoggingService,
    private readonly matchesApi: MatchesApi
  ) {
  }

  async ingest(): Promise<void> {
    const totalDivisions = this.config.allDivisions.length;
    this.logging.info(`Fetching matches for ${totalDivisions} divisions...`);
    let total = 0;
    let processed = 0;
    this._model = {matches: []};

    for (const divisionId of this.config.allDivisions) {
      processed++;
      this.logging.info(`📥 Processing division ${processed}/${totalDivisions}: ${divisionId}`);

      try {
        const {data: matches} = await this.matchesApi.findAllMatches({
          divisionId,
          xTabtSeason: '25',
          withDetails: true,
        });
        this._model.matches.push(...matches);
        // this._model.matches.push(...matches.filter(m => Number(m.WeekName) <= this.config.runtimeConfiguration.weekName));
        total += matches.length;
        this.logging.info(`${matches.length > 0 ? '✅ ' : '⛔️'} Division ${divisionId} - ${matches.length} matches (Total: ${total})`);
      } catch (error) {
        this.logging.warn(`⚠️ Failed to fetch matches for division ${divisionId}: ${error.message}`);
      }
    }
    this.logging.info(`🎉 Completed ingestion: ${total} matches from ${totalDivisions} divisions`);
  }

  get model(): DivisionsMatchesIngestionModel {
    if (!this._model) {
      return { matches: [] };
    }
    return this._model;
  }
}
