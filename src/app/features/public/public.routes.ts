import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const publicRoutes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'jobs',
    loadComponent: () => import('./latest-jobs/latest-jobs.component').then(m => m.PublicLatestJobsComponent)
  }
];
