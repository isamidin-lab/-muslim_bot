import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  constructor(private prisma: PrismaService, private config: ConfigService) {}
  private get apiKey() { return this.config.get<string>('OPENAI_API_KEY'); }
  private get model() { return this.config.get<string>('OPENAI_MODEL', 'gpt-4o'); }

  async chat(userId: string, tenantId: string, messages: { role: string; content: string }[]) {
    if (!this.apiKey) throw new BadRequestException('AI not configured');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages: [{ role: 'system', content: 'You are an Islamic education AI assistant. Help with Arabic language, Quran, and Islamic studies.' }, ...messages], max_tokens: 2000 }),
    });
    const data = await res.json();
    if (data.error) throw new BadRequestException(data.error.message);
    const reply = data.choices[0]?.message?.content;
    const tokens = data.usage?.total_tokens || 0;
    await this.prisma.aiChat.create({ data: { userId, messages: JSON.stringify([...messages, { role: 'assistant', content: reply }]), model: this.model, tokens, cost: tokens * 0.00001 } });
    await this.prisma.aiUsageLog.create({ data: { tenantId, action: 'chat', model: this.model, tokens, cost: tokens * 0.00001 } });
    return { reply, tokens };
  }

  async generateQuiz(tenantId: string, topic: string, difficulty: string, count = 5) {
    if (!this.apiKey) throw new BadRequestException('AI not configured');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages: [{ role: 'user', content: `Generate ${count} MCQ about "${topic}" (${difficulty}). Return JSON: [{question, options, correctIndex}]` }], response_format: { type: 'json_object' } }),
    });
    const data = await res.json();
    return JSON.parse(data.choices[0]?.message?.content || '[]');
  }

  async translateToArabic(text: string, tenantId: string) {
    if (!this.apiKey) throw new BadRequestException('AI not configured');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, messages: [{ role: 'user', content: `Translate to Arabic: "${text}"` }] }),
    });
    const data = await res.json();
    return { translation: data.choices[0]?.message?.content };
  }

  async getUsageStats(tenantId: string) {
    const stats = await this.prisma.aiUsageLog.aggregate({ where: { tenantId }, _sum: { tokens: true, cost: true }, _count: true });
    return { totalTokens: stats._sum.tokens || 0, totalCost: stats._sum.cost || 0, totalRequests: stats._count };
  }
}
