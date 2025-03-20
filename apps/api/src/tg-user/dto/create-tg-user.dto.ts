import { CreateTgUser } from "types/tg-user";

export class CreateTgUserDto implements CreateTgUser {
  id: number;
  username: string;
}
