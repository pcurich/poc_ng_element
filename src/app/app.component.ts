import { Component } from '@angular/core';
import { HttpMockManagerComponent } from './components/index';
import { DbMonitorComponent } from "./admin/debug/db.monitor/db.monitor.component";
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'poc-ng-element-zoneless-signals';
  mockSchema: any;
  context: any;


}