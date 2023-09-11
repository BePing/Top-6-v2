import {Inject, Service} from "typedi";
import {IngestionServiceContract} from "../ingestion-service-contract";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService, MatchesApi} from "../../common";
import {DivisionsMatchesIngestionModel} from "./divisions-matches-ingestion-model";

@Service()
export class DivisionsMatchesIngestionService implements IngestionServiceContract<DivisionsMatchesIngestionModel> {

  private _model: DivisionsMatchesIngestionModel;

  constructor(
    private readonly config: ConfigurationService,
    private readonly logging: LoggingService,
    @Inject('matches.api') private readonly matchesApi: MatchesApi
  ) {
  }

  async ingest(): Promise<void> {
    this.logging.info('Fetching matches for all divisions');
    let total = 0;
    this._model = {matches: []};
    for (const divisionId of this.config.allDivisions) {
      const {data: matches} = await this.matchesApi.findAllMatches({
        divisionId,
        withDetails: true,
        xTabtSeason: "23"
      });
      this._model.matches.push(...matches);
      // this._model.matches.push(...matches.filter(m => Number(m.WeekName) <= this.config.runtimeConfiguration.weekName));
      total += matches.length;
      this.logging.trace(`${matches.length > 0 ? '✅ ' : '⛔️'} ${divisionId} - ${matches.length} matches`);
    }
    this.logging.trace(`---`);
    this.logging.trace(`Ingested ${total} matches`);
  }

  get model(): DivisionsMatchesIngestionModel {
    return this._model;
  }
}
