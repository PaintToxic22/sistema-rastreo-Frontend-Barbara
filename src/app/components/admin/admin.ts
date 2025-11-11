import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { EncomiendaService } from '../../services/encomienda';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {
  usuario: any = null;
  seccion = 'dashboard';
  loading = false;

  estadisticas = {
    total: 156,
    en_transito: 23,
    incidencias: 3,
    entregadas: 1247
  };

  encomiendas: any[] = [];
  usuarios: any[] = [];

  constructor(
    private authService: AuthService,
    private encomiendaService: EncomiendaService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('🔐 AdminComponent ngOnInit');
    this.usuario = this.authService.currentUser();
    console.log('👤 Usuario:', this.usuario);
    
    if (!this.usuario || this.usuario.rol !== 'admin') {
      console.log('❌ No eres admin');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('✅ Admin autenticado');
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    console.log('📦 Cargando encomiendas...');
    
    this.encomiendaService.obtenerEncomiendas().subscribe({
      next: (res: any) => {
        console.log('✅ Respuesta:', res);
        this.encomiendas = res.encomiendas || [];
        this.estadisticas.total = this.encomiendas.length;
        this.estadisticas.en_transito = this.encomiendas.filter(e => e.estado === 'en_transito').length;
        this.estadisticas.entregadas = this.encomiendas.filter(e => e.estado === 'entregado').length;
        console.log('📊 Stats:', this.estadisticas);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('❌ Error:', err);
        this.loading = false;
      }
    });
  }

  mostrarSeccion(sec: string) {
    console.log('📌 mostrarSeccion:', sec);
    console.log('✅ seccion antes:', this.seccion);
    this.seccion = sec;
    console.log('✅ seccion después:', this.seccion);
  }

  getEstadoBadge(estado: string): string {
    const badges: { [key: string]: string } = {
      'pendiente': 'bg-secondary',
      'asignado': 'bg-info',
      'en_transito': 'bg-warning',
      'entregado': 'bg-success',
      'no_entregado': 'bg-danger'
    };
    return badges[estado] || 'bg-secondary';
  }

  logout() {
    console.log('👋 Logout');
    this.authService.logout();
  }
}