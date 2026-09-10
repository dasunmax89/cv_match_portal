import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'candidate',
    loadChildren: () => import('./features/candidate/candidate.routes').then(m => m.candidateRoutes)
  },
  {
    path: 'recruiter',
    loadChildren: () => import('./features/recruiter/recruiter.routes').then(m => m.recruiterRoutes)
  },
  {
    path: 'management',
    loadChildren: () => import('./features/management/management.routes').then(m => m.managementRoutes)
  },
  {
    path: '',
    redirectTo: 'candidate',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'candidate'
  }
];
