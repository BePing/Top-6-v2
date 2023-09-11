import {TOP_LEVEL, TOP_REGIONS} from '../../configuration/configuration.model';

export type PerWeekName<T> = {
  [weekName: number]: T
}

export type PerLevelName<T> = {
  [index in TOP_LEVEL]?: T;
}

export type PerRegionName<T> = {
  [index in TOP_REGIONS]?: T;
}

export type PerUniqueIndex<T> = {
  [uniqueIndex: string]: T;
}
