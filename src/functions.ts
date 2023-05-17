import 'reflect-metadata';

import randomIP from 'random-ipv4';

import {Container} from "typedi";
import {IngestionService} from "./ingestion/ingestion-service";
import {ConfigurationService} from "./configuration/configuration.service";
import {ProcessingService} from "./processing/processing-service";
import {DigestingService} from "./digestion/digesting-service";
import {ClubsApi, DivisionsApi, MatchesApi} from "./common";
import {TabtClientConfigFactory} from "./common/tabt-client-config-factory";
import axios, {AxiosInstance} from "axios";
import axiosRetry from "axios-retry";
import {RuntimeConfigurationService} from './configuration/runtime-configuration.service';
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
    await Container.get(RuntimeConfigurationService).init();
    await Container.get(ConfigurationService).init();

    Container.set([
      {
        id: 'clubs.api',
        factory: () => new ClubsApi(TabtClientConfigFactory.createConfiguration(), null, createAxiosInstance()),
      },
      {
        id: 'matches.api',
        factory: () => new MatchesApi(TabtClientConfigFactory.createConfiguration(), null, createAxiosInstance()),
      },
      {
        id: 'divisions.api',
        factory: () => new DivisionsApi(TabtClientConfigFactory.createConfiguration(), null, createAxiosInstance()),
      },
      {id: 'firebase.admin', factory: () => admin.initializeApp()},
      {id: 'randomip', value: randomIP},
    ]);

    await Container.get(IngestionService).ingest();
    await Container.get(ProcessingService).process();
    await Container.get(DigestingService).digest();
  });




