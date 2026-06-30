import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnChanges,
  Type,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { DashboardWidgetInstance } from '../../models/dashboard.model';
import { WidgetRegistryService } from '../../services/widget-registry.service';

/**
 * WidgetHostComponent dynamically loads and renders a widget component.
 *
 * It reads the widgetTypeId from the instance, resolves the component class
 * via WidgetRegistryService (which supports lazy imports), and creates it via
 * ViewContainerRef. If the widget type is not found, it renders a fallback.
 *
 * The `config` and `instanceId` are passed via setInput() so widget components
 * receive them as regular signal inputs without knowing they're dynamically created.
 */
@Component({
  selector: 'app-widget-host',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-container #outlet></ng-container>`,
})
export class WidgetHostComponent implements AfterViewInit, OnChanges {
  @ViewChild('outlet', { read: ViewContainerRef })
  private readonly outlet!: ViewContainerRef;

  readonly widgetInstance = input.required<DashboardWidgetInstance>();

  private readonly registry = inject(WidgetRegistryService);
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    void this.renderWidget();
  }

  ngOnChanges(): void {
    if (this.viewReady) {
      void this.renderWidget();
    }
  }

  private async renderWidget(): Promise<void> {
    const instance = this.widgetInstance();
    this.outlet.clear();

    const definition = this.registry.getById(instance.widgetTypeId);

    if (!definition) {
      const { WidgetOrphanFallbackComponent } = await import(
        '../widget-orphan-fallback/widget-orphan-fallback.component'
      );
      const ref = this.outlet.createComponent(WidgetOrphanFallbackComponent);
      ref.setInput('widgetTypeId', instance.widgetTypeId);
      return;
    }

    const componentClass = await definition.component();
    const ref = this.outlet.createComponent(componentClass as Type<unknown>);
    ref.setInput('config', instance.config ?? {});
    ref.setInput('instanceId', instance.id);
  }
}
