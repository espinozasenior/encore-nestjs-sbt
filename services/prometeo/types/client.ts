/**
 * @description The clients are accounts associated to a user. A user can have more than one account associated with his user. It happens a lot in the case of accounts with 2 owners.
 */
export interface Client {
  /**
   * @description The id that represents the client in the Prometeo API.
   */
  id: string;
  /**
   * @description The name(or label) of the client.
   */
  name: string;
}
