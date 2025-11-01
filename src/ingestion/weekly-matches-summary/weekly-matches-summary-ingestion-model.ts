import {TeamMatchesEntryDTO} from "../../common";
import {TOP_REGIONS} from "../../configuration/configuration.model";

export interface WeeklyMatchesSummaryIngestionModel {
  matches: {
    [x in TOP_REGIONS]?: TeamMatchesEntryDTO[]
  }
  from: Date;
  to: Date;
}
