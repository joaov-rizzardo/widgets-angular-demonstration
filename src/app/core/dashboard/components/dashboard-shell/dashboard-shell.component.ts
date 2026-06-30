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
  // v22: import standalone component classes directly (no GridsterModule)
  imports: [Gridster, GridsterItem, WidgetHostComponent, WidgetCatalogComponent, WidgetConfigModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-shell.component.html',
  styleUrl: './dashboard-shell.component.scss',
})
export class DashboardShellComponent {
  private readonly stateService = inject(DashboardStateService);

  protected readonly isEditMode  = signal(false);
  protected readonly configModalInstanceId = signal<string | null>(null);

  // Local mutable array that gridster reads and mutates in-place for drag/resize.
  // Rebuilt from state only when layoutVersion bumps (add, remove, reset).
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
    // Rebuild gridItems only on structural changes (add / remove / reset).
    // Drag-and-drop position changes do NOT bump layoutVersion, so gridster's
    // in-place mutations are preserved without triggering a rebuild loop.
    effect(() => {
      const _version = this.stateService.layoutVersion();
      const stateWidgets = untracked(() => this.stateService.widgets());
      this.gridItems = stateWidgets.map(w => ({ ...w }));
    });

    // Keep gridster options in sync with edit mode.
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

  protected resetLayout(): void {
    if (!confirm('Resetar o dashboard para o layout inicial?')) return;
    this.stateService.resetLayout();
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
