export interface ProcessingServiceContract<T> {
  process(...any): Promise<void>;

  get model(): T;
}
