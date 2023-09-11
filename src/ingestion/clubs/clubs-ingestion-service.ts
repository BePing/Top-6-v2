import {Inject, Service} from "typedi";
import {ClubEntry, ClubsApi} from "../../common/tabt-client";
import {IngestionServiceContract} from "../ingestion-service-contract";
import {ClubsIngestionModel} from "./clubs-ingestion-model";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService} from "../../common";

@Service()
export class ClubsIngestionService implements IngestionServiceContract<ClubsIngestionModel> {

  private _model: ClubsIngestionModel;

  constructor(
    private readonly config: ConfigurationService,
    private readonly logging: LoggingService,
    @Inject('clubs.api') private readonly clubsApi: ClubsApi
  ) {
  }

  async ingest() {
    this.logging.info('Fetching clubs info');
    const clubs = await this.clubsApi.findAllClubs({xTabtSeason: "23"});
    this._model = {
      clubs: clubs.data.filter((club) => this.config.allClubsUniqueIndex.includes(club.UniqueIndex))
    }
    this.logging.trace('✅  done');
  }

  get model(): ClubsIngestionModel {
    return this._model;
  }

  getClubWithUniqueIndex(uniqueIndex: string): ClubEntry {
    return this._model.clubs.find((c) => c.UniqueIndex === uniqueIndex);
  }
}
