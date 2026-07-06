import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'ul[appLabCatalog]',
  standalone: true,
  templateUrl: './lab-catalog.component.html',
  styleUrls: ['./lab-catalog.component.scss']
})
export class LabCatalogComponent {
  @HostBinding('class.lab-catalog') isCatalog = true;
}
