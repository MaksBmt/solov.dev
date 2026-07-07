import { Component, input, output } from '@angular/core';

@Component({
  selector: 'label[appLabSwitch]',
  standalone: true,
  templateUrl: './lab-switch.component.html',
  styleUrls: ['./lab-switch.component.scss'],
  host: {
    class: 'lab-switch',
  },
})
export class LabSwitchComponent {
  readonly label = input('');
  readonly checked = input(false);
  readonly checkedChange = output<boolean>();

  onToggle(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    this.checkedChange.emit(inputEl.checked);
  }
}
