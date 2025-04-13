import { IsBoolean, IsOptional } from 'class-validator';

export class ExtendConfigDto {
  @IsBoolean()
  @IsOptional()
  useAccumulatedDays?: boolean;
  months?: number;
  days?: number;
}
