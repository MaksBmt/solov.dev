import { Component, PLATFORM_ID, inject, input, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { MarkComponent } from '../../../../shared/components/mark/mark.component';

@Component({
  selector: 'app-code-view',
  standalone: true,
  imports: [CommonModule, ButtonComponent, MarkComponent],
  styleUrls: ['./code-view.component.scss'],
  templateUrl: './code-view.component.html',
})
export class CodeViewComponent {
  private readonly platformId = inject(PLATFORM_ID);

  readonly codeName = input('');
  readonly sourceCode = input('');
  readonly codeLines = input<{ text: string; key?: string; highlight: boolean }[]>([]);
  readonly hidden = input(true);

  readonly copyText = signal('COPY');

  async copyCode() {
    if (!isPlatformBrowser(this.platformId)) return;

    const lines = this.codeLines();
    const text = lines.length > 0 ? lines.map((l) => l.text).join('\n') : this.sourceCode();
    try {
      await navigator.clipboard.writeText(text);
      this.copyText.set('COPIED');
      setTimeout(() => {
        this.copyText.set('COPY');
      }, 2000);
    } catch {
      // clipboard unavailable
    }
  }
}
