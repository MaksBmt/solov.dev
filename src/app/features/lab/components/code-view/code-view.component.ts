import { Component, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { MarkComponent } from '../../../../shared/components/mark/mark.component';

@Component({
  selector: 'app-code-view',
  standalone: true,
  imports: [CommonModule, ButtonComponent, MarkComponent],
  styleUrls: ['./code-view.component.scss'],
  templateUrl: './code-view.component.html'
})
export class CodeViewComponent {
  @Input() codeName: string = '';
  @Input() sourceCode: string = '';
  @Input() codeLines: {text: string, key?: string, highlight: boolean}[] = [];
  @Input() hidden: boolean = true;

  @ViewChild('copyBtn') copyBtnRef!: ElementRef<HTMLButtonElement>;
  
  copyText = 'COPY';

  async copyCode() {
    const text = this.codeLines.length > 0 ? this.codeLines.map(l => l.text).join('\n') : this.sourceCode;
    try {
      await navigator.clipboard.writeText(text);
      this.copyText = 'COPIED';
      setTimeout(() => {
        this.copyText = 'COPY';
      }, 2000);
    } catch (e) {}
  }
}
