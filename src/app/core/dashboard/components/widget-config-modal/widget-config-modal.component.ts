import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfigSchemaField } from '../../models/widget-definition.model';
import { DashboardStateService } from '../../services/dashboard-state.service';
import { WidgetRegistryService } from '../../services/widget-registry.service';

@Component({
  selector: 'app-widget-config-modal',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './widget-config-modal.component.html',
  styleUrl: './widget-config-modal.component.scss',
})
export class WidgetConfigModalComponent implements OnInit {
  readonly instanceId = input.required<string>();
  readonly closed    = output<void>();

  private readonly stateService    = inject(DashboardStateService);
  private readonly registryService = inject(WidgetRegistryService);

  protected readonly instance = computed(() =>
    this.stateService.widgets().find(w => w.id === this.instanceId()),
  );

  protected readonly definition = computed(() => {
    const inst = this.instance();
    return inst ? this.registryService.getById(inst.widgetTypeId) : undefined;
  });

  protected readonly schema = computed<ConfigSchemaField[]>(
    () => this.definition()?.configSchema ?? [],
  );

  protected readonly widgetName = computed(() => this.definition()?.name ?? 'Widget');

  protected readonly formValues = signal<Record<string, unknown>>({});

  ngOnInit(): void {
    this.formValues.set({ ...(this.instance()?.config ?? {}) });
  }

  protected getValue(key: string): unknown {
    return this.formValues()[key] ?? '';
  }

  protected setValue(key: string, value: string | number): void {
    this.formValues.update(v => ({ ...v, [key]: value }));
  }

  protected save(): void {
    this.stateService.updateWidgetConfig(this.instanceId(), this.formValues());
    this.closed.emit();
  }

  protected cancel(): void {
    this.closed.emit();
  }

  protected onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.cancel();
    }
  }
}
