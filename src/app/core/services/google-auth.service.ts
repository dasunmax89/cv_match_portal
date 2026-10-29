import { Injectable, NgZone, inject } from '@angular/core';

declare const google: any;

export const GOOGLE_CLIENT_IDS = {
  candidate: '815503456637-a2kj8lehbf8j5tmkdrkfce9a9h41ajjf.apps.googleusercontent.com',
  recruiter: '815503456637-0fkf778rbkvtu6mkmgk1gkfn1ptjqhjg.apps.googleusercontent.com',
  management: '815503456637-knjbplcvv6jvv278efov1rdthat1aqs6.apps.googleusercontent.com'
} as const;

export type GoogleAuthRole = keyof typeof GOOGLE_CLIENT_IDS;

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private ngZone = inject(NgZone);

  getClientId(role: GoogleAuthRole): string {
    return GOOGLE_CLIENT_IDS[role];
  }

  /**
   * Waits for the Google Identity Services script to be available.
   */
  waitForGoogleScript(maxWaitMs = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        return resolve();
      }
      if (typeof google !== 'undefined' && google?.accounts) {
        return resolve();
      }
      const startTime = Date.now();
      const interval = setInterval(() => {
        if (typeof google !== 'undefined' && google?.accounts) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - startTime > maxWaitMs) {
          clearInterval(interval);
          reject(new Error('Google Identity Services SDK failed to load. Please check your network connection.'));
        }
      }, 50);
    });
  }

  /**
   * Initializes and renders the official Google Sign-In button into an HTML container.
   */
  async renderButton(
    container: HTMLElement,
    role: GoogleAuthRole,
    onSuccess: (credential: string) => void,
    options: Record<string, any> = {}
  ): Promise<void> {
    await this.waitForGoogleScript();
    const clientId = this.getClientId(role);

    google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        this.ngZone.run(() => {
          if (response?.credential) {
            onSuccess(response.credential);
          }
        });
      },
      auto_select: false,
      cancel_on_tap_outside: true
    });

    const defaultOptions = {
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: container.offsetWidth || 240,
      logo_alignment: 'left',
      ...options
    };

    google.accounts.id.renderButton(container, defaultOptions);
  }

  /**
   * Opens Google OAuth popup on demand for a custom button click.
   */
  async signInWithPopup(role: GoogleAuthRole): Promise<{ credential?: string; accessToken?: string }> {
    await this.waitForGoogleScript();
    const clientId = this.getClientId(role);

    return new Promise((resolve, reject) => {
      try {
        if (google.accounts?.oauth2?.initTokenClient) {
          const client = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'email profile openid',
            callback: (response: any) => {
              this.ngZone.run(() => {
                if (response?.error) {
                  reject(new Error(response.error_description || response.error));
                } else if (response?.access_token) {
                  resolve({ accessToken: response.access_token });
                } else {
                  reject(new Error('No token returned from Google.'));
                }
              });
            },
            error_callback: (err: any) => {
              this.ngZone.run(() => reject(err));
            }
          });
          client.requestAccessToken();
        } else {
          // Fallback to ID prompt
          google.accounts.id.initialize({
            client_id: clientId,
            callback: (response: any) => {
              this.ngZone.run(() => {
                if (response?.credential) {
                  resolve({ credential: response.credential });
                } else {
                  reject(new Error('Google authentication cancelled or failed.'));
                }
              });
            }
          });
          google.accounts.id.prompt();
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}
