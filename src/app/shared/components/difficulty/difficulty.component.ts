import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { difficultyLabel, difficultyStars } from '../../../features/lab/data/experiments';

@Component({
  selector: 'app-difficulty',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./difficulty.component.scss'],
  templateUrl: './difficulty.component.html',
})
export class DifficultyComponent {
  readonly difficulty = input(0);

  getStars() {
    return difficultyStars(this.difficulty());
  }

  getLabel() {
    return difficultyLabel(this.difficulty());
  }
}
