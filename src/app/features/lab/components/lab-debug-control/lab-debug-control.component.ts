import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lab-debug-control',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./lab-debug-control.component.scss'],
  templateUrl: './lab-debug-control.component.html',
})
export class LabDebugControlComponent {
  readonly control = input<any>();
  readonly controlValue = input<number | undefined>(0);
  readonly controlChange = output<Event>();

  onInput(event: Event) {
    this.controlChange.emit(event);
  }

  formatControlValue(value: number | undefined, step: number | string) {
    if (value === undefined || value === null) return '';
    const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
    return Number(value).toFixed(decimals);
  }
}
