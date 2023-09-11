import {PlayerTotalPoints} from "../3-sum-points/sum-points-model";
import {PerLevelName, PerRegionName, PerWeekName} from '../top-processing-model';


export type ConsolidateTopModel = PerWeekName<PerRegionName<PerLevelName<PlayerPosition[]>>>;

export interface PlayerPosition {
  uniqueIndex: string;
  clubIndex: string;
  clubName: string;
  name: string;
  points: PlayerTotalPoints;

}
