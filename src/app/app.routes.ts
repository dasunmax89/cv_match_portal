import { Routes } from '@angular/router';
import { ApplicationLayoutComponent } from './layout/application-layout/application-layout.component';
import { LoginComponent } from './features/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: ApplicationLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      {
        path: 'recruiter/create',
        loadComponent: () => import('./features/recruiter/jd-upload/jd-upload.component').then(m => m.JdUploadComponent)
      },
      {
        path: 'recruiter/jobs',
        loadComponent: () => import('./features/recruiter/job-list/job-list.component').then(m => m.RecruiterJobListComponent)
      },
      {
        path: 'recruiter/jobs/:jobId',
        loadComponent: () => import('./features/recruiter/candidate-review/candidate-review.component').then(m => m.CandidateReviewComponent)
      },
      {
        path: 'apply',
        loadComponent: () => import('./features/candidate/job-board/job-board.component').then(m => m.JobBoardComponent)
      },
      {
        path: 'apply/:jobId',
        loadComponent: () => import('./features/candidate/apply/apply.component').then(m => m.ApplyComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
