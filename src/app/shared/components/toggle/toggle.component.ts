import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="toggle js-toggle" type="button" 
            [attr.aria-expanded]="isOpen" 
            [attr.aria-label]="isOpen ? 'Закрыть меню' : 'Открыть меню'"
            (click)="onClick.emit($event)">
      <span class="toggle__line"></span>
      <span class="toggle__line"></span>
      <span class="toggle__line"></span>
    </button>
  `,
  styleUrls: ['./toggle.component.scss']
})
export class ToggleComponent {
  @Input() isOpen = false;
  @Output() onClick = new EventEmitter<Event>();
}
