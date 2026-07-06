import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'button[appButton], a[appButton]',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./button.component.scss'],
  template: '<ng-content></ng-content>',
  host: {
    'class': 'button'
  }
})
export class ButtonComponent {
  @Input() @HostBinding('class.button--primary') primary: boolean = false;
}
