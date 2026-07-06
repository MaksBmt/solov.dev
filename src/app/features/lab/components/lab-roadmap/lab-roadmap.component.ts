import { Component, Input, HostBinding } from '@angular/core';

@Component({
  selector: 'ul[appLabRoadmap]',
  standalone: true,
  templateUrl: './lab-roadmap.component.html',
  styleUrls: ['./lab-roadmap.component.scss']
})
export class LabRoadmapComponent {
  @Input() categories: any[] = [];
  @HostBinding('class.lab-roadmap') isRoadmap = true;
}
