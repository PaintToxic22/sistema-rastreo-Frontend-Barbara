import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { EncomiendaService } from '../../../services/encomienda.service';

@Component({
  selector: 'app-entregar-encomienda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './entregar-encomienda.html',
  styleUrls: ['./entregar-encomienda.css']
})
export class EntregarEncomiendaComponent implements OnInit, OnDestroy {
  formEntrega!: FormGroup;
  encomienda: any = null;
  loading = false;
  error = '';
  success = false;
  fotoPreview: string | null = null;
  fotoBase64: string | null = null;
  encomiendaId = '';
  usuario: any = null;
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private encomiendaService: EncomiendaService,
    private authService: AuthService
  ) {
    this.initForm();
  }

  ngOnInit() {
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuario = this.authService.obtenerUsuario();
    if (this.usuario.rol !== 'chofer') {
      this.error = 'Solo los choferes pueden acceder aquí';
      return;
    }

    this.encomiendaId = this.route.snapshot.paramMap.get('id') || '';
    if (this.encomiendaId) {
      this.cargarEncomienda();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm() {
    this.formEntrega = this.fb.group({
      nombreRecibidor: ['', [Validators.required, Validators.minLength(3)]],
      rutRecibidor: [''], // Opcional
      notas: ['']
    });
  }

  cargarEncomienda() {
    this.encomiendaService.obtenerPorId(this.encomiendaId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.encomienda = response;
          console.log('✅ Encomienda cargada:', this.encomienda);
        },
        error: (err) => {
          this.error = 'No se pudo cargar la encomienda';
          console.error('Error:', err);
        }
      });
  }

  onFotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'La foto no puede exceder 5MB';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPreview = reader.result as string;
        this.fotoBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  entregarEncomienda() {
    if (this.formEntrega.invalid) {
      this.error = 'Por favor completa los campos requeridos';
      return;
    }

    const nombreRecibidor = this.formEntrega.value.nombreRecibidor.trim();
    const rutRecibidor = this.formEntrega.value.rutRecibidor?.trim() || null;
    const notas = this.formEntrega.value.notas?.trim() || '';

    // ✅ Validar nombre (requerido)
    if (!nombreRecibidor || nombreRecibidor.length < 3) {
      this.error = 'Nombre de recibidor requerido (mín. 3 caracteres)';
      return;
    }

    this.loading = true;
    this.error = '';

    const datos = {
      nombreRecibidor: nombreRecibidor,
      rutRecibidor: rutRecibidor, // ✅ Puede ser null
      ubicacionEntrega: notas,
      fotoBase64: this.fotoBase64
    };

    console.log('📦 Confirmando entrega:', datos);

    this.encomiendaService.confirmarEntrega(this.encomiendaId, datos)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.success = true;
          console.log('✅ Entrega confirmada:', response);

          setTimeout(() => {
            this.router.navigate(['/chofer/asignadas']);
          }, 2000);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Error al confirmar entrega';
          console.error('❌ Error:', err);
        }
      });
  }

  formatearRUT(event: any) {
    let valor = event.target.value.toUpperCase();
    
    // Remover caracteres inválidos
    valor = valor.replace(/[^0-9K]/g, '');
    
    // Formatear: XX.XXX.XXX-X
    if (valor.length > 1) {
      valor = valor.slice(0, -1) + '.' + valor.slice(-1);
    }
    if (valor.length > 5) {
      valor = valor.slice(0, 5) + '.' + valor.slice(5);
    }
    if (valor.length > 9) {
      valor = valor.slice(0, 9) + '-' + valor.slice(9, 10);
    }
    
    this.formEntrega.patchValue({ rutRecibidor: valor }, { emitEvent: false });
  }

  volver() {
    this.router.navigate(['/chofer/asignadas']);
  }

  logout() {
    if (confirm('¿Deseas cerrar sesión?')) {
      this.authService.logout();
    }
  }

  get nombreInvalido(): boolean {
    const control = this.formEntrega.get('nombreRecibidor');
    return control ? control.invalid && control.touched : false;
  }
}