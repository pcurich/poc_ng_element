import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DbMonitorComponentComponent } from './db.monitor.component';

describe('DbMonitorComponentComponent', () => {
  let component: DbMonitorComponentComponent;
  let fixture: ComponentFixture<DbMonitorComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DbMonitorComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DbMonitorComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
