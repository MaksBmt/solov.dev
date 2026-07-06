import { Component } from '@angular/core';

@Component({
  selector: 'span[appMark]',
  standalone: true,
  styleUrls: ['./mark.component.scss'],
  template: '<ng-content></ng-content>',
  host: {
    'class': 'mark'
  }
})
export class MarkComponent {}
