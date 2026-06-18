import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Injectable()
export class EventBusService {
  constructor(private emitter: EventEmitter2) {}
  async emit(event: string, payload: any) { this.emitter.emit(event, payload); }
  on(event: string, handler: (p: any) => void) { this.emitter.on(event, handler); }
}
