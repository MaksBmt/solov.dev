import { Component, HostBinding } from '@angular/core';

@Component({
  selector: 'ul[appLabActions]',
  standalone: true,
  templateUrl: './lab-actions.component.html',
})
export class LabActionsComponent {
  @HostBinding('class.lab-actions') isLabActions = true;
}
