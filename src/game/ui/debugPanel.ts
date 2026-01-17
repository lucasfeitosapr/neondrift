import { GameState } from '../types';
import { EventManager } from '../eventManager';
import { debugControls, DebugControl, ToggleControl, NumericControl, CustomControl } from './debugPanelConfig';

// Legacy interfaces kept for backward compatibility during migration
export interface DebugPanelElements {
  panel: HTMLElement;
  [key: string]: HTMLElement;
}

export interface DebugPanelControls {
  [key: string]: HTMLElement | null;
}

// Get element ID helper
function getElementId(control: DebugControl, suffix?: string): string {
  if (control.type === 'toggle' && suffix === 'status') {
    return control.statusElementId || `status${control.id.charAt(0).toUpperCase() + control.id.slice(1)}`;
  }
  if (control.type === 'numeric') {
    if (suffix === 'value') return control.valueElementId || control.id;
    if (suffix === 'dec') return control.decButtonId || `${control.id}Dec`;
    if (suffix === 'inc') return control.incButtonId || `${control.id}Inc`;
  }
  return control.elementId || `debug${control.id.charAt(0).toUpperCase() + control.id.slice(1)}`;
}

// Get all element IDs needed by controls
function getAllElementIds(controls: DebugControl[]): string[] {
  const ids = new Set<string>();
  for (const control of controls) {
    if (control.type === 'display') {
      ids.add(getElementId(control));
    } else if (control.type === 'toggle') {
      ids.add(`toggle${control.id.charAt(0).toUpperCase() + control.id.slice(1)}`);
      ids.add(getElementId(control, 'status'));
    } else if (control.type === 'numeric') {
      ids.add(getElementId(control, 'value'));
      ids.add(getElementId(control, 'dec'));
      ids.add(getElementId(control, 'inc'));
    } else if (control.type === 'custom' && control.elementIds) {
      control.elementIds.forEach(id => ids.add(id));
    }
  }
  return Array.from(ids);
}

export function wireDebugPanelControls(
  state: GameState,
  controls: DebugControl[],
  eventManager: EventManager
): void {
  for (const control of controls) {
    if (control.type === 'toggle') {
      const toggleId = `toggle${control.id.charAt(0).toUpperCase() + control.id.slice(1)}`;
      const element = document.getElementById(toggleId);
      if (element) {
        eventManager.addEventListener(element, 'click', () => {
          const current = control.getValue(state);
          control.setValue(state, !current);
        });
      }
    } else if (control.type === 'numeric') {
      const decButton = document.getElementById(getElementId(control, 'dec'));
      const incButton = document.getElementById(getElementId(control, 'inc'));
      
      if (decButton) {
        eventManager.addEventListener(decButton, 'click', () => {
          const current = control.getValue(state);
          const step = control.step || 1;
          const min = control.min ?? 0;
          const newValue = Math.max(min, current - step);
          control.setValue(state, newValue);
        });
      }
      
      if (incButton) {
        eventManager.addEventListener(incButton, 'click', () => {
          const current = control.getValue(state);
          const step = control.step || 1;
          const max = control.max ?? 100;
          const newValue = Math.min(max, current + step);
          control.setValue(state, newValue);
        });
      }
    }
  }
}

export function updateDebugPanel(
  state: GameState,
  debugEnabled: boolean,
  controls: DebugControl[]
): void {
  const panel = document.getElementById('debugPanel');
  if (!panel) return;
  
  panel.classList.toggle('visible', debugEnabled);
  if (!debugEnabled) return;
  
  // Build element cache
  const elements = new Map<string, HTMLElement>();
  for (const control of controls) {
    if (control.type === 'display') {
      const id = getElementId(control);
      const element = document.getElementById(id);
      if (element) elements.set(id, element);
    } else if (control.type === 'toggle') {
      const statusId = getElementId(control, 'status');
      const element = document.getElementById(statusId);
      if (element) elements.set(statusId, element);
    } else if (control.type === 'numeric') {
      const valueId = getElementId(control, 'value');
      const element = document.getElementById(valueId);
      if (element) elements.set(valueId, element);
    } else if (control.type === 'custom' && control.elementIds) {
      control.elementIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) elements.set(id, element);
      });
    }
  }
  
  // Update each control
  for (const control of controls) {
    if (control.type === 'display') {
      const element = elements.get(getElementId(control));
      if (element) {
        const value = control.getValue(state);
        element.textContent = control.format 
          ? control.format(value) 
          : String(value);
      }
    } else if (control.type === 'toggle') {
      const element = elements.get(getElementId(control, 'status'));
      if (element) {
        const status = control.getValue(state);
        element.textContent = status ? 'ON' : 'OFF';
        element.className = `status ${status ? 'on' : 'off'}`;
      }
    } else if (control.type === 'numeric') {
      const element = elements.get(getElementId(control, 'value'));
      if (element) {
        const value = control.getValue(state);
        element.textContent = String(value);
      }
    } else if (control.type === 'custom') {
      control.render(state, elements);
    }
  }
}

export function createDebugKeyHandler(
  state: GameState,
  debugEnabledRef: { current: boolean },
  togglePause: () => void,
  controls: DebugControl[]
): (e: Event) => void {
  // Build key map from controls
  const keyMap = new Map<string, ToggleControl>();
  for (const control of controls) {
    if (control.type === 'toggle' && control.key) {
      keyMap.set(control.key.toLowerCase(), control);
    }
  }
  
  return (e: Event) => {
    const ke = e as KeyboardEvent;
    if (ke.key === '`' || ke.key === '~') {
      debugEnabledRef.current = !debugEnabledRef.current;
      return;
    }
    
    if (ke.key === 'Escape') {
      togglePause();
      return;
    }
    
    // Handle special case for Shift+P
    if (ke.key.toLowerCase() === 'p') {
      if (ke.shiftKey && state.debug) {
        const control = keyMap.get('shift+p');
        if (control) {
          const current = control.getValue(state);
          control.setValue(state, !current);
        }
      } else {
        togglePause();
      }
      return;
    }
    
    // Auto-handle other keys
    const control = keyMap.get(ke.key.toLowerCase());
    if (control && state.debug) {
      const current = control.getValue(state);
      control.setValue(state, !current);
    }
    
    // Handle numeric keys (1-4) for crystal flags even without debug flag
    if (['1', '2', '3', '4'].includes(ke.key)) {
      const control = keyMap.get(ke.key);
      if (control) {
        const current = control.getValue(state);
        control.setValue(state, !current);
      }
    }
  };
}

// Legacy functions kept for backward compatibility
export function getDebugPanelElements(): DebugPanelElements | null {
  const panel = document.getElementById('debugPanel');
  if (!panel) return null;

  const elements: DebugPanelElements = { panel };
  const allIds = getAllElementIds(debugControls);
  
  for (const id of allIds) {
    const element = document.getElementById(id);
    if (element) {
      elements[id] = element;
    }
  }
  
  return elements;
}

export function getDebugPanelControls(): DebugPanelControls {
  const controls: DebugPanelControls = {};
  
  for (const control of debugControls) {
    if (control.type === 'toggle') {
      const toggleId = `toggle${control.id.charAt(0).toUpperCase() + control.id.slice(1)}`;
      controls[toggleId] = document.getElementById(toggleId);
    } else if (control.type === 'numeric') {
      controls[getElementId(control, 'dec')] = document.getElementById(getElementId(control, 'dec'));
      controls[getElementId(control, 'inc')] = document.getElementById(getElementId(control, 'inc'));
    }
  }
  
  return controls;
}
