import {LoggingService} from "../../common";
import {ErrorProcessingModel} from "./error-processing-model";
import {ProcessingServiceContract} from "../processing-service-contract";

export class ErrorProcessingService implements ProcessingServiceContract<ErrorProcessingModel> {

  _model: ErrorProcessingModel;

  constructor(
    private readonly loggingService: LoggingService
  ) {
    // Initialize model immediately to prevent undefined access
    this._model = {
      errors: [],
      warnings: []
    };
  }

  async process(): Promise<void> {
    this._model = {
      errors: [],
      warnings: []
    }
  }

  error(error: string) {
    this.loggingService.error(error);
    this._model.errors.push(error);
  }

  warn(warn: string) {
    this.loggingService.warn(warn);
    this._model.warnings.push(warn);
  }

  get model(): ErrorProcessingModel {
    return this._model;
  }

  get allErrorsAndWarning(): string[] {
    return [...this.model.errors, ...this.model.warnings];
  }


}
