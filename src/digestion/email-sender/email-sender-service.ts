import {LoggingService} from "../../common";
import {ConfigurationService} from "../../configuration/configuration.service";
import {DigestingServiceContract} from "../digesting-service-contract";
import * as mailjet from 'node-mailjet';
import * as fs from "fs";
import path from "path";
import {ErrorProcessingService} from "../../processing/error-processing-service/error-processing-service";
import Mailjet from 'node-mailjet';

export class EmailSenderService implements DigestingServiceContract {
  mailClient: Mailjet;

  constructor(
    private readonly loggingService: LoggingService,
    private readonly configurationService: ConfigurationService,
    private readonly errorProcessingService: ErrorProcessingService,
  ) {
    this.mailClient = new mailjet.Client({
      apiKey: this.configurationService.emailConfig.mailjet.api_key,
      apiSecret: this.configurationService.emailConfig.mailjet.api_secret
    });
  }

  async digest(): Promise<void> {
    this.loggingService.info('Sending emails...');
    const attachments = [];

    for (const region of this.configurationService.allRegions) {
      const topFilePath = this.configurationService.absolutePathConsolidatedTopExcelFileName(region);
      const topFile = fs.readFileSync(topFilePath, 'binary');
      const topFilename = path.basename(topFilePath);
      attachments.push({
        'Base64Content': Buffer.from(topFile, 'binary').toString('base64'),
        'Filename': topFilename,
        'ContentType': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      if (this.configurationService.runtimeConfiguration.weeklySummary) {
        const weeklySummaryFilePath = this.configurationService.getAbsolutePathTechniqueTxtFileName(region);
        const weeklySummaryFile = fs.readFileSync(weeklySummaryFilePath, 'utf-8');
        const weeklySummaryFilename = path.basename(weeklySummaryFilePath);
        attachments.push({
          'Base64Content': Buffer.from(weeklySummaryFile, 'utf-8').toString('base64'),
          'Filename': weeklySummaryFilename,
          'ContentType': 'plain/text'
        })
      }
    }

    let text = this.configurationService.emailConfig.text;
    if (this.errorProcessingService._model.errors.length > 0) {
      text += `<p>Nous avons détecté les erreurs suivantes :</p><ul>`;
      for (const error of this.errorProcessingService._model.errors) {
        text += `<li>${error}</li>`;
      }
      text += '</ul>'
    }
    if (this.errorProcessingService._model.warnings.length > 0) {
      text += `<p>Nous vous informons que des avertissements ont été émis pour :</p><ul>`;
      for (const error of this.errorProcessingService._model.warnings) {
        text += `<li>${error}</li>`;
      }
      text += '</ul>'
    }
    text += `<p>Cordialement,</p><p>Florent Cardoen</p>`;

    const data = {
      'Messages': [
        {
          'From': {
            'Email': 'beping@floca.be',
            'Name': 'BePing server'
          },
          'To': (
            this.configurationService.emailsRecipients).map((email: string) => ({'Email': email})),
          'ReplyTo': {'Email': 'f.cardoen@me.com'},
          'Subject': this.configurationService.emailConfig.subject,
          'HTMLPart': text,
          'Attachments': attachments
        }
      ]
    };

    await this.mailClient.post('send', {'version': 'v3.1'}).request(data);
    this.loggingService.trace('Emails sent to ' + (this.configurationService.emailsRecipients).join(','));

  }
}
