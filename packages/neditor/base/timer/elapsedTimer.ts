export class ElapsedTimer {
  private startTime = 0
  constructor() {
  }
  start() {
    this.startTime = Date.now()
  }
  elapsed() {
    return Date.now() - this.startTime
  }
  restart() {
    this.startTime = Date.now()
  }
}
