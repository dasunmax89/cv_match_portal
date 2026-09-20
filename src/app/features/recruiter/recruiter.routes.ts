import { Routes } from '@angular/router';
import { RecruiterLayout } from '../../layout/recruiter-layout/recruiter-layout.component';
import { Login } from './login/login.component';
import { Onboarding } from './onboarding/onboarding.component';
import { recruiterAuthGuard } from '../../core/guards/partition-auth.guard';

export const recruiterRoutes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: '',
    component: RecruiterLayout,
    canActivate: [recruiterAuthGuard],
    children: [
      { path: '', redirectTo: 'jobs', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () => import('./company-profile/company-profile.component').then(m => m.CompanyProfileComponent)
      },
      {
        path: 'onboarding',
        component: Onboarding
      },
      {
        path: 'create',
        loadComponent: () => import('./jd-upload/jd-upload.component').then(m => m.JdUploadComponent)
      },
      {
        path: 'jobs',
        loadComponent: () => import('./job-list/job-list.component').then(m => m.RecruiterJobListComponent)
      },
      {
        path: 'jobs/:jobId/details',
        loadComponent: () => import('./job-detail/job-detail.component').then(m => m.JobDetailComponent)
      },
      {
        path: 'jobs/:jobId',
        loadComponent: () => import('./candidate-review/candidate-review.component').then(m => m.CandidateReviewComponent)
      }
    ]
  }
];
