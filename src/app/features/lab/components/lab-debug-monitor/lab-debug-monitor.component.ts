import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lab-debug-monitor',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./lab-debug-monitor.component.scss'],
  templateUrl: './lab-debug-monitor.component.html'
})
export class LabDebugMonitorComponent {
  @Input() debugMonitor: any[] = [];
  @Input() monitorValues: Record<string, string> = {};
}
