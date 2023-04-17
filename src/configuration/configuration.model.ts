import {ServiceAccount} from "firebase-admin";

export interface Configuration {
  tabtBaseApi: string;
  top6: Top6;
  email: Email;
  facebook?: {
    pageId: string,
    apiKey: string
  };
  output: string;
  firebase?: ServiceAccount
}

export type ClubsPerTop = {
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

export type DivisionsPerCategory = {
  [x in TOP_LEVEL]: number[];
}

export interface PlayerPointsOverrides {
  [key: number]: PointsOverrides[]
}

export interface PointsOverrides {
  weekName: number;
  victoryCount?: number;
  forfeit?: number;
}

export interface Top6 {
  clubsPerTop: ClubsPerTop;
  divisionsByLevel: DivisionsPerCategory;
  pointsOverrides: PlayerPointsOverrides
}

export interface Email {
  recipients: string[];
  errorRecipients: string[];
  subject: string;
  text: string;
}


