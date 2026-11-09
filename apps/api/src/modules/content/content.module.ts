import { Module } from '@nestjs/common';
import {
  AdminContentController,
  ContentController,
  FaqController,
} from './content.controller';

@Module({
  controllers: [FaqController, ContentController, AdminContentController],
})
export class ContentModule {}
