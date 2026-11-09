import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
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

  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }
  return next(req);
};
