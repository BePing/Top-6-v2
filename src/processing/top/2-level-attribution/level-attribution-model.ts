import {TOP_LEVEL} from "../../../configuration/configuration.model";
import {PerUniqueIndex, PerWeekName} from '../top-processing-model';

export type PlayersLevelAttribution = PerWeekName<PerUniqueIndex<TOP_LEVEL>>
