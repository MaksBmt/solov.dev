import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'button[appButton], a[appButton]',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./button.component.scss'],
  template: '<ng-content></ng-content>',
  host: {
    class: 'button',
    '[class.button--primary]': 'primary()',
  },
})
export class ButtonComponent {
  readonly primary = input(false);
}
