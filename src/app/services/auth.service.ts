import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

export interface Usuario {
  _id?: string;
  id?: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'operador' | 'chofer' | 'usuario';
  telefono?: string;
  rut?: string;
  activo?: boolean;
  createdAt?: Date;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  usuario: Usuario;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  
  // ✅ SIGNALS (Angular 17+)
  currentUser = signal<Usuario | null>(null);
  isLoggedIn = signal<boolean>(false);
  token = signal<string | null>(null);
  cargando = signal<boolean>(false);

  // ✅ BEHAVIOR SUBJECTS (Compatibilidad)
  private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
  private cargandoSubject = new BehaviorSubject<boolean>(false);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private errorSubject = new BehaviorSubject<string | null>(null);
  
  usuario$ = this.usuarioSubject.asObservable();
  cargando$ = this.cargandoSubject.asObservable();
  token$ = this.tokenSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.cargarUsuarioGuardado();
    console.log('🔐 AuthService inicializado');
  }

  /**
   * ✅ Carga usuario guardado del localStorage
   */
  private cargarUsuarioGuardado(): void {
    try {
      const token = localStorage.getItem('token');
      const usuario = localStorage.getItem('usuario');

      if (token && usuario) {
        const usuarioParsed = JSON.parse(usuario);
        this.token.set(token);
        this.currentUser.set(usuarioParsed);
        this.isLoggedIn.set(true);
        
        // Actualizar BehaviorSubjects
        this.tokenSubject.next(token);
        this.usuarioSubject.next(usuarioParsed);
        
        console.log('✅ Usuario cargado del localStorage:', usuarioParsed.email);
      }
    } catch (error) {
      console.error('❌ Error cargando usuario del localStorage:', error);
      this.logout();
    }
  }

  /**
   * ✅ Login con email y contraseña
   */
  login(email: string, password: string): Observable<LoginResponse> {
    this.cargando.set(true);
    this.cargandoSubject.next(true);
    this.errorSubject.next(null);
    
    console.log('🔔 Intentando login:', email);

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          console.log('✅ Login exitoso:', response);
          
          if (response.success && response.token && response.usuario) {
            // Guardar en localStorage
            localStorage.setItem('token', response.token);
            localStorage.setItem('usuario', JSON.stringify(response.usuario));
            
            // Actualizar signals
            this.token.set(response.token);
            this.currentUser.set(response.usuario);
            this.isLoggedIn.set(true);
            
            // Actualizar BehaviorSubjects
            this.tokenSubject.next(response.token);
            this.usuarioSubject.next(response.usuario);
            
            alert('✅ Bienvenido ' + response.usuario.nombre);
          }
        }),
        catchError(error => {
          console.error('❌ Error en login:', error);
          const mensaje = error.error?.message || 'Error al iniciar sesión';
          this.errorSubject.next(mensaje);
          alert(`❌ Error: ${mensaje}`);
          return throwError(() => error);
        }),
        finalize(() => {
          this.cargando.set(false);
          this.cargandoSubject.next(false);
        })
      );
  }

  /**
   * ✅ Logout
   */
  logout(): void {
    console.log('🚪 Cerrando sesión');
    
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    
    this.token.set(null);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    
    this.tokenSubject.next(null);
    this.usuarioSubject.next(null);
    
    this.router.navigate(['/login']);
  }

  /**
   * ✅ Obtiene el token actual
   */
  obtenerToken(): string | null {
    return this.token() || localStorage.getItem('token');
  }

  /**
   * ✅ Obtiene el usuario actual
   */
  obtenerUsuario(): Usuario | null {
    return this.currentUser() || JSON.parse(localStorage.getItem('usuario') || 'null');
  }

  /**
   * ✅ Obtiene el rol del usuario actual
   */
  obtenerRol(): string | null {
    return this.currentUser()?.rol || null;
  }

  /**
   * ✅ Verifica si está autenticado
   */
  estaAutenticado(): boolean {
    const token = this.obtenerToken();
    const usuario = this.obtenerUsuario();
    const autenticado = !!token && !!usuario;
    console.log('🔍 ¿Autenticado?', autenticado);
    return autenticado;
  }

  /**
   * ✅ Verifica si es admin
   */
  esAdmin(): boolean {
    return this.obtenerRol() === 'admin';
  }

  /**
   * ✅ Verifica si tiene permiso (por rol)
   */
  tienePermiso(rolesPermitidos: string | string[]): boolean {
    const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
    // ✅ FIX: Verificar que rol no sea null
    const rolActual = this.obtenerRol();
    const resultado = rolActual ? roles.includes(rolActual) : false;
    console.log('👥 ¿Tiene permiso?', resultado, '| Rol:', rolActual, '| Permisos requeridos:', roles);
    return resultado;
  }

  /**
   * ✅ Cambiar rol de un usuario (solo admin)
   */
  cambiarRolUsuario(usuarioId: string, nuevoRol: string): Observable<any> {
    console.log(`📄 Cambiando rol de usuario ${usuarioId} a ${nuevoRol}`);
    
    return this.http.patch(
      `${this.apiUrl}/auth/usuarios/${usuarioId}/rol`,
      { rol: nuevoRol }
    ).pipe(
      tap(response => {
        console.log('✅ Rol actualizado:', response);
        alert('✅ Rol actualizado exitosamente');
      }),
      catchError(error => {
        console.error('❌ Error al cambiar rol:', error);
        const mensaje = error.error?.message || 'Error al cambiar rol';
        alert(`❌ Error: ${mensaje}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ Registrar nuevo usuario (solo admin)
   */
  registrarUsuario(usuario: Partial<Usuario>): Observable<LoginResponse> {
    console.log('👤 Registrando nuevo usuario:', usuario.email);

    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/registrar`, usuario)
      .pipe(
        tap(response => {
          console.log('✅ Usuario registrado:', response);
          alert('✅ Usuario registrado exitosamente');
        }),
        catchError(error => {
          console.error('❌ Error al registrar:', error);
          const mensaje = error.error?.message || 'Error al registrar usuario';
          alert(`❌ Error: ${mensaje}`);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ Obtener todos los usuarios (solo admin)
   */
  obtenerUsuarios(): Observable<{ usuarios: Usuario[] }> {
    console.log('👥 Obteniendo listado de usuarios');

    return this.http.get<{ usuarios: Usuario[] }>(`${this.apiUrl}/auth/usuarios`)
      .pipe(
        tap(response => {
          console.log('✅ Usuarios obtenidos:', response.usuarios.length);
        }),
        catchError(error => {
          console.error('❌ Error al obtener usuarios:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ Eliminar usuario (solo admin)
   */
  eliminarUsuario(usuarioId: string): Observable<any> {
    console.log(`🗑️ Eliminando usuario ${usuarioId}`);

    return this.http.delete(`${this.apiUrl}/auth/usuarios/${usuarioId}`)
      .pipe(
        tap(() => {
          console.log('✅ Usuario eliminado');
          alert('✅ Usuario eliminado exitosamente');
        }),
        catchError(error => {
          console.error('❌ Error al eliminar usuario:', error);
          const mensaje = error.error?.message || 'Error al eliminar usuario';
          alert(`❌ Error: ${mensaje}`);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ Validar token
   */
  validarToken(): Observable<{ valido: boolean }> {
    console.log('🔍 Validando token');
    return this.http.get<{ valido: boolean }>(`${this.apiUrl}/auth/validar`)
      .pipe(
        catchError(error => {
          console.warn('⚠️ Token inválido');
          this.logout();
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ Actualizar perfil del usuario actual
   */
  actualizarPerfil(datos: Partial<Usuario>): Observable<Usuario> {
    console.log('✏️ Actualizando perfil del usuario');

    return this.http.patch<Usuario>(`${this.apiUrl}/auth/perfil`, datos)
      .pipe(
        tap(usuarioActualizado => {
          console.log('✅ Perfil actualizado:', usuarioActualizado);
          
          // Actualizar en memory y localStorage
          this.currentUser.set(usuarioActualizado);
          this.usuarioSubject.next(usuarioActualizado);
          localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
          
          alert('✅ Perfil actualizado exitosamente');
        }),
        catchError(error => {
          console.error('❌ Error actualizando perfil:', error);
          const mensaje = error.error?.message || 'Error al actualizar perfil';
          alert(`❌ Error: ${mensaje}`);
          return throwError(() => error);
        })
      );
  }

  /**
   * ✅ Cambiar contraseña
   */
  cambiarContrasena(passwordActual: string, passwordNueva: string): Observable<any> {
    console.log('🔐 Cambiando contraseña');

    return this.http.post(`${this.apiUrl}/auth/cambiar-password`, {
      passwordActual,
      passwordNueva
    }).pipe(
      tap(() => {
        console.log('✅ Contraseña cambiada');
        alert('✅ Contraseña actualizada exitosamente');
      }),
      catchError(error => {
        console.error('❌ Error cambiando contraseña:', error);
        const mensaje = error.error?.message || 'Error al cambiar contraseña';
        alert(`❌ Error: ${mensaje}`);
        return throwError(() => error);
      })
    );
  }

  /**
   * ✅ Limpiar errores
   */
  limpiarError(): void {
    this.errorSubject.next(null);
  }
}