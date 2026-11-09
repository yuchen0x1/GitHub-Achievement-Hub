import { Module } from '@nestjs/common';
import { AchievementsController } from './achievements.controller';
import { AdminAchievementsController } from './admin-achievements.controller';
import { AchievementsService } from './achievements.service';

@Module({
  controllers: [AchievementsController, AdminAchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
