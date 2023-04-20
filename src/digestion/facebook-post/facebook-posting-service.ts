import {DigestingServiceContract} from "../digesting-service-contract";
import {ConsolidateTopService} from "../../processing/top/4-consolidate-tops/consolidate-top-service";
import {Service} from "typedi";
import {toTitleCase} from "../../common/text-helper";
import {ConfigurationService} from "../../configuration/configuration.service";
import * as FB from 'fb';
import {LoggingService} from "../../common";

@Service()
export class FacebookPostingService implements DigestingServiceContract {
  constructor(
    private readonly consolidateTopService: ConsolidateTopService,
    private readonly configurationService: ConfigurationService,
    private readonly loggingService: LoggingService
  ) {
  }

  async digest(): Promise<void> {
    this.loggingService.info('Posting on facebook...');
    const text = this.generateText();
    FB.setAccessToken(this.configurationService.facebookConfig.access_token);
    try {
      const postid = await (new Promise((resolve, reject) => {
        FB.api(this.configurationService.facebookConfig.page_id + '/feed', 'post', {
          message: text,
          published: true,
        }, (res: any) => {
          if (!res || res.error) {
            reject(new Error('Error when posting to Facebook. ' + res.error.message));
          }
          resolve(res.id);
        })
      }));
      this.loggingService.trace('Posted on facebook: ' + postid);
    } catch (e) {
      this.loggingService.error(e.message);
    }
  }

  getNextThursday(): Date {
    const today = new Date();
    const resultDate = new Date();
    resultDate.setDate(today.getDate() + (7 + 4 - today.getDay() - 1) % 7 + 1);
    resultDate.setHours(8, 0, 0);
    return resultDate;
  }

  generateText(): string {
    const tops = this.consolidateTopService.model.VERVIERS;
    let text = 'Classement de la journée n°' + this.configurationService.runtimeConfiguration.weekName;
    for (const [level, playerPositions] of Object.entries(tops)) {
      text += '\n\n## Catégorie ' + level;
      for (const [index, playerPostition] of playerPositions.slice(0, 12).entries()) {
        text += `\n${index + 1}. ${toTitleCase(playerPostition.name)} - ${playerPostition.clubName} - ${playerPostition.points.total} points`
      }
      text += '\n'
    }
    return text;
  }

}
