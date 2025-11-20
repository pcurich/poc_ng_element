import { NgModule, CUSTOM_ELEMENTS_SCHEMA, DoBootstrap, ApplicationRef } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule implements DoBootstrap {

  ngDoBootstrap(appRef: ApplicationRef) {
    import('poc-ng-element').then(() => {
      appRef.bootstrap(AppComponent);
    });
  }
}
