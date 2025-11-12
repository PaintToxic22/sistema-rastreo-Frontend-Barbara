import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.obtenerToken();

    // ✅ PASO 1: Si hay token, agregarlo al header Authorization
    if (token && token.trim()) {
      console.log('🔐 Token encontrado. Agregando al header Authorization');
      request = request.clone({
        setHeaders: {
          'Authorization': `Bearer ${token.trim()}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Header Authorization agregado correctamente');
    } else {
      console.warn('⚠️ No hay token disponible en localStorage');
    }

    // ✅ PASO 2: Asegurar que Content-Type esté presente
    if (!request.headers.has('Content-Type') && request.method !== 'GET') {
      request = request.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`📤 ${request.method} ${request.url}`);
    console.log('Headers:', request.headers);

    // ✅ PASO 3: Manejar la respuesta y errores
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error HTTP completo:', error);
        console.error('Status:', error.status);
        console.error('StatusText:', error.statusText);
        console.error('URL:', error.url);
        console.error('Mensaje:', error.message);
        console.error('Respuesta:', error.error);

        // ✅ CASO 1: 401 - Token expirado o inválido
        if (error.status === 401) {
          console.log('🔴 [401] Token expirado o inválido');
          
          if (!this.router.url.includes('/login')) {
            alert('❌ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
          }
          
          this.authService.logout();
          this.router.navigate(['/login'], { replaceUrl: true });
        }

        // ✅ CASO 2: 403 - Prohibido (sin permisos)
        if (error.status === 403) {
          console.log('🔴 [403] Acceso prohibido - No tienes permisos');
          alert('❌ No tienes permisos para realizar esta acción.');
        }

        // ✅ CASO 3: 404 - No encontrado
        if (error.status === 404) {
          console.warn('⚠️ [404] Recurso no encontrado');
          console.log('URL no encontrada:', error.url);
        }

        // ✅ CASO 4: 500 - Error del servidor
        if (error.status === 500) {
          console.error('🔴 [500] Error del servidor');
          alert('❌ Error del servidor. Por favor, intenta más tarde.');
        }

        // ✅ CASO 5: 0 - Error de conexión
        if (error.status === 0) {
          console.error('🔴 [0] Error de conexión - El servidor no es accesible');
          alert('❌ Error de conexión. Verifica que el servidor esté activo en http://localhost:3000');
        }

        return throwError(() => error);
      })
    );
  }
}