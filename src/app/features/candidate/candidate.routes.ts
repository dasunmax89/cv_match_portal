import { Routes } from '@angular/router';
import { CandidateLayout } from '../../layout/candidate-layout/candidate-layout.component';
import { Login } from './login/login.component';
import { Onboarding } from './onboarding/onboarding.component';

export const candidateRoutes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'onboarding',
    component: Onboarding
  },
  {
    path: '',
    component: CandidateLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./job-board/job-board.component').then(m => m.JobBoardComponent)
      },
      {
        path: 'apply/:jobId',
        loadComponent: () => import('./apply/apply.component').then(m => m.ApplyComponent)
      }
    ]
  }
];
