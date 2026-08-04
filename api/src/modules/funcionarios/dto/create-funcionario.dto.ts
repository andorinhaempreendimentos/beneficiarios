import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { CargoFuncionario } from '../funcionario.entity';

export class CreateFuncionarioDto {
  @IsString()
  @MaxLength(20)
  matricula: string;

  @IsString()
  @MaxLength(300)
  nomeCompleto: string;

  @IsOptional()
  @IsString()
  dataNascimento?: string;

  @IsOptional()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF inválido' })
  cpf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  celular?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @IsOptional()
  @IsEnum(CargoFuncionario)
  cargo?: CargoFuncionario;
}
