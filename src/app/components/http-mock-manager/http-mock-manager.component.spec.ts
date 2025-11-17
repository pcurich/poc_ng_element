import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpMockManagerComponent } from './http-mock-manager.component';
import { HttpMockService } from '../../../core/services/HttpMockService';
import { HttpMockRepository } from '../../../core/repositories/HttpMockRepository';
import { ORMFactory } from '../../../core';

describe('HttpMockManagerComponent', () => {
  let component: HttpMockManagerComponent;
  let fixture: ComponentFixture<HttpMockManagerComponent>;
  let mockHttpMockService: jasmine.SpyObj<HttpMockService>;

  beforeEach(async () => {
    // Create mock service
    const httpMockServiceSpy = jasmine.createSpyObj('HttpMockService', [
      'initialize',
      'createMock',
      'deleteMock',
      'loadMocksByServiceCode',
      'exportMocks'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpMockManagerComponent,
        FormsModule
      ],
      providers: [
        { provide: HttpMockService, useValue: httpMockServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HttpMockManagerComponent);
    component = fixture.componentInstance;
    mockHttpMockService = TestBed.inject(HttpMockService) as jasmine.SpyObj<HttpMockService>;
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.contextId).toBe(1);
    expect(component.httpMethod).toBe('GET');
    expect(component.httpCodeResponseValue).toBe(200);
    expect(component.delayMs).toBe(1000);
    expect(component.showForm()).toBeTruthy();
  });

  it('should have correct context options', () => {
    expect(component.contextOptions.length).toBe(3);
    expect(component.contextOptions[0].value).toBe('---------');
    expect(component.contextOptions[1].value).toBe('Usar HTTP');
    expect(component.contextOptions[2].value).toBe('Usar Data');
  });

  it('should toggle form visibility', () => {
    const initialState = component.showForm();
    component.toggleForm();
    expect(component.showForm()).toBe(!initialState);
  });

  it('should change active tab', () => {
    component.setActiveTab(2);
    expect(component.activeTab()).toBe(2);
  });

  it('should add header correctly', () => {
    component.newHeaderKey.set('Content-Type');
    component.newHeaderValue.set('application/json');
    
    component.addHeader();
    
    expect(component.headers['Content-Type']).toBe('application/json');
    expect(component.newHeaderKey()).toBe('');
    expect(component.newHeaderValue()).toBe('');
  });

  it('should remove header correctly', () => {
    component.headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer token' };
    
    component.removeHeader('Content-Type');
    
    expect(component.headers['Content-Type']).toBeUndefined();
    expect(component.headers['Authorization']).toBe('Bearer token');
  });

  it('should handle context type change', () => {
    spyOn(component.contextTypeChangeEvent, 'emit');
    spyOn(component.reloadEvent, 'emit');
    
    component.onContextTypeChange('2');
    
    expect(component.selectedContext?.id).toBe(2);
    expect(component.contextTypeChangeEvent.emit).toHaveBeenCalled();
    expect(component.reloadEvent.emit).toHaveBeenCalled();
  });

  it('should handle file input change', async () => {
    const mockFile = new File(['{"contextId": 123}'], 'test.json', { type: 'application/json' });
    const event = { target: { files: [mockFile] } } as any;
    
    await component.onFileSelected(event);
    
    expect(component.contextId).toBe(123);
  });

  it('should create download link for config', () => {
    spyOn(document, 'createElement').and.callThrough();
    spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
    spyOn(URL, 'revokeObjectURL');
    
    component.nameMock = 'Test Mock';
    component.downloadConfig();
    
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(URL.createObjectURL).toHaveBeenCalled();
  });

  it('should validate form inputs for saving', () => {
    // Test empty name
    component.nameMock = '';
    component.url = 'http://test.com';
    
    // The disabled state should be checked in template
    expect(component.nameMock.trim()).toBeFalsy();
    
    // Test with valid inputs
    component.nameMock = 'Valid Mock';
    expect(component.nameMock.trim()).toBeTruthy();
    expect(component.url.trim()).toBeTruthy();
  });

  it('should handle drag and drop positioning', () => {
    const mockEvent = new MouseEvent('mousedown', {
      clientX: 100,
      clientY: 200
    });
    
    component.startDrag(mockEvent);
    
    // Simulate mouse move
    const moveEvent = new MouseEvent('mousemove', {
      clientX: 150,
      clientY: 250
    });
    
    document.dispatchEvent(moveEvent);
    
    // Position should be updated
    expect(component.position().right).toBeGreaterThanOrEqual(0);
    expect(component.position().bottom).toBeGreaterThanOrEqual(0);
  });
});