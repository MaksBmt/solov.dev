import { Component } from '@angular/core';

@Component({
  selector: '[appHighlight]',
  standalone: true,
  styleUrls: ['./highlight.component.scss'],
  template: '<ng-content></ng-content>',
  host: {
    'class': 'highlight'
  }
})
export class HighlightComponent {}
