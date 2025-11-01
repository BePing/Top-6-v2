import {ClubDto, ClubsApi} from "../../common/tabt-client";
import {IngestionServiceContract} from "../ingestion-service-contract";
import {ClubsIngestionModel} from "./clubs-ingestion-model";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService} from "../../common";

export class ClubsIngestionService implements IngestionServiceContract<ClubsIngestionModel> {

  private _model: ClubsIngestionModel;

  constructor(
    private readonly config: ConfigurationService,
    private readonly logging: LoggingService,
    private readonly clubsApi: ClubsApi
  ) {
  }

  async ingest() {
    this.logging.info('Fetching clubs info');
    const clubs = await this.clubsApi.findAllClubs();
    this._model = {
      clubs: clubs.data.filter((club) => {
        const uniqueIndex = club.uniqueIndex;
        if (!uniqueIndex) {
          this.logging.warn(`Club found without uniqueIndex: ${JSON.stringify(club)}`);
          return false;
        }
        return this.config.allClubsUniqueIndex.includes(uniqueIndex);
      })
    }
    this.logging.trace('✅  done');
  }

  get model(): ClubsIngestionModel {
    return this._model;
  }

  getClubWithUniqueIndex(uniqueIndex: string): ClubDto | undefined {
    return this._model.clubs.find((c) => c.uniqueIndex === uniqueIndex);
  }
}
