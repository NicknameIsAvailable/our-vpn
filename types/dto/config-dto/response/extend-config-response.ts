import { Config } from "@prisma/client";

export interface ExtendConfigResponse extends Config {
  daysAdded: number;
  updateXuiClient: any;
}
