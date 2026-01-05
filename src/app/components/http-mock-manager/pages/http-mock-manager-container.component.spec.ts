import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpMockManagerContainerComponent } from './http-mock-manager-container.component';

describe('HttpMockManagerContainerComponent', () => {
  let component: HttpMockManagerContainerComponent;
  let fixture: ComponentFixture<HttpMockManagerContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HttpMockManagerContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HttpMockManagerContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
