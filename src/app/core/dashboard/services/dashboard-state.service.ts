import { computed, Injectable, signal } from '@angular/core';
import { Dashboard, DashboardWidgetInstance, WorkspaceState } from '../models/dashboard.model';
import { WidgetDefinition } from '../models/widget-definition.model';

function uid(): string {
  return `w-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function wsid(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const FIRST_ID = wsid();

const INITIAL_STATE: WorkspaceState = {
  workspaces: [{ id: FIRST_ID, name: 'Workspace 1', widgets: [] }],
  activeWorkspaceId: FIRST_ID,
};

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  private readonly _state = signal<WorkspaceState>(structuredClone(INITIAL_STATE));

  // Bumps on structural changes (add/remove widget, workspace switch, clear)
  // so the shell knows when to fully rebuild the gridster item array.
  private readonly _layoutVersion = signal(0);

  readonly workspaces        = computed(() => this._state().workspaces);
  readonly activeWorkspaceId = computed(() => this._state().activeWorkspaceId);
  readonly activeWorkspace   = computed(() =>
    this._state().workspaces.find(w => w.id === this._state().activeWorkspaceId)!
  );
  readonly widgets           = computed(() => this.activeWorkspace().widgets);
  readonly layoutVersion     = this._layoutVersion.asReadonly();

  switchWorkspace(id: string): void {
    if (!this._state().workspaces.find(w => w.id === id)) return;
    this._state.update(s => ({ ...s, activeWorkspaceId: id }));
    this._layoutVersion.update(v => v + 1);
  }

  addWorkspace(name: string): void {
    const id = wsid();
    const ws: Dashboard = { id, name, widgets: [] };
    this._state.update(s => ({ workspaces: [...s.workspaces, ws], activeWorkspaceId: id }));
    this._layoutVersion.update(v => v + 1);
  }

  removeWorkspace(id: string): void {
    const { workspaces, activeWorkspaceId } = this._state();
    if (workspaces.length <= 1) return;
    const idx = workspaces.findIndex(w => w.id === id);
    const remaining = workspaces.filter(w => w.id !== id);
    const newActive = activeWorkspaceId === id
      ? remaining[Math.max(0, idx - 1)].id
      : activeWorkspaceId;
    this._state.set({ workspaces: remaining, activeWorkspaceId: newActive });
    this._layoutVersion.update(v => v + 1);
  }

  renameWorkspace(id: string, name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    this._state.update(s => ({
      ...s,
      workspaces: s.workspaces.map(w => w.id === id ? { ...w, name: trimmed } : w),
    }));
  }

  addWidget(definition: WidgetDefinition): void {
    const newInstance: DashboardWidgetInstance = {
      id: uid(),
      widgetTypeId: definition.id,
      x: 0, y: 0,
      cols: definition.defaultSize.cols,
      rows: definition.defaultSize.rows,
      config: this.buildDefaultConfig(definition),
    };

    this._state.update(s => ({
      ...s,
      workspaces: s.workspaces.map(w =>
        w.id === s.activeWorkspaceId
          ? { ...w, widgets: [...w.widgets, newInstance] }
          : w
      ),
    }));
    this._layoutVersion.update(v => v + 1);
  }

  removeWidget(instanceId: string): void {
    this._state.update(s => ({
      ...s,
      workspaces: s.workspaces.map(w =>
        w.id === s.activeWorkspaceId
          ? { ...w, widgets: w.widgets.filter(wi => wi.id !== instanceId) }
          : w
      ),
    }));
    this._layoutVersion.update(v => v + 1);
  }

  updateLayout(updates: Pick<DashboardWidgetInstance, 'id' | 'x' | 'y' | 'cols' | 'rows'>[]): void {
    // Does NOT bump layoutVersion — gridster already applied positions in-place.
    this._state.update(s => ({
      ...s,
      workspaces: s.workspaces.map(w =>
        w.id === s.activeWorkspaceId
          ? {
              ...w,
              widgets: w.widgets.map(wi => {
                const u = updates.find(up => up.id === wi.id);
                return u ? { ...wi, x: u.x, y: u.y, cols: u.cols, rows: u.rows } : wi;
              }),
            }
          : w
      ),
    }));
  }

  updateWidgetConfig(instanceId: string, config: Record<string, unknown>): void {
    this._state.update(s => ({
      ...s,
      workspaces: s.workspaces.map(w =>
        w.id === s.activeWorkspaceId
          ? {
              ...w,
              widgets: w.widgets.map(wi =>
                wi.id === instanceId ? { ...wi, config: { ...wi.config, ...config } } : wi
              ),
            }
          : w
      ),
    }));
  }

  clearWorkspace(): void {
    this._state.update(s => ({
      ...s,
      workspaces: s.workspaces.map(w =>
        w.id === s.activeWorkspaceId ? { ...w, widgets: [] } : w
      ),
    }));
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
