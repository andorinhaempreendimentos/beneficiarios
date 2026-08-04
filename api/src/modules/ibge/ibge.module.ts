import { Module } from '@nestjs/common';
import { IbgeController } from './ibge.controller';
import { IbgeService } from './ibge.service';

@Module({
  controllers: [IbgeController],
  providers: [IbgeService],
  exports: [IbgeService],
})
export class IbgeModule {}
