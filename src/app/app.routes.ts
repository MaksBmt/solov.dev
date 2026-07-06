import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LabOverviewComponent } from './features/lab/lab-overview.component';
import { LiquidCursorComponent } from './features/lab/experiments/liquid-cursor/liquid-cursor.component';
import { MagneticButtonComponent } from './features/lab/experiments/magnetic-button/magnetic-button.component';
import { SpotlightComponent } from './features/lab/experiments/spotlight/spotlight.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'index.html', redirectTo: '', pathMatch: 'full' },
  { path: 'lab', component: LabOverviewComponent },
  { path: 'lab.html', redirectTo: 'lab', pathMatch: 'full' },
  { path: 'lab-liquid-cursor', component: LiquidCursorComponent },
  { path: 'lab-liquid-cursor.html', redirectTo: 'lab-liquid-cursor', pathMatch: 'full' },
  { path: 'lab-magnetic-button', component: MagneticButtonComponent },
  { path: 'lab-magnetic-button.html', redirectTo: 'lab-magnetic-button', pathMatch: 'full' },
  { path: 'lab-spotlight', component: SpotlightComponent },
  { path: 'lab-spotlight.html', redirectTo: 'lab-spotlight', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
