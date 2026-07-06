import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'ul[appLabActions]',
  standalone: true,
  templateUrl: './lab-actions.component.html',
  styleUrls: ['./lab-actions.component.scss']
})
export class LabActionsComponent {
  @HostBinding('class.lab-actions') isLabActions = true;
}
