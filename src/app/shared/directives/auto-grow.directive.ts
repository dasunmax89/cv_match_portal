import { Directive, ElementRef, HostListener, AfterViewInit, AfterViewChecked } from '@angular/core';

@Directive({
  selector: 'textarea[appAutoGrow], textarea[autoGrow]',
  standalone: true
})
export class AutoGrowDirective implements AfterViewInit, AfterViewChecked {
  private lastScrollHeight = 0;

  constructor(private el: ElementRef<HTMLTextAreaElement>) {}

  ngAfterViewInit() {
    this.adjust();
  }

  ngAfterViewChecked() {
    const textarea = this.el.nativeElement;
    if (textarea && textarea.scrollHeight !== this.lastScrollHeight) {
      this.adjust();
    }
  }

  @HostListener('input')
  onInput() {
    this.adjust();
  }

  @HostListener('focus')
  onFocus() {
    this.adjust();
  }

  public adjust() {
    const textarea = this.el.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
      const minHeight = 80;
      const targetHeight = Math.max(minHeight, textarea.scrollHeight);
      textarea.style.height = `${targetHeight}px`;
      this.lastScrollHeight = textarea.scrollHeight;
    }
  }
}
