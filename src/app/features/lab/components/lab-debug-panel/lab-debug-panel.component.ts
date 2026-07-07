import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LabDebugMonitorComponent } from '../lab-debug-monitor/lab-debug-monitor.component';
import { LabDebugControlComponent } from '../lab-debug-control/lab-debug-control.component';

@Component({
  selector: 'app-lab-debug-panel',
  standalone: true,
  imports: [CommonModule, LabDebugMonitorComponent, LabDebugControlComponent],
  templateUrl: './lab-debug-panel.component.html',
  styleUrls: ['./lab-debug-panel.component.scss'],
})
export class LabDebugPanelComponent {
  readonly showDebug = input(false);
  readonly debugMonitor = input<any[]>();
  readonly monitorValues = input<Record<string, string>>({});
  readonly debugControls = input<any[]>();
  readonly controlValues = input<Record<string, number>>({});
  readonly debugLegend = input<string>();

  readonly onOpenCode = output<void>();
  readonly onControlChange = output<{ control: any; event: Event }>();

  onControlInput(control: any, event: Event) {
    this.onControlChange.emit({ control, event });
  }

  formatControlValue(value: number, step: number | string) {
    if (value === undefined) return '';
    const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
    return value.toFixed(decimals);
  }
}
