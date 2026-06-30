import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { WidgetDefinition } from '../../models/widget-definition.model';
import { WidgetRegistryService } from '../../services/widget-registry.service';

@Component({
  selector: 'app-widget-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './widget-catalog.component.html',
  styleUrl: './widget-catalog.component.scss',
})
export class WidgetCatalogComponent {
  private readonly registry = inject(WidgetRegistryService);

  protected readonly widgets = this.registry.getAll();

  readonly addWidget = output<WidgetDefinition>();

  protected onAdd(def: WidgetDefinition): void {
    this.addWidget.emit(def);
  }
}
