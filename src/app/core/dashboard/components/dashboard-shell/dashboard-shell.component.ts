import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {
  CompactType,
  DisplayGrid,
  Gridster,
  GridsterConfig,
  GridsterItem,
  GridsterItemConfig,
  GridType,
} from 'angular-gridster2';
import { WidgetDefinition } from '../../models/widget-definition.model';
import { DashboardWidgetInstance } from '../../models/dashboard.model';
import { DashboardStateService } from '../../services/dashboard-state.service';
import { WidgetHostComponent } from '../widget-host/widget-host.component';
import { WidgetCatalogComponent } from '../widget-catalog/widget-catalog.component';
import { WidgetConfigModalComponent } from '../widget-config-modal/widget-config-modal.component';

@Component({
  selector: 'app-dashboard-shell',
  standalone: true,
  imports: [Gridster, GridsterItem, WidgetHostComponent, WidgetCatalogComponent, WidgetConfigModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  private readonly stateService = inject(DashboardStateService);

  protected readonly isEditMode            = signal(false);
  protected readonly configModalInstanceId = signal<string | null>(null);
  protected readonly renamingId            = signal<string | null>(null);

  protected readonly workspaces        = this.stateService.workspaces;
  protected readonly activeWorkspaceId = this.stateService.activeWorkspaceId;
  protected readonly activeWorkspace   = this.stateService.activeWorkspace;

  protected gridItems: DashboardWidgetInstance[] = [];

  protected gridsterOptions: GridsterConfig = {
    gridType: GridType.ScrollVertical,
    compactType: CompactType.None,
    displayGrid: DisplayGrid.OnDragAndResize,
    pushItems: true,
    swap: false,
    outerMargin: true,
    margin: 12,
    mobileBreakpoint: 0,
    minCols: 12,
    maxCols: 12,
    minRows: 2,
    maxRows: 100,
    draggable:  { enabled: false },
    resizable:  { enabled: false, handles: { s: true, e: true, se: true } },
    itemChangeCallback: (item: GridsterItemConfig) => this.onItemChange(item),
    itemResizeCallback: (item: GridsterItemConfig) => this.onItemChange(item),
  };

  constructor() {
    // Rebuild gridItems on structural changes (add / remove widget, switch workspace, clear).
    effect(() => {
      const _version = this.stateService.layoutVersion();
      const stateWidgets = untracked(() => this.stateService.widgets());
      this.gridItems = stateWidgets.map(w => ({ ...w }));
    });

    effect(() => {
      const editing = this.isEditMode();
      this.gridsterOptions = {
        ...this.gridsterOptions,
        draggable: { enabled: editing },
        resizable: { ...this.gridsterOptions.resizable, enabled: editing },
        displayGrid: editing ? DisplayGrid.Always : DisplayGrid.OnDragAndResize,
      };
    });
  }

  protected toggleEditMode(): void {
    this.isEditMode.update(v => !v);
  }

  protected switchWorkspace(id: string): void {
    this.isEditMode.set(false);
    this.renamingId.set(null);
    this.stateService.switchWorkspace(id);
  }

  protected addWorkspace(): void {
    const n = this.workspaces().length + 1;
    this.stateService.addWorkspace(`Workspace ${n}`);
    this.isEditMode.set(false);
  }

  protected removeWorkspace(event: MouseEvent, id: string): void {
    event.stopPropagation();
    if (this.workspaces().length <= 1) return;
    if (!confirm('Remover este workspace e todos os seus widgets?')) return;
    this.stateService.removeWorkspace(id);
  }

  protected startRename(wsId: string): void {
    this.renamingId.set(wsId);
    setTimeout(() => {
      const input = document.querySelector('.ws-tab__input') as HTMLInputElement | null;
      input?.focus();
      input?.select();
    });
  }

  protected commitRename(event: Event, wsId: string): void {
    const input = event.target as HTMLInputElement;
    this.stateService.renameWorkspace(wsId, input.value);
    this.renamingId.set(null);
  }

  protected cancelRename(): void {
    this.renamingId.set(null);
  }

  protected onAddWidget(definition: WidgetDefinition): void {
    this.stateService.addWidget(definition);
  }

  protected onRemoveWidget(instanceId: string): void {
    this.stateService.removeWidget(instanceId);
  }

  protected openConfig(instanceId: string): void {
    this.configModalInstanceId.set(instanceId);
  }

  protected closeConfig(): void {
    this.configModalInstanceId.set(null);
  }

  protected clearWorkspace(): void {
    if (!confirm('Limpar todos os widgets deste workspace?')) return;
    this.stateService.clearWorkspace();
  }

  protected asInstance(item: GridsterItemConfig): DashboardWidgetInstance {
    return item as DashboardWidgetInstance;
  }

  private onItemChange(item: GridsterItemConfig): void {
    const wi = item as DashboardWidgetInstance;
    this.stateService.updateLayout([{
      id: wi.id,
      x: wi.x,
      y: wi.y,
      cols: wi.cols,
      rows: wi.rows,
    }]);
  }
}
