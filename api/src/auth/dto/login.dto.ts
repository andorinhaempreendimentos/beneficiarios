import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginEmailDto {
  @ApiProperty({ example: 'admin@andorinha.org' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senhaSegura123' })
  @IsString()
  @MinLength(6)
  senha: string;
}

export class LoginBeneficiarioDto {
  @ApiProperty({ example: 'BEN-0001' })
  @IsString()
  matricula: string;

  @ApiProperty({ example: '2005-03-15', description: 'Formato YYYY-MM-DD' })
  @IsString()
  dataNascimento: string;

  @ApiProperty({ example: '11999998888' })
  @IsString()
  celular: string;
}
