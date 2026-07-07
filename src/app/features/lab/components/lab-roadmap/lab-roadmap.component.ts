import { Component, input } from '@angular/core';

@Component({
  selector: 'ul[appLabRoadmap]',
  standalone: true,
  templateUrl: './lab-roadmap.component.html',
  styleUrls: ['./lab-roadmap.component.scss'],
  host: {
    class: 'lab-roadmap',
  },
})
export class LabRoadmapComponent {
  readonly categories = input<any[]>([]);
}
