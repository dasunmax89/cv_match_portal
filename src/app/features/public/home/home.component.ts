import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

export interface HomeBanner {
  id: number;
  image: string;
  alt: string;
  title: string;
  tagline: string;
  category: string;
}

@Component({
  selector: 'app-public-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  private router = inject(Router);

  banners: HomeBanner[] = [
    {
      id: 1,
      image: 'banners/banner-1.jpg',
      alt: 'The right talent. The right opportunity. Magicmatch connects great people and ambitious teams using advanced AI.',
      title: 'The Right Talent. The Right Opportunity.',
      tagline: 'Smarter matching, faster hiring, and better career opportunities for everyone',
      category: 'Magicmatch AI Talent Engine'
    },
    {
      id: 2,
      image: 'banners/banner-2.jpg',
      alt: 'Connecting Southeast Asia\'s Top Software & Cloud Talent with Tech Leaders',
      title: 'Software & Cloud Engineering',
      tagline: 'High-growth opportunities for developers, cloud architects & DevOps',
      category: 'Information Technology'
    },
    {
      id: 3,
      image: 'banners/banner-3.jpg',
      alt: 'Empowering Banking, Finance & FinTech Professionals with High-Impact Roles',
      title: 'Banking, Finance & FinTech',
      tagline: 'Executive roles for financial analysts, CFA charterholders & risk officers',
      category: 'Banking & Finance'
    },
    {
      id: 4,
      image: 'banners/banner-4.jpg',
      alt: 'Connecting Healthcare Specialists & Medical Experts with Top Institutions',
      title: 'Healthcare & Clinical Specialists',
      tagline: 'Matching certified medical practitioners with premier institutions',
      category: 'Healthcare & Medical'
    }
  ];

  currentSlide = 0;
  private autoSlideTimer?: ReturnType<typeof setInterval>;
  isPaused = false;

  ngOnInit() {
    this.startAutoSlide();
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }

  startAutoSlide() {
    this.stopAutoSlide();
    this.autoSlideTimer = setInterval(() => {
      if (!this.isPaused) {
        this.nextSlide();
      }
    }, 5000);
  }

  stopAutoSlide() {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = undefined;
    }
  }

  pauseAutoSlide() {
    this.isPaused = true;
  }

  resumeAutoSlide() {
    this.isPaused = false;
  }

  nextSlide() {
    this.currentSlide = (this.currentSlide + 1) % this.banners.length;
  }

  prevSlide() {
    this.currentSlide = (this.currentSlide - 1 + this.banners.length) % this.banners.length;
  }

  goToSlide(index: number) {
    this.currentSlide = index;
  }

  onBannerClick() {
    this.router.navigate(['/public/jobs']);
  }

  navigateToCandidateLogin() {
    this.router.navigate(['/candidate/login']);
  }

  navigateToRecruiterLogin() {
    this.router.navigate(['/recruiter/login']);
  }

  navigateToManagementLogin() {
    this.router.navigate(['/management/login']);
  }

  navigateToCandidateOnboarding() {
    this.router.navigate(['/candidate/onboarding']);
  }

  navigateToCandidateJobs() {
    this.router.navigate(['/public/jobs']);
  }
}

