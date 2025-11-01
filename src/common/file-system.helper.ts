import {LoggingService} from "./logging-service";
import * as fs from 'fs';
import * as path from 'path';

export class FileSystemHelper {

  constructor(private readonly _loggingService: LoggingService) {
  }

  createFolderIfNotExist(fullPath: string): boolean {
    if (!fs.existsSync(fullPath)) {
      this._loggingService.trace(`- Creating folder '${fullPath}' ...`);
      fs.mkdirSync(fullPath);
      return true;
    }
    return false;
  }

  writeToFile(data: string, stringify: boolean, fileName: string, relativeOutFolderPath: string): void {
    const fullPath = path.join(__dirname, `${relativeOutFolderPath}/${fileName}`);
    this._loggingService.trace(`Write to file '${fullPath}' ...`);
    fs.writeFileSync(fullPath, stringify ? JSON.stringify(data, null, 2) : data);
  }

  writeToFileA(data: string, stringify: false, absoluteFolderPathName: string): void;
  writeToFileA(data: object, stringify: true, absoluteFolderPathName: string): void;
  writeToFileA(data: string | object, stringify: boolean, absoluteFolderPathName: string): void {
    this._loggingService.trace(`Write to file '${absoluteFolderPathName}' ...`);
    fs.writeFileSync(absoluteFolderPathName, stringify ? JSON.stringify(data, null, 2) : data as string);
  }
}
