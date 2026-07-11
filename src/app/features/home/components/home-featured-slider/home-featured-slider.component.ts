import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { getFeaturedExperiments } from '../../data/featured-experiments.config';
import { getCategory } from '../../../lab/data/experiments';
import { Experiment } from '../../../lab/models/experiment.model';

@Component({
  selector: 'app-home-featured-slider',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home-featured-slider.component.html',
  styleUrls: ['./home-featured-slider.component.scss'],
})
export class HomeFeaturedSliderComponent {
  readonly experiments = getFeaturedExperiments();
  readonly trackExperiments: Experiment[] = [...this.experiments, ...this.experiments];
  readonly paused = signal(false);

  categoryTitle(categorySlug: string): string {
    return getCategory(categorySlug)?.title ?? categorySlug;
  }

  onPointerEnter() {
    this.paused.set(true);
  }

  onPointerLeave() {
    this.paused.set(false);
  }
}
