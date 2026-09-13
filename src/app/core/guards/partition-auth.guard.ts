import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const candidateAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isCandidateLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/candidate/login']);
};

export const recruiterAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isRecruiterLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/recruiter/login']);
};

export const managementAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isManagementLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/management/login']);
};
