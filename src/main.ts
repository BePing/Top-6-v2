import 'reflect-metadata';

import * as dotenv from 'dotenv';
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
import {GoogleCredentialsLoaderService} from './configuration/google-credentials-loader.service';
import admin from 'firebase-admin';

dotenv.config();

function createAxiosInstance() {
  const axiosInstance: AxiosInstance = axios.create();
  axiosRetry(axiosInstance, {
    retries: 3,
    retryCondition: () => true,
    retryDelay: (retryCount) => retryCount * 5_000,
  });
  return axiosInstance;
}

const run = async () => {
  await Container.get(RuntimeConfigurationService).init();

  const googleCredentialsLoader: GoogleCredentialsLoaderService = await Container.get(GoogleCredentialsLoaderService);
  await googleCredentialsLoader.init();

  Container.set([
    {id: 'clubs.api', factory: () => new ClubsApi(TabtClientConfigFactory.createConfiguration(), null, createAxiosInstance())},
    {id: 'matches.api', factory: () => new MatchesApi(TabtClientConfigFactory.createConfiguration(), null, createAxiosInstance())},
    {id: 'divisions.api', factory: () => new DivisionsApi(TabtClientConfigFactory.createConfiguration(), null, createAxiosInstance())},
    {id: 'firebase.admin', factory: () => admin.initializeApp({credential: admin.credential.cert(googleCredentialsLoader.googleCredentials)})},
    {id: 'randomip', value: randomIP},
  ]);

  await Container.get(ConfigurationService).init();
  await Container.get(IngestionService).ingest();
  await Container.get(ProcessingService).process();
  await Container.get(DigestingService).digest();
}
run();



