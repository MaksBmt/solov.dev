import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'div[appDemoLayout]',
  standalone: true,
  templateUrl: './demo-layout.component.html',
  styleUrls: ['./demo-layout.component.scss']
})
export class DemoLayoutComponent {
  @HostBinding('class.demo-layout') isDemoLayout = true;
}
