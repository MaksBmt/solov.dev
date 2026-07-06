import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent {
  @Input() @HostBinding('class.layout--fullscreen') fullscreen = false;
  @Input() @HostBinding('class.layout--page') page = false;
  
  @HostBinding('class.layout') isLayout = true;
}
