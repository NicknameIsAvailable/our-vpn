import { PartialType } from '@nestjs/mapped-types';
import { SendConfigDto } from './create-hook.dto';

export class UpdateHookDto extends PartialType(SendConfigDto) {}
