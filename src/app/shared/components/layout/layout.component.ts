import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  host: {
    class: 'layout',
    '[class.layout--fullscreen]': 'fullscreen()',
    '[class.layout--page]': 'page()',
  },
})
export class LayoutComponent {
  readonly fullscreen = input(false);
  readonly page = input(false);
}
