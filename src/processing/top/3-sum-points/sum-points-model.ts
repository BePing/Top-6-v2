import {PerWeekName} from '../top-processing-model';

export type PlayersTotalPoints = PerWeekName<{
    [x: number]: PlayerTotalPoints;
}>;

export interface PlayerTotalPoints {
  total: number;
  count5Pts: number
  count3Pts: number
  count2Pts: number
  count1Pts: number
  count0Pts: number
}
