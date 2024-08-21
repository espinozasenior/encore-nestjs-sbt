import type { Knex } from "knex";
import type { Cat } from "./interfaces/cat.interface";

export const catsProviders = [
  {
    provide: "CAT_MODEL",
    useFactory: (orm: Knex) => () => orm<Cat>("cats"),
    inject: ["DATABASE_CONNECTION"],
  },
];
