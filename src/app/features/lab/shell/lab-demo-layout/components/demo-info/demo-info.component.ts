import { Component, Input, HostBinding } from '@angular/core';
import { DifficultyComponent } from '../../../../../../shared/components/difficulty/difficulty.component';
import { TechTagsComponent } from '../../../../../../shared/components/tech-tags/tech-tags.component';

@Component({
  selector: 'div[appDemoInfo]',
  standalone: true,
  imports: [DifficultyComponent, TechTagsComponent],
  templateUrl: './demo-info.component.html',
  styleUrls: ['./demo-info.component.scss']
})
export class DemoInfoComponent {
  @Input() title: string = '';
  @Input() description: string = '';
  @Input() difficulty: number = 0;
  @Input() techTags: string[] = [];
  
  @HostBinding('class.demo-info') isDemoInfo = true;
}
