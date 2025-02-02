import { Config } from "../../configs/entities/config.entity"

export interface User {
  id: string
  email: string
  password: string
  configs: Config[]
}
