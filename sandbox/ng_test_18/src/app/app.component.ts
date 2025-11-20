import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import 'poc-ng-element';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ng_test_18';
}
