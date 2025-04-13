import { PartialType } from '@nestjs/mapped-types';
import { CreateConfigRequestDto } from './create-config.dto';

export class UpdateConfigDto extends PartialType(CreateConfigRequestDto) {}
