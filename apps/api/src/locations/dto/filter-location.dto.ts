import { IsOptional, IsString, IsBoolean, IsInt } from 'class-validator';

export class FilterLocationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  ip?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  bandwidthLimit?: number;

  @IsOptional()
  @IsInt()
  currentLoad?: number;
}
