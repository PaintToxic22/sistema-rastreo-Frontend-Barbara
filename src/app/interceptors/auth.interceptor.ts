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

    // ✅ Si hay token, agregarlo al header Authorization
    if (token) {
      console.log('✅ Agregando token al header');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Error HTTP:', error.status, error.message);

        // ✅ Si es 401 (No autorizado), logout automático
        if (error.status === 401) {
          console.log('🔴 Token expirado o inválido. Logout automático.');
          this.authService.logout();
          this.router.navigate(['/login']);
          alert('❌ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        }

        // ✅ Si es 403 (Prohibido), redirigir a login
        if (error.status === 403) {
          console.log('🔴 Acceso prohibido');
          this.router.navigate(['/login']);
          alert('❌ No tienes permisos para realizar esta acción.');
        }

        // ✅ Si es 404, registrar pero no hacer nada especial
        if (error.status === 404) {
          console.warn('⚠️ Recurso no encontrado');
        }

        // ✅ Si es 500, error del servidor
        if (error.status === 500) {
          console.error('⚠️ Error del servidor');
          alert('❌ Error del servidor. Por favor, intenta más tarde.');
        }

        return throwError(() => error);
      })
    );
  }
}