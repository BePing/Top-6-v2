import {Service} from "typedi";
import {DigestingServiceContract} from "../digesting-service-contract";
import {Table, Workbook, Worksheet} from "exceljs";
import {ConfigurationService} from "../../configuration/configuration.service";
import {ConsolidateTopService} from "../../processing/top/4-consolidate-tops/consolidate-top-service";
import {LoggingService} from "../../common";
import {TOP_REGIONS} from "../../configuration/configuration.model";

@Service()
export class TopExcelOutputService implements DigestingServiceContract {
  constructor(
    private readonly configurationService: ConfigurationService,
    private readonly loggingService: LoggingService,
    private readonly consolidateTopService: ConsolidateTopService,
    //private readonly playersPointsProcessingService: PlayersPointsProcessingService
  ) {
  }

  async digest(): Promise<void> {
    this.loggingService.info(`Writing excels...`);
    for (const region of this.configurationService.allRegions) {
      const workbook = new Workbook();
      workbook.title = region;
      this.digestTops(workbook, region);
      await workbook.xlsx.writeFile(this.configurationService.absolutePathConsolidatedTopExcelFileName(region));
      this.loggingService.trace(`xslx ${region} written...`);

    }
    //await this.digestDebugPoints();

  }

  digestTops(workbook: Workbook, region: TOP_REGIONS): void {
    for (const level of this.configurationService.allLevels) {
      const worksheet = workbook.addWorksheet('classement-' + level.replace('/', '').toLowerCase());
      const table = this.createEmptyTableInWorksheet(worksheet);
      const points = this.consolidateTopService.getTopForRegionAndLevel(region, level, this.configurationService.runtimeConfiguration.playersInTop);
      for (const [index, pos] of points.entries()) {
        table.addRow([
          index + 1,
          pos.name,
          pos.clubName,
          pos.points.total,
          pos.clubIndex,
          pos.uniqueIndex,
        ])
      }
      table.commit();
    }

  }


  createEmptyTableInWorksheet(workSheet: Worksheet): Table {
    return workSheet.addTable({
      name: workSheet.name,
      ref: 'A1',
      headerRow: true,
      totalsRow: true,
      style: {
        theme: 'TableStyleMedium20',
        showRowStripes: true,
      },
      columns: [
        {name: 'Place', filterButton: false},
        {name: 'Nom', filterButton: false},
        {name: 'Club', filterButton: false},
        {name: 'Points', filterButton: false},
        {name: 'Indice club', filterButton: false},
        {name: 'Indice joueur', filterButton: false},
      ],
      rows: [],
    });
  }
}
