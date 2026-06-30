import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DecimalPipe, NgClass } from '@angular/common';

export interface MetricCardConfig {
  label: string;
  value: number;
  trend?: string;
  unit?: string;
  color?: 'teal' | 'amber' | 'navy' | 'success' | 'danger';
}

@Component({
  selector: 'app-metric-card',
  standalone: true,
  imports: [DecimalPipe, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.scss',
})
export class MetricCardComponent {
  readonly config     = input<MetricCardConfig>({ label: 'Métrica', value: 0 });
  readonly instanceId = input<string>('');

  protected readonly cfg = computed(() => this.config() as MetricCardConfig);

  protected readonly trendPositive = computed(() => {
    const t = this.cfg().trend ?? '';
    return t.startsWith('+');
  });

  protected readonly trendNegative = computed(() => {
    const t = this.cfg().trend ?? '';
    return t.startsWith('-');
  });

  protected readonly colorClass = computed(
    () => `color-${this.cfg().color ?? 'teal'}`,
  );
}
