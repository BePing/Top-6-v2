import {createMock} from "ts-auto-mock";
import {LoggingService} from "../../../common";
import {PlayersPointsProcessingService} from "../1-players-points/players-points-processing-service";
import {PlayerPoints} from "../1-players-points/players-points-processing-model";
import {TOP_LEVEL} from "../../../configuration/configuration.model";
import {LevelAttributionService} from "../2-level-attribution/level-attribution-service";
import {SumPointsService} from "./sum-points-service";
import {ConfigurationService} from '../../../configuration/configuration.service';
import {PlayersLevelAttribution} from '../2-level-attribution/level-attribution-model';

describe('SumPointsService', () => {
  describe('process', () => {
    it('should count points for the attributed level', async () => {
      const loggerMock = createMock<LoggingService>();
      const playersPointsProcessingServiceMock = createMock<PlayersPointsProcessingService>({
        getPlayerResultsUntilWeekName(_, weekname: number): PlayerPoints {
          return {
            name: 'Florent',
            club: 'Club A',
            points: [
              {
                divisionId: 12,
                weekName: 1,
                level: TOP_LEVEL.P1,
                victoryCount: 1,
                forfeit: 1,
                pointsWon: 2,
                matchId: '123',
                matchUniqueId: 1234,
              },
              {
                divisionId: 12,
                weekName: 2,
                level: TOP_LEVEL.P2,
                victoryCount: 1,
                forfeit: 0,
                pointsWon: 1,
                matchId: '123',
                matchUniqueId: 1234,
              },
              {
                divisionId: 12,
                weekName: 3,
                level: TOP_LEVEL.P2,
                victoryCount: 3,
                forfeit: 0,
                pointsWon: 3,
                matchId: '123',
                matchUniqueId: 1234,
              },
              {
                divisionId: 12,
                weekName: 4,
                level: TOP_LEVEL.P2,
                victoryCount: 4,
                forfeit: 0,
                pointsWon: 5,
                matchId: '123',
                matchUniqueId: 1234,
              },

            ].slice(0, weekname),
          }
        },
      });
      const levelAttributionMock = createMock<LevelAttributionService>({
        get model(): PlayersLevelAttribution {
          return {
            1: {
              142453: TOP_LEVEL.P1,
            },
            2: {
              142453: TOP_LEVEL.P2,
            },
            3: {
              142453: TOP_LEVEL.P2,
            },
            4: {
              142453: TOP_LEVEL.P2,
            },
          }
        },
        getLevelForUniqueIndex: () => {
          return TOP_LEVEL.P2;
        },
      });
      const configMock = createMock<ConfigurationService>({
        runtimeConfiguration: {
          weekName: 4,
        },
      })
      const service = new SumPointsService(loggerMock, playersPointsProcessingServiceMock, levelAttributionMock, configMock);
      await service.process();
      const result = service.model;

      expect(result[4]).toStrictEqual({
        142453: {
          total: 11,
          count1Pts: 1,
          count2Pts: 1,
          count3Pts: 1,
          count5Pts: 1,
          count0Pts: 0,
        },
      })
      expect(result[1][142453]).toEqual(service.getPlayerPoints("142453", 1))
    })
  })
})
