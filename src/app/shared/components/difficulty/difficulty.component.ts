import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { difficultyLabel, difficultyStars } from '../../../core/utils/experiments';

@Component({
  selector: 'app-difficulty',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./difficulty.component.scss'],
  templateUrl: './difficulty.component.html'
})
export class DifficultyComponent {
  @Input() difficulty: number = 0;

  getStars() {
    return difficultyStars(this.difficulty);
  }

  getLabel() {
    return difficultyLabel(this.difficulty);
  }
}
