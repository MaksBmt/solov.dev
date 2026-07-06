import { Component } from '@angular/core';

@Component({
  selector: 'app-controls',
  standalone: true,
  template: `
    <span class="controls__item">←</span>
    <span class="controls__item controls__item--active">→</span>
  `,
  styleUrls: ['./controls.component.scss'],
  host: {
    'class': 'controls'
  }
})
export class ControlsComponent {}
