import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    console.log('🔐 AuthGuard verificando...');

    // Primero, verificar si hay un token. Es la forma más rápida de saber si hay sesión.
    const token = this.authService.obtenerToken();
    if (!token) {
      console.log('❌ No hay token. Redirigiendo a login.');
      this.router.navigate(['/login']);
      return false;
    }

    // Si hay token, verificar los datos del usuario.
    const usuario = this.authService.currentUser();
    if (!usuario) {
      console.log('❌ Hay token pero no hay datos de usuario. Redirigiendo a login.');
      // Esto podría pasar si el localStorage está corrupto o en un estado inconsistente.
      this.authService.logout(); // Limpiar el estado inconsistente.
      return false;
    }

    console.log('👤 Usuario actual:', usuario);

    // Verificar rol si está especificado en la ruta.
    const rolesRequeridos = route.data['rol'];
    if (rolesRequeridos && rolesRequeridos.length > 0) {
      console.log('🔑 Roles requeridos:', rolesRequeridos);
      console.log('👥 Rol del usuario:', usuario.rol);

      // Verificar si el usuario tiene uno de los roles requeridos.
      if (!rolesRequeridos.includes(usuario.rol)) {
        console.log('❌ Rol no autorizado. Redirigiendo a login.');
        this.router.navigate(['/login']);
        return false;
      }
    }

    console.log('✅ Acceso permitido');
    return true;
  }
}