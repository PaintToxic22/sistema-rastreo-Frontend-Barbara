import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService, Usuario } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.estaAutenticado()) {
      const usuarioStr = localStorage.getItem('usuario');
      if (usuarioStr) {
        const usuario: Usuario = JSON.parse(usuarioStr);
        let redirectTo = '/';
        switch (usuario.rol) {
          case 'admin':
            redirectTo = '/admin/dashboard';
            break;
          case 'operador':
            redirectTo = '/operador/encomiendas';
            break;
          case 'chofer':
            redirectTo = '/chofer/asignadas';
            break;
          case 'usuario':
            redirectTo = '/usuario/tracking';
            break;
        }
        this.router.navigate([redirectTo]);
      } else {
        this.router.navigate(['/']);
      }
      return false;
    }
    return true;
  }
}
