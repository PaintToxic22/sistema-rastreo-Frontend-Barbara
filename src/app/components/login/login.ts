import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';
import { catchError, take, takeUntil } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  formLogin!: FormGroup;
  loading = false;
  error = '';
  
  // ✅ Subject para desuscripciones automáticas
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit() {
    // ✅ Si ya está autenticado, redirigir según su rol
    if (this.authService.estaAutenticado()) {
      this.navegarSegunRol();
    }
  }

  ngOnDestroy() {
    // ✅ Desuscribirse de todos los observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ Inicializa el formulario de login
   */
  initForm() {
    this.formLogin = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * ✅ Maneja el envío del formulario
   */
  onSubmit() {
    if (this.formLogin.invalid) {
      alert('⚠️ Por favor, completa el formulario correctamente');
      return;
    }

    this.loading = true;
    this.error = '';

    const { email, password } = this.formLogin.value;

    // ✅ Usar pipe(take(1)) para completar automáticamente después del primer valor
    this.authService.login(email, password)
      .pipe(
        take(1), // ✅ Solo tomar 1 valor y desuscribirse
        takeUntil(this.destroy$), // ✅ Desuscribirse cuando el componente se destruye
        catchError(err => {
          this.loading = false;
          this.error = err.error?.message || 'Error al iniciar sesión';
          console.error('❌ Error al hacer login:', err);
          return throwError(() => err);
        })
      )
      .subscribe({
        next: (response) => {
          // ✅ Verificar que response sea válido
          if (response && response.success) {
            console.log('✅ Login exitoso, navegando...');
            this.navegarSegunRol();
          } else {
            this.loading = false;
            this.error = 'Error en la respuesta del servidor';
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('❌ Error en suscripción:', err);
        },
        complete: () => {
          // ✅ Se ejecuta cuando la suscripción se completa
          console.log('✅ Suscripción de login completada');
          // No establecer loading a false aquí porque ya se hizo en next o error
        }
      });
  }

  /**
   * ✅ Navega según el rol del usuario
   */
  private navegarSegunRol() {
    const rol = this.authService.obtenerRol();
    
    console.log('🔄 Navegando según rol:', rol);
    
    switch (rol) {
      case 'admin':
        console.log('📊 Navegando a admin dashboard');
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'operador':
        console.log('📦 Navegando a operador panel');
        this.router.navigate(['/operador/encomiendas']);
        break;
      case 'chofer':
        console.log('🚗 Navegando a chofer asignadas');
        this.router.navigate(['/chofer/asignadas']);
        break;
      case 'usuario':
      default:
        console.log('📍 Navegando a usuario tracking');
        this.router.navigate(['/usuario/tracking']);
    }
  }
}