import { Component, Input, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-custom-element',
  standalone: true,
  template: `
    <div class="custom-element">
      <div class="header">
        <h3>👋 Hola, {{ name }}!</h3>
      </div>
      <div class="content">
        <p class="message">{{ message }}</p>
        <div class="info">
          <small>Creado con Angular Elements v{{ angularVersion() }} 🚀</small>
          <br>
          <small>Usando Signals y sin Zone.js</small>
        </div>
        <div class="actions">
          <button (click)="onClick()" class="btn">Hacer click</button>
          <span class="counter">Clicks: {{ clickCount() }}</span>
        </div>
        <div class="computed-info">
          <small>{{ displayInfo() }}</small>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-element {
      border: 2px solid #1976d2;
      border-radius: 8px;
      margin: 10px;
      padding: 15px;
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .custom-element:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }
    
    .header {
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 15px;
      padding-bottom: 10px;
    }
    
    .header h3 {
      margin: 0;
      color: #1976d2;
      font-size: 1.2em;
    }
    
    .content {
      text-align: left;
    }
    
    .message {
      color: #333;
      margin: 10px 0;
      font-size: 1em;
      line-height: 1.4;
    }
    
    .info {
      margin: 10px 0;
    }
    
    .info small {
      color: #666;
      font-style: italic;
    }
    
    .actions {
      display: flex;
      align-items: center;
      gap: 15px;
      margin: 15px 0;
    }
    
    .btn {
      background: linear-gradient(135deg, #1976d2, #1565c0);
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9em;
      font-weight: 500;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(25, 118, 210, 0.3);
    }
    
    .btn:hover {
      background: linear-gradient(135deg, #1565c0, #0d47a1);
      box-shadow: 0 4px 8px rgba(25, 118, 210, 0.4);
      transform: translateY(-1px);
    }
    
    .btn:active {
      transform: scale(0.98);
    }
    
    .counter {
      font-weight: bold;
      color: #1976d2;
      padding: 6px 12px;
      background: linear-gradient(135deg, #e3f2fd, #bbdefb);
      border-radius: 6px;
      font-size: 0.9em;
      border: 1px solid #90caf9;
    }
    
    .computed-info {
      margin-top: 10px;
      padding: 8px;
      background: #f0f4f8;
      border-radius: 4px;
      border-left: 3px solid #1976d2;
    }
    
    .computed-info small {
      color: #1976d2;
      font-weight: 500;
    }
  `]
})
export class CustomElementComponent implements OnInit, OnChanges {
  @Input() name: string = 'Mundo';
  @Input() message: string = '¡Este es un custom element de Angular sin Zone.js!';
  
  // Signals para el estado del componente
  clickCount = signal(0);
  angularVersion = signal('19');
  
  // Signal computed para mostrar información dinámica
  displayInfo = computed(() => 
    `Info: ${this.name} - Total clicks: ${this.clickCount()} - Timestamp: ${new Date().toLocaleTimeString()}`
  );

  constructor() {
    // Effect para reaccionar a cambios en clickCount
    effect(() => {
      const count = this.clickCount();
      if (count > 0) {
        console.log(`🎯 Signal effect triggered: Click count changed to ${count}`);
        
        // Ejemplo de reactividad con signals
        if (count === 5) {
          console.log('🎉 ¡Llegaste a 5 clicks! Los signals están funcionando perfectamente.');
        }
      }
    });
  }
  
  ngOnInit(): void {
    console.log('🚀 Custom element initialized:', { name: this.name, message: this.message });
    console.log('✅ Signals initialized without Zone.js');
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    console.log('🔄 Custom element properties changed:', changes);
  }
  
  onClick(): void {
    // Actualizar el signal de forma reactiva
    this.clickCount.update(count => count + 1);
    
    const currentCount = this.clickCount();
    console.log(`🎯 Button clicked! Count: ${currentCount}`);
    console.log(`📊 Display info: ${this.displayInfo()}`);
    
    // Emitir evento personalizado
    const customEvent = new CustomEvent('elementClicked', {
      detail: {
        name: this.name,
        message: this.message,
        clickCount: currentCount,
        timestamp: new Date().toISOString(),
        signalsActive: true,
        zoneless: true
      },
      bubbles: true
    });
    
    // Despachar el evento desde el elemento host
    if (typeof window !== 'undefined') {
      const hostElement = document.querySelector('my-custom-element');
      if (hostElement) {
        hostElement.dispatchEvent(customEvent);
      }
    }
  }
}