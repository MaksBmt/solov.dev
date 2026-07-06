import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LabDebugMonitorComponent } from '../lab-debug-monitor/lab-debug-monitor.component';
import { LabDebugControlComponent } from '../lab-debug-control/lab-debug-control.component';

@Component({
  selector: 'app-lab-debug-panel',
  standalone: true,
  imports: [CommonModule, LabDebugMonitorComponent, LabDebugControlComponent],
  templateUrl: './lab-debug-panel.component.html'
})
export class LabDebugPanelComponent {
  @Input() showDebug: boolean = false;
  @Input() debugMonitor?: any[];
  @Input() monitorValues: Record<string, string> = {};
  @Input() debugControls?: any[];
  @Input() controlValues: Record<string, number> = {};
  @Input() debugLegend?: string;

  @Output() onOpenCode = new EventEmitter<void>();
  @Output() onControlChange = new EventEmitter<{control: any, event: Event}>();

  onControlInput(control: any, event: Event) {
    this.onControlChange.emit({ control, event });
  }

  formatControlValue(value: number, step: number | string) {
    if (value === undefined) return '';
    const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
    return value.toFixed(decimals);
  }
}
