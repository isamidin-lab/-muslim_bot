import { Injectable } from '@nestjs/common';
@Injectable()
export class S3Service {
  async uploadFile(file: Express.Multer.File, folder = 'uploads') { return { url: `/${folder}/${Date.now()}-${file.originalname}`, key: `${folder}/${Date.now()}-${file.originalname}` }; }
  async deleteFile(key: string) {}
  getFileUrl(key: string) { return `/${key}`; }
}
