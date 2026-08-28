import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslationService, LanguageCode } from '../../core/i18n/translation.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-application-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './application-layout.component.html',
  styleUrls: ['./application-layout.component.css']
})
export class ApplicationLayoutComponent {
  translationService = inject(TranslationService);
  loadingService = inject(LoadingService);
  private router = inject(Router);

  sidebarOpen = false;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setLang(lang: LanguageCode): void {
    this.translationService.setLanguage(lang);
  }

  logout(): void {
    localStorage.removeItem('portal_token');
    localStorage.removeItem('portal_refresh_token');
    this.router.navigate(['/login']);
  }
}
