import {ProcessingServiceContract} from "../processing-service-contract";
import {WeeklyMatchesSummaryProcessingModel, WeeklyMatchSummary} from "./weekly-matches-summary-processing-model";
import {
  WeeklyMatchesSummaryIngestionService
} from "../../ingestion/weekly-matches-summary/weekly-matches-summary-ingestion-service";
import {
  DivisionEntryDivisionCategoryTabt,
  DivisionEntryLevelTabt,
  LoggingService,
  TeamMatchesEntry
} from "../../common";
import {TOP_REGIONS} from "../../configuration/configuration.model";
import {DivisionsIngestionService} from "../../ingestion/divisions/divisions-ingestion-service";

export class WeeklyMatchesSummaryProcessingService implements ProcessingServiceContract<WeeklyMatchesSummaryProcessingModel> {
  private _model: WeeklyMatchesSummaryProcessingModel;

  constructor(
    private readonly logging: LoggingService,
    private readonly weeklyMatchesSummaryIngestionService: WeeklyMatchesSummaryIngestionService,
    private readonly divisionsIngestionService: DivisionsIngestionService
  ) {
  }

  get model(): WeeklyMatchesSummaryProcessingModel {
    return this._model;
  }

  async process(): Promise<void> {
    this.logging.info(`Processing weekly summary`);
    this.createEmptyModel();
    const matchesPerRegions = this.weeklyMatchesSummaryIngestionService.model.matches;


    for (const [region, matches] of Object.entries(matchesPerRegions)) {
      this.logging.trace(`Processing ${region} matches`);

      for (const match of matches) {
        const division = this.divisionsIngestionService.getDivision(match.DivisionId);
        const divisionName = division.DivisionName.length === 1 ? `${division.DivisionName}A` : division.DivisionName;
        this.createDivisionInModelIfRequired(region as TOP_REGIONS, divisionName, division.DivisionCategory, division.Level);

        this._model.matches[region as TOP_REGIONS][division.Level][divisionName][division.DivisionCategory].push(WeeklyMatchesSummaryProcessingService.mapTeamMatchEntry(match))
      }
    }
  }

  private createEmptyModel() {
    this._model = {
      from: this.weeklyMatchesSummaryIngestionService.model.from,
      to: this.weeklyMatchesSummaryIngestionService.model.to,
      matches: {
        [TOP_REGIONS.LIEGE]: {},
        [TOP_REGIONS.HUY_WAREMME]: {},
        [TOP_REGIONS.VERVIERS]: {}
      }
    };

  }

  private static mapTeamMatchEntry(match: TeamMatchesEntry): WeeklyMatchSummary {
    return {
      homeTeam: match.HomeTeam,
      awayTeam: match.AwayTeam,
      homeClub: match.HomeClub,
      awayClub: match.AwayClub,
      score: match.Score,
      homePlayers: match.MatchDetails?.HomePlayers?.Players?.map((player) => ({
        name: `${player.FirstName[0]}. ${player.LastName}`,
        individualScore: player.VictoryCount
      })),
      awayPlayers: match.MatchDetails?.AwayPlayers?.Players?.map((player) => ({
        name: `${player.FirstName[0]}. ${player.LastName}`,
        individualScore: player.VictoryCount
      }))
    }
  }

  private createDivisionInModelIfRequired(region: TOP_REGIONS, divisionName: string, divisionCategory: DivisionEntryDivisionCategoryTabt, divisionLevel: DivisionEntryLevelTabt): void {
    if (!this._model.matches[region][divisionLevel]?.[divisionName]?.[divisionCategory]) {
      this._model.matches[region] = {
        ...this.model.matches[region],
        [divisionLevel]: {
          ...this.model.matches[region]?.[divisionLevel],
          [divisionName]: {
            ...this.model.matches[region][divisionLevel]?.[divisionName],
            [divisionCategory]: []
          }
        }
      }
    }
  }
}
