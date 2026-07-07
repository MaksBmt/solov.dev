import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MAIN_NAVIGATION, NavItem } from '../../../core/config/navigation.config';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  host: {
    'class': 'navigation',
    '[class.navigation--horizontal]': 'type === "horizontal"',
    '[class.navigation--drawer]': 'type === "drawer"',
    '[attr.aria-label]': 'ariaLabel'
  }
})
export class NavigationComponent {
  @Input() items: NavItem[] = MAIN_NAVIGATION;
  @Input() type: 'horizontal' | 'drawer' = 'horizontal';
  @Input() ariaLabel: string = 'Меню';
}
