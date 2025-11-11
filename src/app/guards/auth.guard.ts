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
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return false;
    }

    const usuario = this.authService.currentUser();
    const rolesRequeridos = route.data['rol'];

    if (rolesRequeridos && rolesRequeridos.length > 0) {
      if (!rolesRequeridos.includes(usuario?.rol)) {
        this.router.navigate(['/login']);
        return false;
      }
    }

    return true;
  }
}