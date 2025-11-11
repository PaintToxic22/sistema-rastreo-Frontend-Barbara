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
    
    // Verificar si está autenticado
    if (!this.authService.estaAutenticado()) {
      console.log('❌ No autenticado');
      this.router.navigate(['/login']);
      return false;
    }

    // Obtener usuario actual
    const usuario = this.authService.currentUser();
    console.log('👤 Usuario actual:', usuario);

    // Verificar rol si está especificado en la ruta
    const rolesRequeridos = route.data['rol'];
    if (rolesRequeridos && rolesRequeridos.length > 0) {
      console.log('🔑 Roles requeridos:', rolesRequeridos);
      console.log('👥 Rol del usuario:', usuario?.rol);

      // Verificar si el usuario tiene uno de los roles requeridos
      if (!rolesRequeridos.includes(usuario?.rol)) {
        console.log('❌ Rol no autorizado');
        this.router.navigate(['/login']);
        return false;
      }
    }

    console.log('✅ Acceso permitido');
    return true;
  }
}