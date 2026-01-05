import { Component } from '@angular/core';
import { ContextSelectorComponent } from '../components/context-selector/context-selector.component';

@Component({
  selector: 'app-http-mock-manager-container',
  imports: [ContextSelectorComponent],
  standalone: true,
  templateUrl: './http-mock-manager-container.component.html',
  styleUrl: './http-mock-manager-container.component.scss',
})
export class HttpMockManagerContainerComponent {

}
