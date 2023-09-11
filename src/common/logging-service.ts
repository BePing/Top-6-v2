import chalk from 'chalk';
import {Service} from 'typedi';
import {Logger, pino} from 'pino'
import path from "path";
import {formatISO9075} from "date-fns";
import fs from "fs";

enum LogLevel {
  TRACE,
  DEBUG,
  INFO,
  WARN,
  ERROR
}

@Service()
export class LoggingService {

  private logger: Logger;
  private logPath = path.join(process.cwd(), 'logs');

  constructor() {
    if (!fs.existsSync(this.logPath)) {
      fs.mkdirSync(this.logPath);
    }
    this.logger = pino({
      level: 'trace',
      transport: {
        targets: [
          {
            level: 'trace',
            target: 'pino-pretty',
            options: {
              destination: 1,
              ignore: 'pid,hostname,time',
            }
          },
          {
            level: 'trace',
            target: 'pino/file',
            options: {destination: path.join(process.cwd(), 'logs', formatISO9075(Date.now(), {format: 'basic'}) + '.log')} // On enregistre les logs dans un fichier main.log
          }
        ]
      }
    });
  }

  trace(msg: string, ...args: object[]): void {
    this.log(LogLevel.TRACE, msg, args);
  }

  debug(msg: string, ...args: object[]): void {
    this.log(LogLevel.DEBUG, msg, args);
  }

  info(msg: string, ...args: object[]): void {
    this.log(LogLevel.INFO, msg, args);
  }

  warn(msg: string, ...args: object[]): void {
    this.log(LogLevel.WARN, msg, args);
  }

  error(msg: string, ...args: object[]): void {
    this.log(LogLevel.ERROR, msg, args);
  }

  private log(loglevel: LogLevel, msg: string, ...args: object[]) {
    const indentedMessage = msg //this.getIndentedMessage(msg, indentation);
    switch (loglevel) {
      case LogLevel.TRACE:
        this.logger.trace(chalk.grey(indentedMessage, args));
        break;
      case LogLevel.DEBUG:
        this.logger.debug(chalk.whiteBright(indentedMessage, args));
        break;
      case LogLevel.INFO:
        this.logger.info(chalk.blueBright(indentedMessage, args));
        break;
      case LogLevel.WARN:
        this.logger.warn(chalk.yellowBright(indentedMessage, args));
        break;
      case LogLevel.ERROR:
      default:
        this.logger.error(chalk.redBright(indentedMessage, args));
        break;
    }
  }

  getSeparatorLine(char = '-', count = 50): string {
    return char.repeat(count);
  }

  getLayerInfo(layerName: string): string {
    const line = this.getSeparatorLine('=');
    return `\n${line}\n${layerName}\n${line}`;
  }

}
