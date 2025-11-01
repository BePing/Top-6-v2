import randomIP from 'random-ipv4';

import { container } from "./common/di-container";
import { ServiceFactory } from "./common/service-factory";
import axios, {AxiosInstance} from "axios";
import axiosRetry from "axios-retry";
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';

function createAxiosInstance() {
  const axiosInstance: AxiosInstance = axios.create();
  axiosRetry(axiosInstance, {
    retries: 3,
    retryCondition: () => true,
    retryDelay: (retryCount) => retryCount * 5_000,
  });
  return axiosInstance;
}


//export const runtop = functions.pubsub.schedule('*/2 * * * *').onRun( async () => {
export const computeTop = functions
  .runWith({
    timeoutSeconds: 540,
    maxInstances: 1,
  })
  .https
  .onRequest(async () => {
    // Set up the container with basic services
    container.set('randomip', randomIP);
    container.set('axios', createAxiosInstance());
    container.set('firebase.admin', () => admin.initializeApp());

    // Create and register the configuration service
    const configService = ServiceFactory.createConfigurationService();
    container.set('ConfigurationService', configService);
    await configService.init();

    // Set up API services
    container.setMany([
      {
        id: 'clubs.api',
        factory: () => ServiceFactory.createClubsApi(),
      },
      {
        id: 'matches.api',
        factory: () => ServiceFactory.createMatchesApi(),
      },
      {
        id: 'divisions.api',
        factory: () => ServiceFactory.createDivisionsApi(),
      }
    ]);

    // Create and run the main services
    const ingestionService = ServiceFactory.createIngestionService();
    const processingService = ServiceFactory.createProcessingService();
    const digestingService = ServiceFactory.createDigestingService();

    await ingestionService.ingest();
    await processingService.process();
    await digestingService.digest();
  });




