import { computed, Injectable, signal } from '@angular/core';
import { Dashboard, DashboardWidgetInstance } from '../models/dashboard.model';
import { WidgetDefinition } from '../models/widget-definition.model';

function uid(): string {
  return `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const INITIAL_DASHBOARD: Dashboard = {
  id: 'default',
  name: 'Meu Dashboard',
  widgets: [
    {
      id: uid(),
      widgetTypeId: 'metric-card',
      x: 0, y: 0, cols: 3, rows: 2,
      config: {
        label: 'Total de ISINs',
        value: 14823,
        trend: '+5.2%',
        unit: '',
        color: 'teal',
      },
    },
    {
      id: uid(),
      widgetTypeId: 'metric-card',
      x: 3, y: 0, cols: 3, rows: 2,
      config: {
        label: 'Emissores Ativos',
        value: 423,
        trend: '+2.1%',
        unit: '',
        color: 'amber',
      },
    },
    {
      id: uid(),
      widgetTypeId: 'metric-card',
      x: 6, y: 0, cols: 3, rows: 2,
      config: {
        label: 'Novos (mês)',
        value: 87,
        trend: '-1.4%',
        unit: '',
        color: 'navy',
      },
    },
    {
      id: uid(),
      widgetTypeId: 'items-list',
      x: 0, y: 2, cols: 9, rows: 4,
      config: {
        title: 'ISINs Recentes',
        maxItems: 8,
      },
    },
  ],
};

/**
 * DashboardStateService — single source of truth for dashboard state.
 *
 * PERSISTENCE EXTENSION POINT:
 *   Add `async load(id: string): Promise<void>` and `async save(): Promise<void>`
 *   here when a backend is available. Components only consume signals exposed
 *   by this service and need no changes.
 */
@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  private readonly _state = signal<Dashboard>(structuredClone(INITIAL_DASHBOARD));

  // layoutVersion bumps on structural changes (add/remove/reset) so the
  // dashboard shell knows when to fully rebuild the gridster item array.
  private readonly _layoutVersion = signal(0);

  readonly dashboard  = this._state.asReadonly();
  readonly widgets    = computed(() => this._state().widgets);
  readonly layoutVersion = this._layoutVersion.asReadonly();

  addWidget(definition: WidgetDefinition): void {
    const newInstance: DashboardWidgetInstance = {
      id: uid(),
      widgetTypeId: definition.id,
      x: 0, y: 0,
      cols: definition.defaultSize.cols,
      rows: definition.defaultSize.rows,
      config: this.buildDefaultConfig(definition),
    };

    this._state.update(d => ({ ...d, widgets: [...d.widgets, newInstance] }));
    this._layoutVersion.update(v => v + 1);
  }

  removeWidget(instanceId: string): void {
    this._state.update(d => ({
      ...d,
      widgets: d.widgets.filter(w => w.id !== instanceId),
    }));
    this._layoutVersion.update(v => v + 1);
  }

  updateLayout(updates: Pick<DashboardWidgetInstance, 'id' | 'x' | 'y' | 'cols' | 'rows'>[]): void {
    // Does NOT bump layoutVersion — gridster already applied positions in-place.
    // This call only persists the new layout to the state signal for future save().
    this._state.update(d => ({
      ...d,
      widgets: d.widgets.map(w => {
        const u = updates.find(up => up.id === w.id);
        return u ? { ...w, x: u.x, y: u.y, cols: u.cols, rows: u.rows } : w;
      }),
    }));
  }

  updateWidgetConfig(instanceId: string, config: Record<string, unknown>): void {
    this._state.update(d => ({
      ...d,
      widgets: d.widgets.map(w =>
        w.id === instanceId ? { ...w, config: { ...w.config, ...config } } : w,
      ),
    }));
  }

  resetLayout(): void {
    this._state.set(structuredClone(INITIAL_DASHBOARD));
    this._layoutVersion.update(v => v + 1);
  }

  private buildDefaultConfig(definition: WidgetDefinition): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    for (const field of definition.configSchema ?? []) {
      if (field.defaultValue !== undefined) {
        config[field.key] = field.defaultValue;
      }
    }
    return config;
  }
}
