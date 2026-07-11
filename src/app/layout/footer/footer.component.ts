import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlsComponent } from '../../shared/components/controls/controls.component';
import { HomeFeaturedSliderComponent } from '../../features/home/components/home-featured-slider/home-featured-slider.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, ControlsComponent, HomeFeaturedSliderComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  readonly variant = input<'home' | 'section'>('section', { alias: 'type' });
}
