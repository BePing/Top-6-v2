import {ProcessingServiceContract} from "../processing-service-contract";
import {WeeklyMatchesSummaryProcessingModel, WeeklyMatchSummary} from "./weekly-matches-summary-processing-model";
import {
  WeeklyMatchesSummaryIngestionService
} from "../../ingestion/weekly-matches-summary/weekly-matches-summary-ingestion-service";
import {
  DivisionEntryDtoV1DivisionCategoryTabt,
  DivisionEntryDtoV1LevelTabt,
  LoggingService,
  TeamMatchesEntryDTO
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
        const division = this.divisionsIngestionService.getDivision(match.divisionId);
        if (!division) {
          this.logging.warn(`Division ${match.divisionId} not found`);
          continue;
        }
        const divisionName = division.DivisionName && division.DivisionName.length === 1 ? `${division.DivisionName}A` : division.DivisionName;
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

  private static mapTeamMatchEntry(match: TeamMatchesEntryDTO): WeeklyMatchSummary {
    return {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeClub: match.homeClub,
      awayClub: match.awayClub,
      score: match.score,
      homePlayers: match.matchDetails?.homePlayers?.players?.map((player) => ({
        name: `${player.firstName[0]}. ${player.lastName}`,
        individualScore: player.victoryCount ?? 0
      })),
      awayPlayers: match.matchDetails?.awayPlayers?.players?.map((player) => ({
        name: `${player.firstName[0]}. ${player.lastName}`,
        individualScore: player.victoryCount ?? 0
      }))
    }
  }

  private createDivisionInModelIfRequired(region: TOP_REGIONS, divisionName: string, divisionCategory: DivisionEntryDtoV1DivisionCategoryTabt, divisionLevel: DivisionEntryDtoV1LevelTabt): void {
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
