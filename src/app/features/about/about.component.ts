import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from '../../layout/header/header.component';
import { FooterComponent } from '../../layout/footer/footer.component';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { TitleComponent } from '../../shared/components/title/title.component';
import { PageMetaService } from '../../core/services/page-meta.service';
import { getSitePage } from '../../core/config/site-pages.config';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, LayoutComponent, TitleComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements OnInit {
  title = 'About';
  lead = 'Раздел в разработке — здесь появится информация об опыте и подходе.';

  constructor(private pageMeta: PageMetaService) {}

  ngOnInit(): void {
    const page = getSitePage('about');
    if (page) this.pageMeta.setPageMeta(page);
  }
}
