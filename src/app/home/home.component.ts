// src/app/components/home/home.component.ts
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpMockManagerComponent } from '../components/http-mock-manager/http-mock-manager.component';
 

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink, HttpMockManagerComponent],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    title = 'poc-ng-element-zoneless-signals';
    mockSchema: any;
    context: any;
    // Método para manejar cuando se guarda un mock schema
    onMockSchemaSaved(mockSchema: any): void {
        // Handle mock schema saved
        this.mockSchema = mockSchema;
    }

    // Método para manejar cambios de contexto
    onContextChanged(context: any): void {
        // Handle context changed
        this.context = context;
    }
}