import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  // Authentication requirement removed — allow direct access to all ML suite features
  return true;
};
