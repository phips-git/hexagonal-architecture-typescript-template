export interface IdGeneratorPort {
  generate<T = string>(): T;
}
