/**
 * Event Listener Manager
 * 
 * Tracks and manages event listeners to prevent memory leaks.
 * All event listeners should be registered through this manager
 * so they can be cleaned up when the game restarts or is destroyed.
 */

interface ListenerRecord {
  element: EventTarget;
  event: string;
  handler: EventListener | ((e: Event) => void);
  options?: boolean | AddEventListenerOptions;
}

export class EventManager {
  private listeners: ListenerRecord[] = [];

  /**
   * Add an event listener and track it for cleanup
   */
  addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener | ((e: Event) => void),
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options);
    this.listeners.push({ element, event, handler, options });
  }

  /**
   * Remove a specific event listener
   */
  removeEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener | ((e: Event) => void),
    options?: boolean | EventListenerOptions
  ): void {
    element.removeEventListener(event, handler, options);
    this.listeners = this.listeners.filter(
      (l) => l.element !== element || l.event !== event || l.handler !== handler
    );
  }

  /**
   * Remove all tracked event listeners
   */
  cleanup(): void {
    for (const { element, event, handler, options } of this.listeners) {
      element.removeEventListener(event, handler, options);
    }
    this.listeners = [];
  }

  /**
   * Get the number of tracked listeners
   */
  getListenerCount(): number {
    return this.listeners.length;
  }
}
