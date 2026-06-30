import { inject, Injectable, InjectionToken } from '@angular/core';
import { WidgetDefinition } from '../models/widget-definition.model';
import { WIDGET_REGISTRY } from '../tokens/widget-registry.token';

@Injectable({ providedIn: 'root' })
export class WidgetRegistryService {
  // multi: true causes Angular to inject T[] even though the token is typed T.
  // The cast via an intermediate unknown is the standard workaround for this known
  // Angular/TypeScript typing limitation with multi-providers.
  private readonly definitions: WidgetDefinition[] =
    (inject(WIDGET_REGISTRY as InjectionToken<unknown>, { optional: true }) as WidgetDefinition[] | null) ?? [];

  getAll(): WidgetDefinition[] {
    return this.definitions;
  }

  getById(id: string): WidgetDefinition | undefined {
    return this.definitions.find(d => d.id === id);
  }
}
