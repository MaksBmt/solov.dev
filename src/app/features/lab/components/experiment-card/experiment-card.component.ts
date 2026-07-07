import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DifficultyComponent } from '../../../../shared/components/difficulty/difficulty.component';
import { TechTagsComponent } from '../../../../shared/components/tech-tags/tech-tags.component';

@Component({
  selector: 'app-experiment-card',
  standalone: true,
  imports: [CommonModule, RouterModule, DifficultyComponent, TechTagsComponent],
  templateUrl: './experiment-card.component.html',
  styleUrls: ['./experiment-card.component.scss'],
})
export class ExperimentCardComponent {
  readonly experiment = input<any>();
}
