import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('🔐 AuthGuard verificando acceso a:', state.url);

    // ✅ PASO 1: Verificar si está autenticado
    if (!this.authService.estaAutenticado()) {
      console.log('❌ No autenticado. Redirigiendo a login.');
      this.router.navigate(['/login']);
      return false;
    }

    console.log('✅ Autenticado');

    // ✅ PASO 2: Verificar rol si está especificado en la ruta
    const rolesRequeridos = route.data['rol'];
    if (rolesRequeridos && rolesRequeridos.length > 0) {
      const rolUsuario = this.authService.obtenerRol();
      
      console.log('🔍 Roles requeridos:', rolesRequeridos);
      console.log('👤 Rol del usuario:', rolUsuario);

      // ✅ FIX: Verificar que rol no sea null antes de hacer includes
      if (!rolUsuario || !rolesRequeridos.includes(rolUsuario)) {
        console.log('❌ Rol no autorizado');
        alert('❌ No tienes permisos para acceder a esta sección');
        this.router.navigate(['/login']);
        return false;
      }
    }

    console.log('✅ Acceso permitido');
    return true;
  }
}