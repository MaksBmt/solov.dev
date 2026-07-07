import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';

@Component({
  selector: 'label[appLabSwitch]',
  standalone: true,
  templateUrl: './lab-switch.component.html',
  styleUrls: ['./lab-switch.component.scss']
})
export class LabSwitchComponent {
  @Input() label: string = '';
  @Input() checked: boolean = false;
  @Output() checkedChange = new EventEmitter<boolean>();
  
  @HostBinding('class.lab-switch') isSwitch = true;

  onToggle(event: Event) {
    const input = event.target as HTMLInputElement;
    this.checkedChange.emit(input.checked);
  }
}
