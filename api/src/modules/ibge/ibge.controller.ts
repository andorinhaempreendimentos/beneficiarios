import { Controller, Get, Param } from '@nestjs/common';
import { IbgeService } from './ibge.service';
import { Public } from '../../common/decorators/public.decorator';

@Controller('api/v1/ibge')
export class IbgeController {
  constructor(private readonly service: IbgeService) {}

  @Get('ufs')
  @Public()
  ufs() {
    return this.service.ufs();
  }

  @Get('ufs/:uf/municipios')
  @Public()
  municipios(@Param('uf') uf: string) {
    return this.service.municipios(uf);
  }
}
