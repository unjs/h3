export interface EventStreamOptions {
  /**
   * Automatically close the writable stream when the request is closed
   *
   * Default is `true`
   */
  autoclose?: boolean;
}

/**
 * See https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#fields
 */
export interface EventStreamMessage {
  id?: string;
  event?: string;
  retry?: number;
  data: string;
}
