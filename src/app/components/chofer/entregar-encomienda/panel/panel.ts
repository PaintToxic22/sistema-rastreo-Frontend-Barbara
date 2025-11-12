import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';
import { EncomiendaService } from '../../../../services/encomienda.service';

@Component({
  selector: 'app-chofer-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './panel.html',
  styleUrls: ['./panel.css']
})
export class ChoferPanelComponent implements OnInit, OnDestroy {
  usuario: any = null;
  encomiendas: any[] = [];
  encomiendasFiltradas: any[] = [];
  loading = false;
  error = '';
  success = '';
  filtroEstado = 'asignado'; // Por defecto mostrar asignadas
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private encomiendaService: EncomiendaService,
    private router: Router
  ) {}

  ngOnInit() {
    // ✅ Verificar autenticación
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuario = this.authService.obtenerUsuario();

    // ✅ Verificar que sea chofer
    if (this.usuario?.rol !== 'chofer') {
      this.error = 'Solo los choferes pueden acceder aquí';
      setTimeout(() => this.router.navigate(['/login']), 2000);
      return;
    }

    console.log('🚗 Chofer:', this.usuario.nombre);
    this.cargarEncomiendas();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * ✅ Cargar encomiendas del chofer
   */
  cargarEncomiendas() {
    this.loading = true;
    this.error = '';

    console.log('📦 Cargando encomiendas asignadas al chofer:', this.usuario.id);

    // ✅ Obtener encomiendas asignadas a este chofer
    this.encomiendaService.obtenerAsignadas(this.usuario.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (encomiendas) => {
          this.loading = false;
          this.encomiendas = encomiendas;
          this.filtrarEncomiendas();
          console.log('✅ Encomiendas cargadas:', encomiendas.length);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Error al cargar encomiendas';
          this.encomiendas = [];
          console.error('❌ Error:', err);
        }
      });
  }

  /**
   * ✅ Filtrar encomiendas por estado
   */
  filtrarEncomiendas() {
    if (this.filtroEstado === 'todas') {
      this.encomiendasFiltradas = this.encomiendas;
    } else {
      this.encomiendasFiltradas = this.encomiendas.filter(
        e => e.estado === this.filtroEstado
      );
    }
    console.log('🔍 Filtradas:', this.encomiendasFiltradas.length);
  }

  /**
   * ✅ Cambiar filtro
   */
  cambiarFiltro(estado: string) {
    this.filtroEstado = estado;
    this.filtrarEncomiendas();
  }

  /**
   * ✅ Ir a entregar una encomienda
   */
  irAEntregar(encomienda: any) {
    console.log('🚗 Entregando:', encomienda.codigoSeguimiento);
    this.router.navigate(['/chofer/entregar', encomienda._id]);
  }

  /**
   * ✅ Logout
   */
  logout() {
    if (confirm('¿Deseas cerrar sesión?')) {
      console.log('🚪 Cerrando sesión...');
      this.authService.logout();
    }
  }

  /**
   * ✅ Obtener badge de estado
   */
  getEstadoBadge(estado: string): string {
    const badges: { [key: string]: string } = {
      'asignado': 'bg-info',
      'en_transito': 'bg-warning',
      'entregada': 'bg-success',
      'pendiente': 'bg-secondary'
    };
    return badges[estado] || 'bg-secondary';
  }

  /**
   * ✅ Obtener texto de estado
   */
  getEstadoTexto(estado: string): string {
    const textos: { [key: string]: string } = {
      'asignado': 'Asignada',
      'en_transito': 'En tránsito',
      'entregada': 'Entregada',
      'pendiente': 'Pendiente'
    };
    return textos[estado] || estado.toUpperCase();
  }

  /**
   * ✅ Refrescar lista
   */
  refrescar() {
    this.cargarEncomiendas();
  }

  /**
   * ✅ GETTERS para contar por estado (evitar errores en template)
   * 
   * Estos getters se usan en el HTML para mostrar el contador de encomiendas
   * por cada estado. Se necesitan para evitar usar .filter() directamente
   * en los templates, lo cual causa errores de compilación.
   */
  get totalAsignadas(): number {
    return this.encomiendas.filter(e => e.estado === 'asignado').length;
  }

  get totalEnTransito(): number {
    return this.encomiendas.filter(e => e.estado === 'en_transito').length;
  }

  get totalEntregadas(): number {
    return this.encomiendas.filter(e => e.estado === 'entregada').length;
  }

  get totalPendientes(): number {
    return this.encomiendas.filter(e => e.estado === 'pendiente').length;
  }

  get totalEncomiendas(): number {
    return this.encomiendas.length;
  }
}