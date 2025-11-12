import { HTTP_INTERCEPTORS, provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { AuthInterceptor } from './interceptors/auth.interceptor';

/**
 * ✅ Configuración de la aplicación Angular
 * - Router
 * - HTTP Client con Interceptor de Autenticación
 * - Animaciones
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ Proveedor de rutas
    provideRouter(routes),
    
    // ✅ Proveedor de HTTP Client
    provideHttpClient(),
    
    // ✅ Animaciones de Angular
    provideAnimations(),
    
    // ✅ Interceptor de Autenticación (agregar token a headers)
    { 
      provide: HTTP_INTERCEPTORS, 
      useClass: AuthInterceptor, 
      multi: true 
    }
  ]
};