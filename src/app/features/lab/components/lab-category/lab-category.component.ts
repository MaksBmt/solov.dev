import { Component, Input, HostBinding } from '@angular/core';

@Component({
  selector: 'app-lab-category',
  standalone: true,
  templateUrl: './lab-category.component.html',
  styleUrls: ['./lab-category.component.scss']
})
export class LabCategoryComponent {
  @Input() index: string = '';
  @Input() title: string = '';
  @Input() count?: string;
  @Input() description: string = '';
  @Input() @HostBinding('class.lab-category--soon') soon = false;

  @HostBinding('class.lab-category') isCategory = true;
}
