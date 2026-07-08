import { Routes } from '@angular/router';
import { LabOverviewComponent } from './lab-overview.component';
import { LabCategoryPageComponent } from './lab-category-page.component';
import { buildExperimentRoutes } from './data/experiment-loaders';

export function getLabRoutes(): Routes {
  return [
    { path: '', component: LabOverviewComponent, data: { pageKey: 'lab' } },
    ...buildExperimentRoutes(),
    { path: ':category', component: LabCategoryPageComponent, data: { pageKey: 'lab-category' } },
  ];
}

export const labRoutes: Routes = getLabRoutes();
