import {Service} from "typedi";
import {DigestingServiceContract} from "../digesting-service-contract";
import {ConfigurationService} from "../../configuration/configuration.service";
import {FileSystemHelper, LoggingService} from "../../common";
import {
  WeeklyMatchesSummaryProcessingService
} from "../../processing/weekly-matches-summary/weekly-matches-summary-processing-service";
import {sortBy} from "lodash";
import {TOP_REGIONS} from "../../configuration/configuration.model";
import {toTitleCase} from "../../common/text-helper";

enum CATEGORY_MAPPING {
  "MEN" = "MEN",
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  "MEN_POST_23" = "MEN",
  "WOMEN" = "WOMEN",
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  "WOMEN_POST_23" = "WOMEN",
}


@Service()
export class WeeklyMatchesSummaryDigestionService implements DigestingServiceContract {
  constructor(
    private readonly weeklyMatchesSummaryProcessingModel: WeeklyMatchesSummaryProcessingService,
    private readonly configurationService: ConfigurationService,
    private readonly fileSystemHelper: FileSystemHelper,
    private readonly logging: LoggingService
  ) {
  }

  async digest(): Promise<void> {
    const matches = this.weeklyMatchesSummaryProcessingModel.model.matches;
    for (const [region, levels] of Object.entries(matches)) {
      this.logging.info(`Printing Techniques ${region}`);
      let texts = `# Technique ${region}\n\n`;
      for (const [level, divisions] of sortBy(Object.entries(levels), '0').reverse()) {
        for (const [division, categories] of sortBy(Object.entries(divisions), '0')) {
          for (const [category, matches] of Object.entries(categories)) {
            texts += `## ${level} ${division} ${CATEGORY_MAPPING[category]} \n`;
            for (const match of matches) {
              texts += `\t${match.homeTeam} - ${match.awayTeam} : ${match.score ?? ''}\t`;
              if (this.configurationService.getAllClubsForRegion(region as TOP_REGIONS).includes(match.homeClub)) {
                texts += `${match.homePlayers?.map(p => `${toTitleCase(p.name)} ${p.individualScore}`).join(' ') ?? ''} `;
              }
              if (this.configurationService.getAllClubsForRegion(region as TOP_REGIONS).includes(match.awayClub)) {
                texts += `${match.awayPlayers?.map(p => `${toTitleCase(p.name)} ${p.individualScore}`).join(' ') ?? ''}`;
              }
              texts += '\n'
            }
            texts += '\n'
          }
        }
      }
      this.fileSystemHelper.writeToFileA(
        texts,
        false,
        this.configurationService.getAbsolutePathTechniqueTxtFileName(region as TOP_REGIONS));
    }
  }

}
