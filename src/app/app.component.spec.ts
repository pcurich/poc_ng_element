import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;

  beforeEach(() => {
    component = new AppComponent();
  });

  it('debe inicializar el título correctamente', () => {
    expect(component.title).toBe('poc-ng-element-zoneless-signals');
  });

  it('debe asignar mockSchema al llamar onMockSchemaSaved', () => {
    const mock = { foo: 'bar' };
    component.onMockSchemaSaved(mock);
    expect(component.mockSchema).toEqual(mock);
  });

  it('debe asignar context al llamar onContextChanged', () => {
    const ctx = { id: 1 };
    component.onContextChanged(ctx);
    expect(component.context).toEqual(ctx);
  });
});
