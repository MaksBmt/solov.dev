import { Component, input } from '@angular/core';

@Component({
  selector: 'app-lab-category',
  standalone: true,
  templateUrl: './lab-category.component.html',
  styleUrls: ['./lab-category.component.scss'],
  host: {
    class: 'lab-category',
    '[class.lab-category--soon]': 'soon()',
    '[attr.id]': 'id()',
  },
})
export class LabCategoryComponent {
  readonly id = input<string>();
  readonly index = input('');
  readonly title = input('');
  readonly count = input<string>();
  readonly description = input('');
  readonly soon = input(false);
}
