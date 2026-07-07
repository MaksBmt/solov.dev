import { Component, input } from '@angular/core';
import { DifficultyComponent } from '../../../../../../shared/components/difficulty/difficulty.component';
import { TechTagsComponent } from '../../../../../../shared/components/tech-tags/tech-tags.component';

@Component({
  selector: 'div[appDemoInfo]',
  standalone: true,
  imports: [DifficultyComponent, TechTagsComponent],
  templateUrl: './demo-info.component.html',
  styleUrls: ['./demo-info.component.scss'],
  host: {
    class: 'demo-info',
  },
})
export class DemoInfoComponent {
  readonly title = input('');
  readonly description = input('');
  readonly difficulty = input(0);
  readonly techTags = input<string[]>([]);
}
