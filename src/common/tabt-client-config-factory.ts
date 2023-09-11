import {Configuration} from "./tabt-client";

export class TabtClientConfigFactory {
  static createConfiguration(apiUrl: string): Configuration {
    return new Configuration({
      basePath: apiUrl,
    });
  }
}
