import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ramirez.facundo1993@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'facundo1993' })
  @IsString()
  @MinLength(6)
  password: string;
}