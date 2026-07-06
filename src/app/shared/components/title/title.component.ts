import { Component, Input, HostBinding } from '@angular/core';

@Component({
  selector: '[appTitle]',
  standalone: true,
  styleUrls: ['./title.component.scss'],
  template: '<ng-content></ng-content>',
  host: {
    'class': 'title'
  }
})
export class TitleComponent {}
