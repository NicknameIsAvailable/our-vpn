import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegistrationDto {
  @IsEmail()
  email: string;

  @MinLength(8, {
    message: 'Nickname must be at least 6 characters long',
  })
  @MaxLength(120, {
    message: 'Nickname max length is 120 characters',
  })
  @IsString()
  nickname: string;

  @MinLength(6, {
    message: 'Password must be at least 6 characters long',
  })
  @MaxLength(120, {
    message: 'Password max length is 120 characters',
  })
  @IsString()
  password: string;

  @MinLength(6, {
    message: 'Password must be at least 6 characters long',
  })
  @MaxLength(120, {
    message: 'Password max length is 120 characters',
  })
  @IsString()
  repeatPassword: string;
}
