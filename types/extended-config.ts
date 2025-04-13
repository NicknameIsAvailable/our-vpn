import { Config, Location } from "@prisma/client";

export interface ExtendedConfig extends Config {
  location: Location;
}
