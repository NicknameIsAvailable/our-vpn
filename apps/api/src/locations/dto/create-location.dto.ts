export class CreateLocationDto {
  name: string;
  country: string;
  city: string;
  ip: string;
  hostname: string;
  isActive: boolean;
  bandwidthLimit: number;
  currentLoad: number;
}
