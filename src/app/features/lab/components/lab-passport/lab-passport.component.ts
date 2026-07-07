import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { passportLabels } from '../../data/experiments';

@Component({
  selector: 'app-lab-passport',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./lab-passport.component.scss'],
  templateUrl: './lab-passport.component.html',
})
export class LabPassportComponent {
  readonly passport = input<any>();

  getPassportKeys() {
    const data = this.passport();
    if (!data) return [];
    return Object.keys(passportLabels).filter((key) => data[key]);
  }

  getPassportLabel(key: string) {
    return (passportLabels as any)[key];
  }
}
