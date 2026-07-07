import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'header[appLabTopbar]',
  standalone: true,
  templateUrl: './lab-topbar.component.html',
  styleUrls: ['./lab-topbar.component.scss']
})
export class LabTopbarComponent {
  @HostBinding('class.lab-topbar') isTopbar = true;
}
