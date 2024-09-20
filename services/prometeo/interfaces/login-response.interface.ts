import type { Client } from "../types/client";

export interface ILoginSuccessfulResponse {
  /**
   * @description The key that represents the session in the Prometeo API.
   */
  key: string;
  /**
   * @description The next step that the user needs to do in order to make its session work (if any).
   */
  next_step: null;
}

export interface ILoginNeedsClientResponse {
  /**
   * @description The key that represents the session in the Prometeo API.
   */
  key: string;
  /**
   * @description The next step that the user needs to do in order to make its session work (if any).
   */
  next_step: "specify_client";
  /**
   * @description The accounts(clients) that are associated with the user of the session. The user will need to choose one of them in order to start querying data with the current session.
   */
  clients: Client[];
}
