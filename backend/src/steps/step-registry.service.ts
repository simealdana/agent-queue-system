import { Injectable } from '@nestjs/common';
import { StepHandler } from './step.types';

@Injectable()
export class StepRegistry {
  private handlers = new Map<string, StepHandler>();

  register(name: string, handler: StepHandler): void {
    this.handlers.set(name, handler);
  }

  get(name: string): StepHandler {
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`No step handler registered for "${name}"`);
    }
    return handler;
  }

  has(name: string): boolean {
    return this.handlers.has(name);
  }
}
