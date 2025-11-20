/**
 * 🧪 Test de ORMFactory en ng_test_16
 *
 * Este archivo prueba las funciones de ORMFactory para buscar mocks
 * desde IndexedDB en el proyecto ng_test_16 (Angular 16)
 */

import { ORMFactory, IHttpMockData } from 'poc-ng-element/src/core';

/**
 * Test: Buscar mocks por serviceCode
 */
export async function testFindByServiceCode(serviceCode: string): Promise<void> {
  console.log(`\n🧪 Test: Buscar mocks por serviceCode = "${serviceCode}"`);

  try {
    const mocks: IHttpMockData[] = await ORMFactory.findMocksByServiceCode(serviceCode);

    console.log(`✅ Encontrados ${mocks.length} mocks para "${serviceCode}"`);

    mocks.forEach((mock, index) => {
      console.log(`\n📋 Mock ${index + 1}:`);
      console.log(`  ID: ${mock.id}`);
      console.log(`  Nombre: ${mock.name}`);
      console.log(`  URL: ${mock.url}`);
      console.log(`  Método: ${mock.method}`);
      console.log(`  Status: ${mock.httpCodeResponseValue}`);
      console.log(`  Delay: ${mock.delayMs}ms`);
      console.log(`  Response preview: ${mock.responseBody.substring(0, 100)}...`);
    });

    return;
  } catch (error) {
    console.error('❌ Error al buscar mocks por serviceCode:', error);
    throw error;
  }
}

/**
 * Test: Buscar mocks por URL
 */
export async function testFindByUrl(url: string): Promise<void> {
  console.log(`\n🧪 Test: Buscar mocks por url = "${url}"`);

  try {
    const mocks: IHttpMockData[] = await ORMFactory.findMocksByUrl(url);

    console.log(`✅ Encontrados ${mocks.length} mocks para "${url}"`);

    mocks.forEach((mock, index) => {
      console.log(`\n📋 Mock ${index + 1}:`);
      console.log(`  ID: ${mock.id}`);
      console.log(`  Service Code: ${mock.serviceCode}`);
      console.log(`  Método: ${mock.method}`);
      console.log(`  Status: ${mock.httpCodeResponseValue}`);

      if (mock.headers) {
        console.log(`  Headers:`, mock.headers);
      }
    });

    return;
  } catch (error) {
    console.error('❌ Error al buscar mocks por URL:', error);
    throw error;
  }
}

/**
 * Test: Simulación completa de petición HTTP
 */
export async function testHttpMockSimulation(
  serviceCode: string,
  url: string,
  method: string
): Promise<any> {
  console.log(`\n🧪 Test: Simulación HTTP ${method} ${url}`);

  try {
    // Buscar mocks por serviceCode
    const mocks = await ORMFactory.findMocksByServiceCode(serviceCode);

    // Encontrar el mock que coincida
    const matchingMock = mocks.find(m =>
      m.url === url && m.method.toUpperCase() === method.toUpperCase()
    );

    if (!matchingMock) {
      console.log('⚠️ No se encontró mock para esta petición');
      return null;
    }

    console.log('🎭 Mock encontrado, simulando respuesta...');

    // Simular delay
    if (matchingMock.delayMs > 0) {
      console.log(`⏳ Esperando ${matchingMock.delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, matchingMock.delayMs));
    }

    // Parsear y retornar respuesta
    const response = {
      status: matchingMock.httpCodeResponseValue,
      headers: matchingMock.headers || {},
      body: JSON.parse(matchingMock.responseBody)
    };

    console.log('✅ Respuesta mockeada:', response);
    return response;

  } catch (error) {
    console.error('❌ Error al simular petición:', error);
    throw error;
  }
}

/**
 * Test completo: Ejecuta todos los tests
 */
export async function runAllTests(): Promise<void> {
  console.log('🚀 Iniciando tests de ORMFactory en ng_test_16\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Buscar por serviceCode
    await testFindByServiceCode('userService');

    console.log('\n' + '='.repeat(60));

    // Test 2: Buscar por URL
    await testFindByUrl('/api/users/:id');

    console.log('\n' + '='.repeat(60));

    // Test 3: Simulación completa
    await testHttpMockSimulation('userService', '/api/users/:id', 'GET');

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Todos los tests completados exitosamente');

  } catch (error) {
    console.error('\n❌ Error ejecutando tests:', error);
  } finally {
    // Limpiar conexión
    console.log('\n🧹 Cerrando conexión a la base de datos...');
    await ORMFactory.closeDbContext();
    console.log('✅ Conexión cerrada');
  }
}

// Exportar para uso en componentes
export const ORMFactoryTests = {
  testFindByServiceCode,
  testFindByUrl,
  testHttpMockSimulation,
  runAllTests
};
