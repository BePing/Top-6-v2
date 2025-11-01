import {LoggingService} from "../common";
import {DebugDigestionService} from "./debug/debug-digestion-service";
import {WeeklyMatchesSummaryDigestionService} from "./weekly-matches-summary/weekly-matches-summary-digestion-service";
import {ConfigurationService} from "../configuration/configuration.service";
import {TopExcelOutputService} from "./excel/top-excel-output-service";
import {EmailSenderService} from "./email-sender/email-sender-service";
import {FacebookPostingService} from "./facebook-post/facebook-posting-service";
import {ExcelDebugOutputService} from "./excel-debug/excel-debug-output-service";
import {FirestoreDigestionService} from "./firebase/firestore-digestion.service";
import {FirebaseMessagingService} from "./firebase/firebase-messaging.service";
import {AiSummaryService} from "./ai-summary/ai-summary.service";

export class DigestingService {

  constructor(
    private readonly logging: LoggingService,
    private readonly weeklyMatchesSummaryDigestionService: WeeklyMatchesSummaryDigestionService,
    private readonly debugDigestionService: DebugDigestionService,
    private readonly configurationService: ConfigurationService,
    private readonly emailSenderService: EmailSenderService,
    private readonly excelOutput: TopExcelOutputService,
    private readonly excelDebugOutputService: ExcelDebugOutputService,
    private readonly facebookPostingService: FacebookPostingService,
    private readonly firestoreDigestionService: FirestoreDigestionService,
    private readonly firebaseMessagingService: FirebaseMessagingService,
    private readonly aiSummaryService: AiSummaryService,
  ) {
  }

  async digest(): Promise<void> {
    this.logging.info(this.logging.getLayerInfo('🖨 DIGESTING'));

    if (this.configurationService.runtimeConfiguration.weeklySummary) {
      await this.weeklyMatchesSummaryDigestionService.digest();
    }
    await this.excelOutput.digest();

    if (this.configurationService.runtimeConfiguration.sendViaEmail) {
      await this.emailSenderService.digest();
    }
    if (this.configurationService.runtimeConfiguration.postToFacebook) {
      await this.facebookPostingService.digest();
    }
    if (this.configurationService.runtimeConfiguration.uploadToFirebase) {
      if (this.aiSummaryService.isEnabled()) {
        this.logging.info('AI summaries enabled - will be included in Firestore digestion');
      } else {
        this.logging.info('AI summaries disabled - continuing without AI analysis');
      }
      await this.firestoreDigestionService.digest();
      await this.firebaseMessagingService.digest();
    }
    if (this.configurationService.runtimeConfiguration.writeFullDebug) {
      await this.excelDebugOutputService.digestTops();
      await this.debugDigestionService.digest();
    }
  }
}
