import { Module } from '@nestjs/common';
import { GithubApiService } from './github-api.service';
import { GithubController } from './github.controller';
import { GithubProfileService } from './github-profile.service';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [AchievementsModule],
  controllers: [GithubController],
  providers: [GithubApiService, GithubProfileService],
  exports: [GithubApiService, GithubProfileService],
})
export class GithubModule {}
