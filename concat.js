const fs = require('fs-extra');
const path = require('path');

/**
 * Script para concatenar los archivos JavaScript generados por Angular
 * y crear un único archivo que contenga el custom element
 */
async function buildElements() {
  const distPath = path.join(__dirname, 'dist', 'browser');
  const outputPath = path.join(__dirname, 'dist', 'elements');
  
  // Crear directorio de salida si no existe
  await fs.ensureDir(outputPath);
  
  // Archivos a concatenar (en orden) - Angular 20+ Application Builder
  const files = [
    path.join(distPath, 'main.js')
  ];
  
  // Filtrar solo los archivos que existen
  const existingFiles = [];
  for (const file of files) {
    if (await fs.pathExists(file)) {
      existingFiles.push(file);
    }
  }
  
  if (existingFiles.length === 0) {
    console.error('No se encontraron archivos para concatenar. Asegúrate de ejecutar "ng build" primero.');
    process.exit(1);
  }
  
  // Concatenar archivos
  const outputFile = path.join(outputPath, 'http-mock-manager.js');
  
  // Leer y concatenar todos los archivos
  let concatenatedContent = '';
  for (const file of existingFiles) {
    const content = await fs.readFile(file, 'utf8');
    concatenatedContent += content + '\n';
  }
  
  // Escribir el archivo concatenado
  await fs.writeFile(outputFile, concatenatedContent);
  
  console.log(`✅ Custom element creado exitosamente: ${outputFile}`);
  console.log(`📁 Tamaño del archivo: ${(await fs.stat(outputFile)).size} bytes`);
  
  // Crear archivo HTML de ejemplo
  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Custom Element Example</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .example-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
            background: #fafafa;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Angular Custom Element Demo</h1>
        <p>Este archivo demuestra cómo usar el custom element creado con Angular Elements.</p>
        
        <div class="example-section">
            <h3>Ejemplo 1: Uso básico</h3>
            <http-mock-manager></http-mock-manager>
        </div>
        
        <div class="example-section">
            <h3>Ejemplo 2: Diferentes propiedades</h3>
            <http-mock-manager></http-mock-manager>
        </div>
        
        <div class="example-section">
            <h3>Ejemplo 3: Creación dinámica</h3>
            <button onclick="createDynamicElement()">Crear elemento dinámicamente</button>
            <div id="dynamic-container"></div>
        </div>
    </div>

    <!-- Cargar el custom element -->
    <script src="http-mock-manager.js"></script>
    
    <script>
        // Escuchar eventos del custom element
        document.addEventListener('elementClicked', function(event) {
            console.log('🎉 Evento recibido:', event.detail);
            alert(\`Elemento clickeado: \${event.detail.name} (Click #\${event.detail.clickCount})\`);
        });
        
        // Función para crear elementos dinámicamente
        function createDynamicElement() {
            const container = document.getElementById('dynamic-container');
            const element = document.createElement('http-mock-manager');
            element.setAttribute('name', 'Dinámico ' + Date.now());
            element.setAttribute('message', 'Creado en: ' + new Date().toLocaleString());
            container.appendChild(element);
        }
    </script>
</body>
</html>`;
  
  const htmlFile = path.join(outputPath, 'example.html');
  await fs.writeFile(htmlFile, htmlContent);
  
  console.log(`✅ Archivo de ejemplo creado: ${htmlFile}`);
  console.log(`\n🎯 Para probar el custom element:`);
  console.log(`   1. Abre: ${htmlFile}`);
  console.log(`   2. O sirve con: npm run serve:elements`);
}

buildElements().catch(err => {
  console.error('❌ Error al construir elementos:', err);
  process.exit(1);
});