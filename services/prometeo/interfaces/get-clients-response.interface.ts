import type { Client } from "../types/client";

export interface IGetClientsResponse {
  /**
   * @description The accounts(clients) that are associated with the user of the session. The user will need to choose one of them in order to start querying data with the current session.
   */
  data: Client[];
}
