import { Routes } from '@angular/router';
import { ManagementLayout } from '../../layout/management-layout/management-layout.component';
import { Login } from './login/login.component';
import { Dashboard } from './dashboard/dashboard.component';
import { managementAuthGuard } from '../../core/guards/partition-auth.guard';

export const managementRoutes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: '',
    component: ManagementLayout,
    canActivate: [managementAuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: Dashboard
      }
    ]
  }
];
