export interface CacheConditions {
  modifiedTime?: string | Date;
  maxAge?: number;
  etag?: string;
  cacheControls?: string[];
}
