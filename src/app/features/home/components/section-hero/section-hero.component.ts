import { Component, HostBinding } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TitleComponent } from '../../../../shared/components/title/title.component';
import { HighlightComponent } from '../../../../shared/components/highlight/highlight.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { MarkComponent } from '../../../../shared/components/mark/mark.component';

@Component({
  selector: 'app-section-hero',
  standalone: true,
  imports: [RouterModule, TitleComponent, HighlightComponent, ButtonComponent, MarkComponent],
  templateUrl: './section-hero.component.html',
  styleUrls: ['./section-hero.component.scss']
})
export class SectionHeroComponent {
  @HostBinding('class.section-hero') isSectionHero = true;
}
