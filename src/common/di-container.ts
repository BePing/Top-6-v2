export interface ServiceFactory<T> {
  (): T;
}

export interface ServiceDefinition<T = unknown> {
  id: string;
  factory?: ServiceFactory<T>;
  value?: T;
  singleton?: boolean;
}

export class DIContainer {
  private static instance: DIContainer;
  private services = new Map<string, unknown>();
  private factories = new Map<string, ServiceFactory<unknown>>();
  private singletons = new Map<string, unknown>();

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  set<T>(id: string, factory: ServiceFactory<T>): void;
  set<T>(id: string, value: T): void;
  set<T>(id: string, factoryOrValue: ServiceFactory<T> | T): void {
    if (typeof factoryOrValue === 'function') {
      this.factories.set(id, factoryOrValue as ServiceFactory<unknown>);
    } else {
      this.services.set(id, factoryOrValue);
    }
  }

  setMany(definitions: ServiceDefinition[]): void {
    for (const def of definitions) {
      if (def.factory) {
        this.factories.set(def.id, def.factory);
      } else if (def.value !== undefined) {
        this.services.set(def.id, def.value);
      }
    }
  }

  get<T>(id: string): T {
    // Check if we have a singleton instance
    if (this.singletons.has(id)) {
      return this.singletons.get(id) as T;
    }

    // Check if we have a direct value
    if (this.services.has(id)) {
      return this.services.get(id) as T;
    }

    // Check if we have a factory
    if (this.factories.has(id)) {
      const factory = this.factories.get(id)!;
      const instance = factory();
      
      // If it's marked as singleton, store it
      if (this.singletons.has(id)) {
        this.singletons.set(id, instance);
      }
      
      return instance as T;
    }

    throw new Error(`Service with id '${id}' not found`);
  }

  has(id: string): boolean {
    return this.services.has(id) || this.factories.has(id) || this.singletons.has(id);
  }

  clear(): void {
    this.services.clear();
    this.factories.clear();
    this.singletons.clear();
  }
}

// Export a singleton instance
export const container = DIContainer.getInstance();
