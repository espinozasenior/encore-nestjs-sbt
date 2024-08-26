import { api, APIError } from "encore.dev/api";
import applicationContext from "../applicationContext";
const { catsService } = await applicationContext;
import type { CreateCatDto } from "./dto/create-cat.dto";
import type { Cat } from "./interfaces/cat.interface";
import { Prisma, PrismaClient, cats } from "@prisma/client";

// Use Encore `api` calls to define the API routes instead of using NestJS controllers.
// Endpoint requires authentication, auth handler will be called before the endpoint.
export const create = api(
  { expose: true, auth: true, method: "POST", path: "/cats" },
  async (dto: CreateCatDto): Promise<void> => {
    // Inside the endpoint we can use the `applicationContext` to get the services we need.
    const { catsService } = await applicationContext;
    catsService.create(dto);
  },
);

export const get = api(
  { expose: true, method: "GET", path: "/cats/:id" },
  async ({ id }: { id: number }): Promise<Cat> => {
    // const { catsService } = await applicationContext;
    const result = await catsService.get(id);
    if (!result) {
      throw APIError.notFound("ID not found");
    }
    return result;
  },
);

export const findAll = api(
  { expose: true, method: "GET", path: "/cats" },
  async (): Promise<{
    cats: {
      id: number;
      name: string;
      age: number;
      breed: string;
    }[];
  }> => {
    return { cats: await catsService.findAll() };
  },
);
