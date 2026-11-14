import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  let token = localStorage.getItem('portal_token');

  // Resilient fallback to inspect stored user objects if portal_token is not directly set
  if (!token) {
    try {
      const recruiter = JSON.parse(localStorage.getItem('recruiter_user') || 'null');
      token = recruiter?.token || recruiter?.access_token || null;
    } catch {}
  }
  if (!token) {
    try {
      const candidate = JSON.parse(localStorage.getItem('candidate_user') || 'null');
      token = candidate?.token || candidate?.access_token || null;
    } catch {}
  }
  if (!token) {
    try {
      const management = JSON.parse(localStorage.getItem('management_user') || 'null');
      token = management?.token || management?.access_token || null;
    } catch {}
  }

  const finalReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(finalReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login') && !req.url.includes('/auth/google')) {
        const path = window.location.pathname;
        if (path.startsWith('/recruiter') && !path.includes('/login')) {
          localStorage.removeItem('recruiter_user');
          localStorage.removeItem('portal_token');
          router.navigate(['/recruiter/login'], { queryParams: { expired: 'true' } });
        } else if (path.startsWith('/candidate') && !path.includes('/login')) {
          localStorage.removeItem('candidate_user');
          localStorage.removeItem('portal_token');
          router.navigate(['/candidate/login'], { queryParams: { expired: 'true' } });
        } else if (path.startsWith('/management') && !path.includes('/login')) {
          localStorage.removeItem('management_user');
          localStorage.removeItem('portal_token');
          router.navigate(['/management/login'], { queryParams: { expired: 'true' } });
        }
      }
      return throwError(() => error);
    })
  );
};
