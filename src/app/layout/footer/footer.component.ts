import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlsComponent } from '../../shared/components/controls/controls.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, ControlsComponent],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {}
