import { UseGuards } from '@nestjs/common';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

export const OptionalAuth = () => UseGuards(OptionalJwtAuthGuard);
