declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APIPERU_URL: string;
      APIPERU_API_KEY: string;
    }
  }
}

export type {};
