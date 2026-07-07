import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { passportLabels } from '../../data/experiments';

@Component({
  selector: 'app-lab-passport',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./lab-passport.component.scss'],
  templateUrl: './lab-passport.component.html'
})
export class LabPassportComponent {
  @Input() passport: any;

  getPassportKeys() {
    if (!this.passport) return [];
    return Object.keys(passportLabels).filter(key => this.passport[key]);
  }

  getPassportLabel(key: string) {
    return (passportLabels as any)[key];
  }
}
