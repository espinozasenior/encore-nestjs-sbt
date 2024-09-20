import type { IGetClientsResponse } from "../interfaces/get-clients-response.interface";
import type { Client } from "./client";

export interface LoginResponse {
  session: {
    /**
     * @description The key that represents the session in the Prometeo API.
     */
    key: string;
    /**
     * @description The next step that the user needs to do in order to make its session work (if any).
     */
    requires: "nothing" | "specify_client" | "otp_code" | "answer_question";
  };
  /**
   * @description The accounts(clients) that are associated with the user of the session. The user will need to choose one of them in order to start querying data with the current session.
   */
  clients?: Client[];
}

export type GetClientsResponse = IGetClientsResponse;
