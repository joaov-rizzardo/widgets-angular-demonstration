import { InjectionToken } from '@angular/core';
import { WidgetDefinition } from '../models/widget-definition.model';

/**
 * Multi-provider token. Each feature module provides its widget definition:
 *   { provide: WIDGET_REGISTRY, useValue: myWidgetDef, multi: true }
 *
 * The WidgetRegistryService collects all registered definitions at runtime.
 */
export const WIDGET_REGISTRY = new InjectionToken<WidgetDefinition>('WIDGET_REGISTRY');
