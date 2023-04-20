import {Configuration} from "./tabt-client";
import {configurationConst} from "../configuration/configuration.const";

export class TabtClientConfigFactory {
  static createConfiguration(): Configuration {
    return new Configuration({
      basePath: configurationConst.beping_url,
    });
  }
}
