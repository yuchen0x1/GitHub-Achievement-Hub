import { Module } from '@nestjs/common';
import { AdminOpsController, FeedbackController } from './admin.controller';

@Module({
  controllers: [FeedbackController, AdminOpsController],
})
export class AdminModule {}
