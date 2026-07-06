import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExperimentCardComponent } from '../experiment-card/experiment-card.component';

@Component({
  selector: 'app-lab-gallery, ul[appLabGallery]',
  standalone: true,
  imports: [CommonModule, ExperimentCardComponent],
  styleUrls: ['./lab-gallery.component.scss'],
  templateUrl: './lab-gallery.component.html',
  host: {
    'class': 'lab-gallery'
  }
})
export class LabGalleryComponent {
  @Input() experiments: any[] = [];
  @Input() activeIndex: number = 0;
}
