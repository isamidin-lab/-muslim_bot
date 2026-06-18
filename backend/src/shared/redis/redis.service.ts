import { Injectable } from '@nestjs/common';
@Injectable()
export class RedisService {
  private store = new Map<string, { value: string; expiry?: number }>();
  async get(key: string) { const e = this.store.get(key); if (!e) return null; if (e.expiry && Date.now() > e.expiry) { this.store.delete(key); return null; } return e.value; }
  async set(key: string, value: string, ttl?: number) { this.store.set(key, { value, expiry: ttl ? Date.now() + ttl * 1000 : undefined }); }
  async del(key: string) { this.store.delete(key); }
  async delPattern(pattern: string) { const r = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$'); for (const k of this.store.keys()) { if (r.test(k)) this.store.delete(k); } }
}
