import { Module } from '@nestjs/common';
import { CollectionController, ProgressController } from './collection.controller';
import { CollectionService } from './collection.service';

@Module({
  controllers: [CollectionController, ProgressController],
  providers: [CollectionService],
  exports: [CollectionService],
})
export class CollectionModule {}
