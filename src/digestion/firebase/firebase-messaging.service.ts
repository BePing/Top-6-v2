import {LoggingService} from "../../common";
import {ConfigurationService} from "../../configuration/configuration.service";
import {DigestingServiceContract} from "../digesting-service-contract";
import {app} from 'firebase-admin';

export class FirebaseMessagingService implements DigestingServiceContract {

  constructor(
    private readonly firebaseService: app.App,
    private readonly configuration: ConfigurationService,
    private readonly loggingService: LoggingService,
  ) {
  }


  async digest(): Promise<void> {
    this.loggingService.info('Sending push notifications...');
    const message = await this.firebaseService.messaging().send({
      topic: 'all',
      notification: {
        body: 'Semaine n°' + this.configuration.runtimeConfiguration.weekName,
        title: 'Top 6 mis à jour!',
      },
    });
    this.loggingService.trace('Sent - ' + message);

  }

}
