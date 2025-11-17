import { Component, Input, OnInit, OnChanges, SimpleChanges, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-custom-element',
  standalone: true,
  templateUrl: './custom-element.component.html',
  styleUrls: ['./custom-element.component.scss']
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