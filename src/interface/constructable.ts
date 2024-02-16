export abstract class Constructable<T> {
  constructor(entity: Partial<T>) {
    Object.assign(this, entity);
  }
}
