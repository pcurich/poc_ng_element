import { Component } from '@angular/core';
import { CustomElementComponent } from './custom-element/custom-element.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CustomElementComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'poc-ng-element-zoneless-signals';
}