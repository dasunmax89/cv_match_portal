import { Routes } from '@angular/router';
import { CandidateLayout } from '../../layout/candidate-layout/candidate-layout.component';
import { Login } from './login/login.component';
import { Onboarding } from './onboarding/onboarding.component';
import { candidateAuthGuard } from '../../core/guards/partition-auth.guard';

export const candidateRoutes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('../shared/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
    data: { role: 'candidate' }
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent)
  },

  {
    path: '',
    component: CandidateLayout,
    canActivate: [candidateAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./job-board/job-board.component').then(m => m.JobBoardComponent)
      },
      {
        path: 'applied-jobs',
        loadComponent: () => import('./applied-jobs/applied-jobs.component').then(m => m.CandidateAppliedJobsComponent)
      },
      {
        path: 'onboarding',
        component: Onboarding
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'apply/:jobId',
        loadComponent: () => import('./apply/apply.component').then(m => m.ApplyComponent)
      }
    ]
  }
];
