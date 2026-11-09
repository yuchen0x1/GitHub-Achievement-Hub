import { Global, Module } from '@nestjs/common';
import { DatabaseConfig } from '../config/database.config';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [DatabaseConfig, PrismaService],
  exports: [PrismaService, DatabaseConfig],
})
export class PrismaModule {}
