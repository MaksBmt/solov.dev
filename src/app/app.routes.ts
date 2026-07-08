import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ProjectsComponent } from './features/projects/projects.component';
import { AboutComponent } from './features/about/about.component';
import { ContactComponent } from './features/contact/contact.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, data: { pageKey: 'home' } },
  { path: 'index.html', redirectTo: '', pathMatch: 'full' },
  { path: 'projects', component: ProjectsComponent, data: { pageKey: 'projects' } },
  { path: 'about', component: AboutComponent, data: { pageKey: 'about' } },
  { path: 'contact', component: ContactComponent, data: { pageKey: 'contact' } },
  {
    path: 'lab',
    loadChildren: () => import('./features/lab/lab.routes').then((m) => m.getLabRoutes()),
  },
  { path: 'lab.html', redirectTo: 'lab', pathMatch: 'full' },
  { path: 'lab-magnetic-button', redirectTo: 'lab/cursor/magnetic-button', pathMatch: 'full' },
  { path: 'lab-magnetic-button.html', redirectTo: 'lab/cursor/magnetic-button', pathMatch: 'full' },
  { path: 'lab-spotlight', redirectTo: 'lab/cursor/spotlight', pathMatch: 'full' },
  { path: 'lab-spotlight.html', redirectTo: 'lab/cursor/spotlight', pathMatch: 'full' },
  { path: 'lab-liquid-cursor', redirectTo: 'lab/cursor/liquid-cursor', pathMatch: 'full' },
  { path: 'lab-liquid-cursor.html', redirectTo: 'lab/cursor/liquid-cursor', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
