import {DigestingServiceContract} from "../digesting-service-contract";
import {ConsolidateTopService} from "../../processing/top/4-consolidate-tops/consolidate-top-service";
import {toTitleCase} from "../../common/text-helper";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService} from "../../common";
import {AxiosInstance} from 'axios';
import {AiSummaryService, RegionAnalytics} from "../ai-summary/ai-summary.service";
import {PlayerPosition} from "../../processing/top/4-consolidate-tops/consolidate-top-model";

export class FacebookPostingService implements DigestingServiceContract {
  constructor(
    private readonly consolidateTopService: ConsolidateTopService,
    private readonly configurationService: ConfigurationService,
    private readonly loggingService: LoggingService,
    private readonly aiSummaryService: AiSummaryService,
    private readonly axios: AxiosInstance,
  ) {
  }

  async digest(): Promise<void> {
    this.loggingService.info('Posting on Facebook for all regions...');
    
    if (!this.aiSummaryService.isEnabled()) {
      this.loggingService.warn('AI summary service is not enabled. Falling back to basic text generation.');
      await this.postBasicText();
      return;
    }

    try {
      await this.postAIGeneratedContent();
    } catch (e) {
      this.loggingService.error('Failed to post AI-generated content, falling back to basic text:', e.message);
      await this.postBasicText();
    }
  }

  private async postAIGeneratedContent(): Promise<void> {
    const currentWeek = this.configurationService.runtimeConfiguration.weekName;
    
    // Generate AI summaries for all regions
    const regionAnalytics: RegionAnalytics[] = [];
    
    for (const region of this.configurationService.allRegions) {
      const clubs = this.configurationService.getAllClubsForRegion(region);
      const playersByLevel: { [level: string]: number } = {};
      const topPlayersByLevel: { [level: string]: PlayerPosition[] } = {};
      let totalPlayers = 0;

      for (const level of this.configurationService.allLevels) {
        const allPlayersInLevel = this.consolidateTopService
          .getTopForRegionAndLevel(region, level, currentWeek, 1000);
        const topPlayersInLevel = this.consolidateTopService
          .getTopForRegionAndLevel(region, level, currentWeek, 10);
        
        playersByLevel[level] = allPlayersInLevel.length;
        topPlayersByLevel[level] = topPlayersInLevel;
        totalPlayers += allPlayersInLevel.length;
      }

      const analytics: RegionAnalytics = {
        region,
        weekName: currentWeek,
        totalPlayers,
        playersByLevel,
        topPlayersByLevel,
        clubs
      };

      regionAnalytics.push(analytics);
    }

    // Generate dedicated Facebook posts using the new method
    const facebookPosts = await this.aiSummaryService.generateBatchFacebookPosts(regionAnalytics);
    
    // Post each region's AI-generated Facebook content
    for (let i = 0; i < regionAnalytics.length; i++) {
      const analytics = regionAnalytics[i];
      const facebookPost = facebookPosts[i];
      
      if (facebookPost) {
        await this.postRegionContent(analytics.region, facebookPost);
      } else {
        this.loggingService.warn(`No Facebook post available for ${analytics.region}, skipping post`);
      }
    }
  }

  private async postRegionContent(region: string, facebookPost: string): Promise<void> {
    const currentWeek = this.configurationService.runtimeConfiguration.weekName;
    
    // Log the post content to console
    console.log(`\n=== FACEBOOK POST FOR ${region} - WEEK ${currentWeek} ===`);
    console.log(facebookPost);
    console.log('='.repeat(50));
    
    try {
      /*
      const payload = {
        content: facebookPost,
        region: region,
        week: currentWeek
      };

      const response = await this.axios.post(
        'https://hook.eu2.make.com/n8urup72oejw7uljo0iuo919etdfca9e', 
        payload
      );
      
      this.loggingService.trace(`Response from make for ${region}:`, response.data);
      */
      
      this.loggingService.info(`✅ Posted AI-generated Facebook content for ${region}`);
      
    } catch (e) {
      this.loggingService.error(`Failed to post for ${region}:`, e.message);
    }
  }

  private async postBasicText(): Promise<void> {
    this.loggingService.info('Posting basic text content...');
    
    // Fallback to original basic text generation for VERVIERS only
    const content = this.generateBasicText();
    
    // Log the post content to console
    console.log('\n=== FACEBOOK POST (BASIC TEXT) ===');
    console.log(content);
    console.log('='.repeat(50));
    
    try {
      const payload = {
        content: content,
        region: 'VERVIERS',
        week: this.configurationService.runtimeConfiguration.weekName,
        type: 'basic'
      };

      const response = await this.axios.post(
        'https://hook.eu2.make.com/n8urup72oejw7uljo0iuo919etdfca9e', 
        payload
      );
      
      this.loggingService.trace('Response from make (basic text):', response.data);
      this.loggingService.info('✅ Posted basic text content');
      
    } catch (e) {
      this.loggingService.error('Failed to post basic text:', e.message);
    }
  }

  getNextThursday(): Date {
    const today = new Date();
    const resultDate = new Date();
    resultDate.setDate(today.getDate() + (7 + 4 - today.getDay() - 1) % 7 + 1);
    resultDate.setHours(8, 0, 0);
    return resultDate;
  }

  generateBasicText(): string {
    const tops = this.consolidateTopService.model[this.configurationService.runtimeConfiguration.weekName].VERVIERS;
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
