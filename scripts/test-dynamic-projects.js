#!/usr/bin/env node

/**
 * Script de prueba para la funcionalidad de creación dinámica de proyectos
 */

import { findOrCreateProjectByWorkspace, getProjects } from '../src/utils/todoist-client.js';

// Configuración de prueba
const testWorkspaces = [
  'Test Workspace 1',
  'Mi Empresa',
  'Cliente ABC',
  'Personal Project'
];

async function testDynamicProjectCreation() {
  console.log('🧪 Iniciando pruebas de creación dinámica de proyectos\n');
  
  // Verificar que tenemos el token de API
  if (!process.env.TODOIST_API_TOKEN) {
    console.error('❌ Error: TODOIST_API_TOKEN no está configurado');
    process.exit(1);
  }
  
  console.log('✅ Token de API configurado');
  
  try {
    // Probar listado de proyectos existentes
    console.log('\n📋 Listando proyectos existentes...');
    const existingProjects = await getProjects();
    console.log(`📁 Encontrados ${existingProjects.length} proyectos:`);
    existingProjects.forEach(project => {
      console.log(`  - ${project.name} (ID: ${project.id})`);
    });
    
    console.log('\n🚀 Probando creación dinámica de proyectos...');
    
    // Probar cada workspace de prueba
    for (const workspace of testWorkspaces) {
      console.log(`\n🔍 Procesando workspace: "${workspace}"`);
      
      try {
        const projectId = await findOrCreateProjectByWorkspace(workspace);
        const expectedName = workspace; // Sin prefijo "Notion - "
        
        console.log(`✅ Proyecto encontrado/creado: ${expectedName} (ID: ${projectId})`);
        
        // Verificar que el proyecto existe en la lista actualizada
        const updatedProjects = await getProjects();
        const foundProject = updatedProjects.find(p => p.id === projectId);
        
        if (foundProject) {
          console.log(`✅ Verificación: Proyecto "${foundProject.name}" existe en Todoist`);
        } else {
          console.log(`⚠️  Advertencia: No se pudo verificar el proyecto en la lista`);
        }
        
      } catch (error) {
        console.log(`❌ Error procesando workspace "${workspace}": ${error.message}`);
      }
    }
    
    console.log('\n📊 Resumen final...');
    const finalProjects = await getProjects();
    const workspaceProjects = finalProjects.filter(p => 
      testWorkspaces.some(workspace => p.name.toLowerCase() === workspace.toLowerCase())
    );
    
    console.log(`📁 Total de proyectos: ${finalProjects.length}`);
    console.log(`🏢 Proyectos de workspace: ${workspaceProjects.length}`);
    
    if (workspaceProjects.length > 0) {
      console.log('\n🏢 Proyectos de workspace encontrados:');
      workspaceProjects.forEach(project => {
        console.log(`  - ${project.name} (ID: ${project.id})`);
      });
    }
    
    console.log('\n✅ Pruebas completadas exitosamente!');
    
  } catch (error) {
    console.error(`❌ Error durante las pruebas: ${error.message}`);
    process.exit(1);
  }
}

// Función de limpieza opcional
async function cleanupTestProjects() {
  console.log('\n🧹 ¿Deseas limpiar los proyectos de prueba creados? (y/N)');
  
  // Esta función requeriría implementar deleteTodoistProject
  // Por ahora solo mostramos los proyectos que se podrían limpiar
  const projects = await getProjects();
  const testProjects = projects.filter(p => 
    p.name.includes('Test Workspace') || 
    p.name.includes('Cliente ABC') ||
    testWorkspaces.some(workspace => p.name.toLowerCase() === workspace.toLowerCase())
  );
  
  if (testProjects.length > 0) {
    console.log('🗑️  Proyectos que podrían ser eliminados:');
    testProjects.forEach(project => {
      console.log(`  - ${project.name} (ID: ${project.id})`);
    });
    console.log('\nNota: Elimina manualmente desde Todoist si es necesario.');
  }
}

// Ejecutar pruebas
async function main() {
  try {
    await testDynamicProjectCreation();
    
    // Preguntar si se desea limpiar (opcional)
    if (process.argv.includes('--cleanup')) {
      await cleanupTestProjects();
    }
    
  } catch (error) {
    console.error(`❌ Error fatal: ${error.message}`);
    process.exit(1);
  }
}

// Solo ejecutar si es llamado directamente
if (process.argv[1].endsWith('test-dynamic-projects.js')) {
  main();
}
