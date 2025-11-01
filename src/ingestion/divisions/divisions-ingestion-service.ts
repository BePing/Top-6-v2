import {DivisionEntryDtoV1, DivisionsApi} from "../../common/tabt-client";
import {IngestionServiceContract} from "../ingestion-service-contract";
import {DivisionsIngestionModel} from "./divisions-ingestion-model";
import {LoggingService} from "../../common";

export class DivisionsIngestionService implements IngestionServiceContract<DivisionsIngestionModel> {

  private _model: DivisionsIngestionModel;

  constructor(
    private readonly logging: LoggingService,
    private readonly divisionsApi: DivisionsApi
  ) {
  }

  async ingest() {
    this.logging.info('Fetching divisions info');
    const {data: divisions} = await this.divisionsApi.findAllDivisionsV1({
      showDivisionName: 'short',
    });
    this._model = {
      divisions
    }
    this.logging.trace('✅  done');
  }

  get model(): DivisionsIngestionModel {
    return this._model;
  }

  getDivision(divId: number): DivisionEntryDtoV1 | undefined {
    return this.model.divisions.find((d) => d.DivisionId === divId);
  }
}
