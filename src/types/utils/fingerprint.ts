export interface RequestFingerprintOptions {
  /** @default SHA-1 */
  hash?: false | "SHA-1";

  /** @default `true` */
  ip?: boolean;

  /** @default `false` */
  xForwardedFor?: boolean;

  /** @default `false` */
  method?: boolean;

  /** @default `false` */
  path?: boolean;

  /** @default `false` */
  userAgent?: boolean;
}
