import { DEFAULT_LOG_LEVEL, ILogService, LogLevel } from '../common/log';
import { Disposable } from '@neditor/core/base/common/lifecycle';
import { Emitter, Event } from '@neditor/core/base/common/event';

export abstract class AbstractLogService extends Disposable {
  private level: LogLevel = DEFAULT_LOG_LEVEL;
  private readonly _onDidChangeLogLevel: Emitter<LogLevel> = this._register(
    new Emitter<LogLevel>(),
  );

  readonly onDidChangeLogLevel: Event<LogLevel> = this._onDidChangeLogLevel.event;

  setLevel(level: LogLevel): void {
    if (this.level !== level) {
      this.level = level;
      this._onDidChangeLogLevel.fire(this.level);
    }
  }

  getLevel(): LogLevel {
    return this.level;
  }
}

export class ConsoleLogService extends AbstractLogService implements ILogService {
  declare readonly _serviceBrand: undefined;

  constructor(logLevel: LogLevel = DEFAULT_LOG_LEVEL) {
    super();
    this.setLevel(logLevel);
  }

  trace(message: string, ...args: any[]): void {
    if (this.getLevel() <= LogLevel.Trace) {
      console.log('%cTRACE', 'color: #888', message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.getLevel() <= LogLevel.Debug) {
      console.log('%cDEBUG', 'background: #eee; color: #888', message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.getLevel() <= LogLevel.Info) {
      console.log('%c INFO', 'color: #33f', message, ...args);
    }
  }

  warn(message: string | Error, ...args: any[]): void {
    if (this.getLevel() <= LogLevel.Warning) {
      console.log('%c WARN', 'color: #993', message, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.getLevel() <= LogLevel.Error) {
      console.log('%c  ERR', 'color: #f33', message, ...args);
    }
  }

  critical(message: string, ...args: any[]): void {
    if (this.getLevel() <= LogLevel.Critical) {
      console.log('%cCRITI', 'background: #f33; color: white', message, ...args);
    }
  }

  dispose(): void {
    // noop
  }

  flush(): void {
    // noop
  }
}
