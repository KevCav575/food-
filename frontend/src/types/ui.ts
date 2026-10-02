/** Error presentable al usuario (título + mensaje), independiente del código HTTP */
export interface ScanError {
  code: string;
  title: string;
  message: string;
  /** Si tiene sentido reintentar la misma operación */
  retryable: boolean;
}
