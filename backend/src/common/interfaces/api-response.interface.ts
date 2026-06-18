export interface IApiResponse<T = any> { success: boolean; data?: T; message?: string; meta?: any; timestamp: string; }
