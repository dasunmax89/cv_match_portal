import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/public/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'public',
    loadChildren: () => import('./features/public/public.routes').then(m => m.publicRoutes)
  },
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
    path: '**',
    redirectTo: ''
  }
];
