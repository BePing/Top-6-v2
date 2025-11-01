import {DigestingServiceContract} from "../digesting-service-contract";
import {Workbook, Worksheet} from "exceljs";
import {ConfigurationService} from "../../configuration/configuration.service";
import {LoggingService} from "../../common";
import {PlayersPointsProcessingService} from "../../processing/top/1-players-points/players-points-processing-service";
import {PlayerPoints} from "../../processing/top/1-players-points/players-points-processing-model";
import {LevelAttributionService} from "../../processing/top/2-level-attribution/level-attribution-service";
import {TOP_REGIONS, topLevelOrder} from "../../configuration/configuration.model";
import {SumPointsService} from "../../processing/top/3-sum-points/sum-points-service";
import {ErrorProcessingService} from "../../processing/error-processing-service/error-processing-service";
import {TopExcelOutputService} from "../excel/top-excel-output-service";
import {PlayerTotalPoints} from "../../processing/top/3-sum-points/sum-points-model";

export class ExcelDebugOutputService implements DigestingServiceContract {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly loggingService: LoggingService,
    private readonly playersPointsProcessingService: PlayersPointsProcessingService,
    private readonly levelAttributionService: LevelAttributionService,
    private readonly sumPoints: SumPointsService,
    private readonly config: ConfigurationService,
    private readonly errorProcessingService: ErrorProcessingService,
    private readonly topExcelOutputService: TopExcelOutputService
  ) {
  }

  async digest(): Promise<void> {
    this.loggingService.info(`Writing debug excels...`);
    await this.digestTops();
    //await this.digestDebugPoints();

  }

  async digestTops() {
    for (const region of this.configurationService.allRegions) {
      const workbook = new Workbook();
      workbook.title = region;
      this.digestConfig(workbook, region);
      this.digestErrors(workbook);
      this.topExcelOutputService.digestTops(workbook, region);
      this.digestLevelAttribution(workbook);
      this.digestGroupedCountedPoints(workbook);
      this.digestCountedPoints(workbook);
      this.digestPointsPerWeek(workbook);

      await workbook.xlsx.writeFile(this.configurationService.absolutePathConsolidatedTopCompleteExcelFileName(region));
      this.loggingService.trace(`Complete xslx ${region} written...`);

    }
  }

  digestPointsPerWeek(workbook: Workbook) {
    const createEmptyTableInWorksheet = (workSheet: Worksheet, name: string) => {
      return workSheet.addTable({
        name,
        ref: 'A1',
        headerRow: true,
        totalsRow: false,
        style: {
          theme: 'TableStyleMedium20',
          showRowStripes: true,
        },
        columns: [
          {name: 'UniqueIndex', filterButton: true},
          {name: 'Nom', filterButton: true},
          {name: 'Catégorie', filterButton: true},
          {name: 'Victoires', filterButton: false},
          {name: 'Forfaits', filterButton: false},
          {name: 'Points', filterButton: false},
          {name: 'Feuille de match', filterButton: false},
        ],
        rows: [],
      });
    }

    for (let week = 1; week <= 22; week++) {
      const worksheet = workbook.addWorksheet("points-semaine-" + week);
      const table = createEmptyTableInWorksheet(worksheet, week.toString(10));
      const pointsModels = this.playersPointsProcessingService.model;
      for (const [uniqueIndex, playerPoints] of Object.entries(pointsModels) as [string, PlayerPoints][]) {
        const resultForWeek = playerPoints.points.find((p) => p.weekName === week);
        if (resultForWeek) {
          table.addRow([
            uniqueIndex,
            playerPoints.name,
            resultForWeek.level,
            resultForWeek.victoryCount,
            resultForWeek.forfeit,
            resultForWeek.pointsWon,
            'https://resultats.aftt.be/match/' + resultForWeek.matchUniqueId
          ]);
        }
      }
      table.commit();
    }
  }


  private digestLevelAttribution(workbook: Workbook) {
    const workSheet = workbook.addWorksheet("categories-joueurs");
    const table = workSheet.addTable({
      name: 'categories joueurs',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium20',
        showRowStripes: true,
      },
      columns: [
        {name: 'UniqueIndex', filterButton: true},
        {name: 'Semaine 1', filterButton: true},
        {name: 'Semaine 2', filterButton: true},
        {name: 'Semaine 3', filterButton: true},
        {name: 'Semaine 4', filterButton: true},
        {name: 'Semaine 5', filterButton: true},
        {name: 'Semaine 6', filterButton: true},
        {name: 'Semaine 7', filterButton: true},
        {name: 'Semaine 8', filterButton: true},
        {name: 'Semaine 9', filterButton: true},
        {name: 'Semaine 10', filterButton: true},
        {name: 'Semaine 11', filterButton: true},
        {name: 'Semaine 12', filterButton: true},
        {name: 'Semaine 13', filterButton: true},
        {name: 'Semaine 14', filterButton: true},
        {name: 'Semaine 15', filterButton: true},
        {name: 'Semaine 16', filterButton: true},
        {name: 'Semaine 17', filterButton: true},
        {name: 'Semaine 18', filterButton: true},
        {name: 'Semaine 19', filterButton: true},
        {name: 'Semaine 20', filterButton: true},
        {name: 'Semaine 21', filterButton: true},
        {name: 'Semaine 22', filterButton: true},
        {name: 'Categorie attribuée', filterButton: true},
      ],
      rows: [],
    });

    const pointsModels = this.playersPointsProcessingService.model;
    for (const [uniqueIndex, playerPoints] of Object.entries(pointsModels) as [string, PlayerPoints][]) {
      const levelForWeek = (week) => playerPoints.points.find((p) => p.weekName === week)?.level ?? 'N/A';
      table.addRow([
        uniqueIndex,
        levelForWeek(1),
        levelForWeek(2),
        levelForWeek(3),
        levelForWeek(4),
        levelForWeek(5),
        levelForWeek(6),
        levelForWeek(7),
        levelForWeek(8),
        levelForWeek(9),
        levelForWeek(10),
        levelForWeek(11),
        levelForWeek(12),
        levelForWeek(13),
        levelForWeek(14),
        levelForWeek(15),
        levelForWeek(16),
        levelForWeek(17),
        levelForWeek(18),
        levelForWeek(19),
        levelForWeek(20),
        levelForWeek(21),
        levelForWeek(22),
        this.levelAttributionService.model[uniqueIndex]
      ]);
      table.commit();
    }

  }

  private digestCountedPoints(workbook: Workbook) {
    const workSheet = workbook.addWorksheet("points-comptabilises");
    const table = workSheet.addTable({
      name: 'points-comptabilises',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium20',
        showRowStripes: true,
      },
      columns: [
        {name: 'UniqueIndex', filterButton: true},
        {name: 'Semaine 1', filterButton: true},
        {name: 'Semaine 2', filterButton: true},
        {name: 'Semaine 3', filterButton: true},
        {name: 'Semaine 4', filterButton: true},
        {name: 'Semaine 5', filterButton: true},
        {name: 'Semaine 6', filterButton: true},
        {name: 'Semaine 7', filterButton: true},
        {name: 'Semaine 8', filterButton: true},
        {name: 'Semaine 9', filterButton: true},
        {name: 'Semaine 10', filterButton: true},
        {name: 'Semaine 11', filterButton: true},
        {name: 'Semaine 12', filterButton: true},
        {name: 'Semaine 13', filterButton: true},
        {name: 'Semaine 14', filterButton: true},
        {name: 'Semaine 15', filterButton: true},
        {name: 'Semaine 16', filterButton: true},
        {name: 'Semaine 17', filterButton: true},
        {name: 'Semaine 18', filterButton: true},
        {name: 'Semaine 19', filterButton: true},
        {name: 'Semaine 20', filterButton: true},
        {name: 'Semaine 21', filterButton: true},
        {name: 'Semaine 22', filterButton: true},
        {name: 'Total', filterButton: true},
      ],
      rows: [],
    });

    const pointsModels = this.playersPointsProcessingService.model;
    for (const [uniqueIndex, playerPoints] of Object.entries(pointsModels) as [string, PlayerPoints][]) {
      const divisionAttributed = this.levelAttributionService.model[uniqueIndex]
      const pointsForWeek = (week) => {
        const resultOfWeek = playerPoints.points.find((p) => p.weekName === week);
        if (!resultOfWeek) {
          return 0;
        }
        return topLevelOrder.indexOf(resultOfWeek.level) <= topLevelOrder.indexOf(divisionAttributed) ? resultOfWeek.pointsWon : 0;
      }
      table.addRow([
        uniqueIndex,
        pointsForWeek(1),
        pointsForWeek(2),
        pointsForWeek(3),
        pointsForWeek(4),
        pointsForWeek(5),
        pointsForWeek(6),
        pointsForWeek(7),
        pointsForWeek(8),
        pointsForWeek(9),
        pointsForWeek(10),
        pointsForWeek(11),
        pointsForWeek(12),
        pointsForWeek(13),
        pointsForWeek(14),
        pointsForWeek(15),
        pointsForWeek(16),
        pointsForWeek(17),
        pointsForWeek(18),
        pointsForWeek(19),
        pointsForWeek(20),
        pointsForWeek(21),
        pointsForWeek(22),
        0
        //this.sumPoints.getPlayerPoints(uniqueIndex, 22).total
      ]);
      table.commit();
    }
  }

  private digestConfig(workbook: Workbook, region: TOP_REGIONS) {
    const workSheet = workbook.addWorksheet("Configuration");
    workSheet.columns = [
      {
        header: 'Key',
        key: 'key',
        font: {bold: true},
      },
      {
        header: 'Value',
        key: 'value'
      }
    ];
    workSheet.addRow(['Date exécution', this.config.dateStart.toISOString()]);
    workSheet.addRow(['Top', workbook.title]);
    workSheet.addRow(['Semaine', this.config.runtimeConfiguration.weekName]);
    workSheet.addRow(['Clubs', this.config.getAllClubsForRegion(region).join(', ')]);
    workSheet.addRow(['DivisionsIds', this.config.allDivisions.join(', ')]);

  }

  private digestErrors(workbook: Workbook) {
    const workSheet = workbook.addWorksheet("erreurs");
    for (const error of this.errorProcessingService.allErrorsAndWarning) {
      workSheet.addRow([error]);
    }
  }

  private digestGroupedCountedPoints(workbook: Workbook) {
    const workSheet = workbook.addWorksheet("points-comptabilises-groupe");
    const table = workSheet.addTable({
      name: 'points-comptabilises-groupé',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleMedium20',
        showRowStripes: true,
      },
      columns: [
        {name: 'UniqueIndex', filterButton: true},
        {name: '0 point', filterButton: true},
        {name: '1 point', filterButton: true},
        {name: '2 points', filterButton: true},
        {name: '3 points', filterButton: true},
        {name: '5 points', filterButton: true},
        {name: 'Total', filterButton: true},
      ],
      rows: [],
    });

    const pointsModels = this.sumPoints.model[this.configurationService.runtimeConfiguration.weekName];
    for (const [uniqueIndex, playerPoints] of Object.entries(pointsModels) as [string, PlayerTotalPoints][]) {

      table.addRow([
        uniqueIndex,
        playerPoints.count0Pts,
        playerPoints.count1Pts,
        playerPoints.count2Pts,
        playerPoints.count3Pts,
        playerPoints.count5Pts,
        playerPoints.total,
      ]);
      table.commit();
    }
  }
}
