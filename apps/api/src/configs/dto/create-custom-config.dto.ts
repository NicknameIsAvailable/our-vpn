import { IsString, IsUUID } from 'class-validator';
import { IsVlessUrl } from '../decorators/is-vless-url.decorator';

export class CreateCustomConfigDto {
  @IsString()
  @IsVlessUrl({ message: 'Invalid VLESS URL format' })
  url: string;
  @IsUUID()
  userId: string;
  name: string;
}
