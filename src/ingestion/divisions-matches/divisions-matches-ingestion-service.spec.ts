import { LoggingService, MatchesApi } from "../../common";

import { createMock } from "ts-auto-mock";
import { method, On } from "ts-auto-mock/extension";
import { ConfigurationService } from "../../configuration/configuration.service";
import { DivisionsMatchesIngestionService } from "./divisions-matches-ingestion-service";


describe('DivisionsMatchesIngestionService', () => {
  describe('ingest', () => {
    it('should ingest all divisions from config', async () => {
      const configMock = createMock<ConfigurationService>({
        get allDivisions(): number[] {
          return [11, 22, 33]
        },
        get runtimeConfiguration() {
          return { weekName: 2 }
        }
      })

      const matchesApiMock = createMock<MatchesApi>();
      const findAllMatchesMock = On(matchesApiMock).get(method(m => m.findAllMatches)) as jest.Mock;
      findAllMatchesMock
        .mockResolvedValueOnce({
          data: [{
            "MatchId": "12345",
            "WeekName": "01",
            "MatchUniqueId": 1,
            "DivisionId": 11,
            "DivisionCategory": 1,
          }]
        })
        .mockResolvedValueOnce({
          data: [{
            "MatchId": "123456",
            "WeekName": "02",
            "MatchUniqueId": 476973,
            "DivisionId": 22,
            "DivisionCategory": 1,
          }]
        })
        .mockResolvedValueOnce({
          data: [{
            "MatchId": "123456",
            "WeekName": "05",
            "MatchUniqueId": 476973,
            "DivisionId": 22,
            "DivisionCategory": 1,
          }]
        })
      const loggerMock = createMock<LoggingService>();
      const divisionsIngestionService = new DivisionsMatchesIngestionService(
        configMock,
        loggerMock,
        matchesApiMock
      )

      await divisionsIngestionService.ingest();
      expect(divisionsIngestionService).toBeDefined();
      expect(findAllMatchesMock).toHaveBeenCalledTimes(3);
      expect(findAllMatchesMock).toHaveBeenNthCalledWith(1, { "divisionId": 11, "withDetails": true });
      expect(findAllMatchesMock).toHaveBeenNthCalledWith(2, { "divisionId": 22, "withDetails": true });
      expect(findAllMatchesMock).toHaveBeenNthCalledWith(3, { "divisionId": 33, "withDetails": true });
      expect(divisionsIngestionService.model.matches.length).toEqual(3);

    })
    it('should not crash is no results returned for a division', async () => {
      const configMock = createMock<ConfigurationService>({
        get allDivisions(): number[] {
          return [11]
        },
        get runtimeConfiguration() {
          return { weekName: 2 }
        }
      })

      const matchesApiMock = createMock<MatchesApi>();
      const findAllMatchesMock = On(matchesApiMock).get(method(m => m.findAllMatches)) as jest.Mock;
      findAllMatchesMock
        .mockResolvedValueOnce({
          data: []
        });
      const loggerMock = createMock<LoggingService>();
      const divisionsIngestionService = new DivisionsMatchesIngestionService(
        configMock,
        loggerMock,
        matchesApiMock
      )

      await divisionsIngestionService.ingest();
      expect(divisionsIngestionService).toBeDefined();
      expect(findAllMatchesMock).toHaveBeenCalledTimes(1);
      expect(divisionsIngestionService.model.matches.length).toEqual(0);

    })
  });
})
