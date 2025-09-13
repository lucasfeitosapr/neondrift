export class Pool<T> {
  private items: T[] = [];
  private factory: () => T;

  constructor(factory: () => T, initialSize = 0) {
    this.factory = factory;
    for (let i = 0; i < initialSize; i++) this.items.push(factory());
  }

  borrow(): T {
    return this.items.pop() || this.factory();
  }

  release(item: T): void {
    this.items.push(item);
  }

  size(): number {
    return this.items.length;
  }
}
