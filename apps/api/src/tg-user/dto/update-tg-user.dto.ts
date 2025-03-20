import { PartialType } from '@nestjs/mapped-types';
import { CreateTgUserDto } from './create-tg-user.dto';

export class UpdateTgUserDto extends PartialType(CreateTgUserDto) {}
