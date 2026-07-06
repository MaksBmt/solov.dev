import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lab-debug-control',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./lab-debug-control.component.scss'],
  templateUrl: './lab-debug-control.component.html'
})
export class LabDebugControlComponent {
  @Input() control: any;
  @Input() controlValue: number | undefined = 0;
  @Output() controlChange = new EventEmitter<Event>();

  onInput(event: Event) {
    this.controlChange.emit(event);
  }

  formatControlValue(value: number | undefined, step: number | string) {
    if (value === undefined || value === null) return '';
    const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
    return Number(value).toFixed(decimals);
  }
}
