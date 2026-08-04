import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('sistema')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Health check — usado pela Hostinger para verificar se o processo está
   * respondendo e pelo monitoramento externo.
   */
  @Get('health')
  @ApiOperation({ summary: 'Verifica status da API e da conexão com o banco' })
  health() {
    return this.appService.health();
  }
}
