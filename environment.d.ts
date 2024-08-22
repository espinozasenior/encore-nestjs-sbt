declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CLERK_SECRET_KEY: string;
      CLERK_PUBLISHABLE_KEY: string;
      CLERK_JWT_PUBLIC_KEY: string;
      NODE_ENV: "development" | "production";
      APIPERU_URL: string;
      APIPERU_API_KEY: string;
    }
  }
}

export type {};
