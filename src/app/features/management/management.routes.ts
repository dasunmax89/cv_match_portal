import { Routes } from '@angular/router';
import { ManagementLayout } from '../../layout/management-layout/management-layout.component';
import { Login } from './login/login.component';
import { Dashboard } from './dashboard/dashboard.component';

export const managementRoutes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: '',
    component: ManagementLayout,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        component: Dashboard
      }
    ]
  }
];
