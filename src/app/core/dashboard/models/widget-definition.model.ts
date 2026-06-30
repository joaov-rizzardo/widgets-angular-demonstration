import { Type } from '@angular/core';

export type ConfigFieldType = 'text' | 'number' | 'select';

export interface ConfigFieldOption {
  value: string | number | boolean;
  label: string;
}

export interface ConfigSchemaField {
  key: string;
  label: string;
  type: ConfigFieldType;
  options?: ConfigFieldOption[];
  defaultValue?: string | number | boolean;
}

export interface WidgetSize {
  cols: number;
  rows: number;
}

/**
 * A WidgetDefinition describes a widget type available for registration.
 *
 * EXTENSION POINT — To register a new widget type:
 *   1. Create a standalone Angular component.
 *   2. Create a `WidgetDefinition` object pointing to it via lazy `component()`.
 *   3. Add `{ provide: WIDGET_REGISTRY, useValue: yourDefinition, multi: true }`
 *      in your feature's providers (or directly in app.config.ts).
 *   The dashboard discovers it automatically — zero changes to core code.
 */
export interface WidgetDefinition {
  id: string;
  name: string;
  icon: string;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  component: () => Promise<Type<unknown>>;
  configSchema?: ConfigSchemaField[];
}
