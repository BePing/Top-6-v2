import {IngestionServiceContract} from "../ingestion-service-contract";
import {WeeklyMatchesSummaryIngestionModel} from "./weekly-matches-summary-ingestion-model";
import {LoggingService, MatchesApi, TeamMatchesEntryDTO} from "../../common";
import {ConfigurationService} from "../../configuration/configuration.service";
import {format, sub} from "date-fns";
import {uniqBy} from "lodash";

export class WeeklyMatchesSummaryIngestionService implements IngestionServiceContract<WeeklyMatchesSummaryIngestionModel> {
  private _model: WeeklyMatchesSummaryIngestionModel;

  constructor(
    private readonly config: ConfigurationService,
    private readonly logging: LoggingService,
    private readonly matchesApi: MatchesApi,
    private readonly randomIp: () => string
  ) {
  }

  async ingest(): Promise<void> {
    this._model = {
      from: sub(new Date(), {weeks: 1}),
      to: new Date(),
      matches: {}
    };
    this.logging.info(`Fetching matches for all divisions for weekly summary (${format(this._model.from, 'dd/MM')} - ${format(this._model.to, 'dd/MM')})`);

    const regions = this.config.allRegions;
    let total = 0;
    let processedRegions = 0;

    for (const region of regions) {
      processedRegions++;
      const clubs = this.config.getAllClubsForRegion(region);
      this.logging.info(`📍 Processing region ${processedRegions}/${regions.length}: ${region} (${clubs.length} clubs)`);

      let processedClubs = 0;
      for (const club of clubs) {
        processedClubs++;

        try {
          const {data: matches} = await this.matchesApi.findAllMatches({
            club,
            withDetails: true,
            yearDateFrom: format(this._model.from, 'yyyy-MM-dd'),
            yearDateTo: format(this._model.to, 'yyyy-MM-dd'),
            showDivisionName: 'yes'
          }, {
            headers: {
              'x-forwarded-for': this.randomIp()
            }
          });

          if(matches.length){
            const nonByeMatches = matches.filter((match: TeamMatchesEntryDTO) => !(match.homeTeam.includes('Bye') || match.awayTeam.includes('Bye')));
            this._model.matches[region] = uniqBy([
              ...(this._model.matches[region] ?? []),
              ...nonByeMatches
            ], 'matchId');
            total += nonByeMatches.length;
          }

          if (processedClubs % 10 === 0 || processedClubs === clubs.length) {
            this.logging.info(`  Progress: ${processedClubs}/${clubs.length} clubs processed for ${region}`);
          }
        } catch (error) {
          this.logging.warn(`⚠️ Failed to fetch matches for club ${club}: ${error.message}`);
        }
      }
      this.logging.info(`✅ Completed region ${region}: ${total} total matches so far`);
    }
    this.logging.info(`🎉 Weekly summary ingestion completed: ${total} matches from ${regions.length} regions`);
  }

  get model(): WeeklyMatchesSummaryIngestionModel {
    return this._model;
  }

}
