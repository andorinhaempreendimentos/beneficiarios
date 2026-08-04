import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Sexo } from '../beneficiario.entity';

export class CreateBeneficiarioDto {
  @IsString()
  @MaxLength(20)
  matricula: string;

  @IsString()
  @MaxLength(300)
  nomeCompleto: string;

  @IsString()
  dataNascimento: string;

  @IsOptional()
  @IsEnum(Sexo)
  sexo?: Sexo;

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
  @IsString()
  endereco?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  municipio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  uf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  nomeResponsavel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  celularResponsavel?: string;

  @IsOptional()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, { message: 'CPF do responsável inválido' })
  cpfResponsavel?: string;
}
