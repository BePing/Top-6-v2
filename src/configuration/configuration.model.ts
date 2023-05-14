import {ServiceAccount} from "firebase-admin";

export interface FacebookPage {
  page_id: string;
  access_token: string;
}

export interface Configuration {
  beping_url: string;
  top6: Top6;
  email: Mailing;
  facebook?: FacebookPage;
  output: string;
  firebase?: ServiceAccount
}

export type RegionsDefinition = {
  [index in TOP_REGIONS]: string[]
}

export enum TOP_REGIONS {
  HUY_WAREMME = 'HUY_WAREMME',
  LIEGE = 'LIEGE',
  VERVIERS = 'VERVIERS'
}

export enum TOP_LEVEL {
  NAT_WB = "NAT_WB",
  P1 = "Provincial 1",
  P2 = "Provincial 2",
  P3 = "Provincial 3",
  P4 = "Provincial 4",
  P5 = "Provincial 5",
  P6 = "Provincial 6",
}

export const topLevelOrder = Object.values(TOP_LEVEL);

export type LevelsDefinition = {
  [x in TOP_LEVEL]: number[];
}

export interface PlayerPointsOverrides {
  [key: string]: PointsOverrides[]
}

export interface PointsOverrides {
  weekName: number;
  victoryCount?: number;
  forfeit?: number;
}

export interface Top6 {
  regions_definition: RegionsDefinition;
  levels_definition: LevelsDefinition;
  points_overrides: PlayerPointsOverrides;
  excluded_players: number[];
}

export interface Mailing {
  recipients: string[];
  error_recipients: string[];
  subject: string;
  text: string;
}


