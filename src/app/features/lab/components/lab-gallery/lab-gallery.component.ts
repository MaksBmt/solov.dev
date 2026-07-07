import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExperimentCardComponent } from '../experiment-card/experiment-card.component';

@Component({
  selector: 'app-lab-gallery, ul[appLabGallery]',
  standalone: true,
  imports: [CommonModule, ExperimentCardComponent],
  styleUrls: ['./lab-gallery.component.scss'],
  templateUrl: './lab-gallery.component.html',
  host: {
    class: 'lab-gallery',
  },
})
export class LabGalleryComponent {
  readonly experiments = input<any[]>([]);
  readonly activeIndex = input(0);
}
