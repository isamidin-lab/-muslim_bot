export class PageMetaDto {
  page: number; limit: number; total: number; totalPages: number;
  constructor(page: number, limit: number, total: number) {
    this.page = page; this.limit = limit; this.total = total; this.totalPages = Math.ceil(total / limit);
  }
}
export class PageDto<T> {
  data: T[]; meta: PageMetaDto;
  constructor(data: T[], meta: PageMetaDto) { this.data = data; this.meta = meta; }
}
export class PaginationQuery { page?: number = 1; limit?: number = 10; search?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' = 'desc'; get skip() { return ((this.page || 1) - 1) * (this.limit || 10); } get take() { return this.limit || 10; } }
