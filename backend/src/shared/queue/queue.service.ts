import { Injectable, Logger } from '@nestjs/common';
@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  async addBroadcastJob(data: any) { this.logger.log(`Broadcast job: ${data.broadcastId}`); return { id: Date.now().toString() }; }
  async addPaymentJob(data: any) { return { id: Date.now().toString() }; }
  async addAiJob(data: any) { return { id: Date.now().toString() }; }
  async addTelegramJob(data: any) { return { id: Date.now().toString() }; }
  async getQueueStats() { return { waiting: 0, active: 0, completed: 0, failed: 0 }; }
}
