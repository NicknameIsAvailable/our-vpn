import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserDto {
  @IsEmail()
  @IsOptional()
  email: string;

  @MinLength(6, {
    message: 'Nickname must be at least 6 characters long',
  })
  @MaxLength(120, {
    message: 'Nickname max length is 120 characters',
  })
  @IsOptional()
  @IsString()
  nickname: string;

  @IsString()
  @MinLength(6, {
    message: 'Password must be at least 6 characters long',
  })
  @MaxLength(120, {
    message: 'Nickname max length is 120 characters',
  })
  @IsOptional()
  password: string;
}
