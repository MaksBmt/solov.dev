import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../../layout/header/header.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { SectionHeroComponent } from './components/section-hero/section-hero.component';
import { PointerComponent } from '../../shared/components/pointer/pointer.component';
import { AmbientCanvasComponent } from '../../shared/components/ambient-canvas/ambient-canvas.component';
import { PageMetaService } from '../../core/services/page-meta.service';
import { getSitePage } from '../../core/config/site-pages.config';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, LayoutComponent, SectionHeroComponent, PointerComponent, AmbientCanvasComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  private readonly pageMeta = inject(PageMetaService);

  constructor() {
    const page = getSitePage('home');
    if (page) this.pageMeta.setPageMeta(page);
  }
}
