import { Component } from '@angular/core';
import { ORMFactory } from 'poc-ng-element/core';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ng_test_16';
  constructor() {
    // this.testOrmMethods().then(() => {
    //   console.log('ORM methods tested successfully.');
    // }).catch(err => {
    //   console.error('Error testing ORM methods:', err);
    // });
  }

  async testOrmMethods(): Promise<void> {
    console.log('ORMFactory:', ORMFactory);
    const mocks = await ORMFactory.findMocksByServiceCode('userService');
    console.log('Mocks encontrados por serviceCode "userService":', mocks);

    const urlMocks = await ORMFactory.findMocksByUrl('/api/users/:id');
    console.log('Mocks encontrados por URL "/api/users/:id":', urlMocks);
  }
}
