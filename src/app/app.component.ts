import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="app-container">
      <h2>🚀 Aplicación Angular Zoneless con Signals</h2>
      <p>Esta aplicación usa Angular Elements sin Zone.js y con Signals</p>
      <div class="features">
        <h3>Características:</h3>
        <ul>
          <li>✅ Sin Zone.js (Zoneless)</li>
          <li>✅ Angular Signals</li>
          <li>✅ Módulos (No Standalone)</li>
          <li>✅ Custom Elements</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      text-align: center;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      margin: 20px auto;
      max-width: 700px;
      color: white;
    }
    
    h2 {
      color: white;
      margin-bottom: 15px;
      font-size: 1.8em;
    }
    
    p {
      color: rgba(255,255,255,0.9);
      margin-bottom: 20px;
      font-size: 1.1em;
    }
    
    .features {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }
    
    .features h3 {
      color: white;
      margin-bottom: 10px;
    }
    
    .features ul {
      text-align: left;
      display: inline-block;
    }
    
    .features li {
      color: rgba(255,255,255,0.9);
      margin: 5px 0;
      font-size: 0.95em;
    }
  `]
})
export class AppComponent {
  title = 'poc-ng-element-zoneless-signals';
}