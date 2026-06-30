import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DashboardShellComponent } from './core/dashboard/components/dashboard-shell/dashboard-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [DashboardShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {}
