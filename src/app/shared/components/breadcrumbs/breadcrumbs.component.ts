import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  styleUrls: ['./breadcrumbs.component.scss'],
  templateUrl: './breadcrumbs.component.html'
})
export class BreadcrumbsComponent {
  @Input() items: { label: string, url?: string }[] = [];
}
