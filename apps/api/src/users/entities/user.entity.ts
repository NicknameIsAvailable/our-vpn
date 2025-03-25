import { Config } from "@prisma/client"

export interface User {
  id: string
  email: string
  password: string
  configs: Config[]
}
