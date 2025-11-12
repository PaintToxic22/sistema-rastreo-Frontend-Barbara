import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { TrackingService } from '../../../services/tracking.service';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tracking.html',
  styleUrls: ['./tracking.css']
})
export class TrackingComponent implements OnInit, OnDestroy {
  formTracking!: FormGroup;
  encomienda: any = null;
  historial: any[] = [];
  loading = false;
  error = '';
  usuario: any = null;
  
  // ✅ Subject para desuscripciones automáticas
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private trackingService: TrackingService,
    private authService: AuthService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit() {
    // ✅ Verificar autenticación
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    // ✅ Obtener usuario actual
    this.usuario = this.authService.obtenerUsuario();
    console.log('✅ Usuario cargado:', this.usuario?.nombre);
  }

  ngOnDestroy() {
    // ✅ Desuscribirse de todos los observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ Inicializa el formulario
   */
  initForm() {
    this.formTracking = this.fb.group({
      codigo: ['', Validators.required]
    });
  }

  /**
   * ✅ Busca una encomienda por código de seguimiento
   */
  buscar() {
    const codigo = this.formTracking.value.codigo.trim();
    if (!codigo) {
      this.error = 'Por favor, ingresa un código de seguimiento';
      return;
    }

    this.loading = true;
    this.error = '';
    this.encomienda = null;
    this.historial = [];

    console.log('🔍 Rastreando:', codigo);

    // ✅ Usar takeUntil para desuscripción automática
    this.trackingService.rastrearPorCodigo(codigo)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          this.loading = false;
          console.log('✅ Respuesta:', response);

          // ✅ Verificar estructura de respuesta
          if (response && response.encomienda) {
            this.encomienda = response.encomienda;
            this.historial = response.historial || [];
            console.log('✅ Encomienda encontrada:', this.encomienda.codigoSeguimiento);
          } else {
            this.error = 'Encomienda no encontrada';
            console.warn('⚠️ Estructura de respuesta inesperada');
          }
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Encomienda no encontrada';
          console.error('❌ Error:', err);
        }
      });
  }

  /**
   * ✅ Obtiene el texto legible del estado
   */
  getEstadoTexto(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': 'Pendiente',
      'asignado': 'Asignado a chofer',
      'en_transito': 'En tránsito',
      'entregado': 'Entregado',
      'no_entregado': 'No entregado',
      'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
  }

  /**
   * ✅ Obtiene la clase CSS para el badge del estado
   */
  getEstadoBadge(estado: string): string {
    const badges: { [key: string]: string } = {
      'pendiente': 'bg-secondary',
      'asignado': 'bg-info',
      'en_transito': 'bg-warning',
      'entregado': 'bg-success',
      'no_entregado': 'bg-danger',
      'cancelado': 'bg-dark'
    };
    return badges[estado] || 'bg-secondary';
  }

  /**
   * ✅ Limpia el rastreo y el formulario
   */
  limpiar() {
    this.encomienda = null;
    this.historial = [];
    this.error = '';
    this.formTracking.reset();
    this.formTracking.patchValue({ codigo: '' });
    console.log('🔄 Formulario limpiado');
  }

  /**
   * ✅ Cierra sesión y redirige a login
   */
  logout() {
    if (confirm('¿Deseas cerrar sesión?')) {
      console.log('🚪 Cerrando sesión...');
      this.authService.logout();
    }
  }
}