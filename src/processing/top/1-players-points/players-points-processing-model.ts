import {TOP_LEVEL} from "../../../configuration/configuration.model";

export interface PlayersPointsProcessingModel {
  [x: string]: PlayerPoints
}

export interface PlayerPoint {
  divisionId: number
  weekName: number,
  level: TOP_LEVEL
  victoryCount: number,
  forfeit: number,
  pointsWon: number,
  matchId: string,
  matchUniqueId: number,
}

export interface PlayerPoints {
  name: string;
  club: string;
  points: PlayerPoint[];
}
