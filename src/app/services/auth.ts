import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'operador' | 'chofer' | 'usuario';
  telefono?: string;
  rut?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  usuario: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';

  currentUser = signal<Usuario | null>(null);
  isLoggedIn = signal<boolean>(false);
  token = signal<string | null>(null);

  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  usuario$ = this.usuarioSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.cargarUsuarioGuardado();
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success) {
          this.token.set(response.token);
          this.currentUser.set(response.usuario);
          this.usuarioSubject.next(response.usuario);
          localStorage.setItem('token', response.token);
          localStorage.setItem('usuario', JSON.stringify(response.usuario));
          this.isLoggedIn.set(true);
          console.log('✅ Login exitoso:', response.usuario);
        }
      }),
      catchError(error => {
        console.error('Error login:', error);
        throw error;
      })
    );
  }

  logout() {
    this.token.set(null);
    this.currentUser.set(null);
    this.usuarioSubject.next(null);
    this.isLoggedIn.set(false);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

  obtenerToken(): string | null {
    return this.token() || localStorage.getItem('token');
  }

  cargarUsuarioGuardado() {
    const token = localStorage.getItem('token');
    const usuario = localStorage.getItem('usuario');

    if (token && usuario) {
      this.token.set(token);
      const usuarioParsed = JSON.parse(usuario);
      this.currentUser.set(usuarioParsed);
      this.usuarioSubject.next(usuarioParsed);
      this.isLoggedIn.set(true);
      console.log('✅ Usuario cargado desde localStorage:', usuarioParsed);
    }
  }

  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    const usuario = this.currentUser();
    const autenticado = !!token && !!usuario;
    console.log('🔐 ¿Autenticado?', autenticado, '| Token:', !!token, '| Usuario:', !!usuario);
    return autenticado;
  }

  obtenerRol(): string | null {
    return this.currentUser()?.rol || null;
  }

  tienePermiso(rol: string | string[]): boolean {
    const rolesPermitidos = Array.isArray(rol) ? rol : [rol];
    const resultado = rolesPermitidos.includes(this.obtenerRol() || '');
    console.log('👥 ¿Tiene permiso?', resultado, '| Rol usuario:', this.obtenerRol(), '| Roles permitidos:', rolesPermitidos);
    return resultado;
  }
}