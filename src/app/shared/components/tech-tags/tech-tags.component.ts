import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tech-tags',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./tech-tags.component.scss'],
  templateUrl: './tech-tags.component.html'
})
export class TechTagsComponent {
  @Input() tags: string[] = [];
}
