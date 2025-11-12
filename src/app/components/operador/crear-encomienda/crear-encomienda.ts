import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { EncomiendaService } from '../../../services/encomienda.service';

@Component({
  selector: 'app-crear-encomienda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-encomienda.html',
  styleUrls: ['./crear-encomienda.css']
})
export class CrearEncomiendaComponent implements OnInit, OnDestroy {
  formEncomienda!: FormGroup;
  loading = false;
  error = '';
  success = '';
  codigoSeguimiento = '';
  usuario: any = null;
  encomiendasCreadas: any[] = [];
  
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private encomiendaService: EncomiendaService,
    private authService: AuthService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit() {
    if (!this.authService.estaAutenticado()) {
      this.router.navigate(['/login']);
      return;
    }

    this.usuario = this.authService.obtenerUsuario();
    if (this.usuario.rol !== 'operador' && this.usuario.rol !== 'usuario') {
      this.error = 'No tienes permiso para crear encomiendas';
      return;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm() {
    this.formEncomienda = this.fb.group({
      // Datos básicos
      codigoSeguimiento: ['', [Validators.required, Validators.minLength(10)]],
      valor: ['', [Validators.required, Validators.min(1000)]],
      peso: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      
      // Remitente
      remitenteNombre: ['', Validators.required],
      remitenteTelefono: ['', Validators.required],
      remitenteCity: ['', Validators.required],
      remitenteAddress: ['', Validators.required],
      
      // Destinatario
      destinatarioNombre: ['', Validators.required],
      destinatarioTelefono: ['', Validators.required],
      destinatarioCity: ['', Validators.required],
      destinatarioAddress: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.formEncomienda.invalid) {
      this.error = 'Por favor completa todos los campos requeridos';
      return;
    }

    const formValue = this.formEncomienda.value;
    const datos = {
      codigoSeguimiento: formValue.codigoSeguimiento.toUpperCase().trim(),
      valor: Number(formValue.valor),
      peso: Number(formValue.peso),
      descripcion: formValue.descripcion,
      remitente: {
        nombre: formValue.remitenteNombre,
        telefono: formValue.remitenteTelefono,
        ciudad: formValue.remitenteCity,
        direccion: formValue.remitenteAddress
      },
      destinatario: {
        nombre: formValue.destinatarioNombre,
        telefono: formValue.destinatarioTelefono,
        ciudad: formValue.destinatarioCity,
        direccion: formValue.destinatarioAddress
      }
    };

    this.loading = true;
    this.error = '';
    this.success = '';

    this.encomiendaService.crearEncomiendaManual(datos)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.success = `✅ Encomienda ${response.encomienda.codigoSeguimiento} creada exitosamente`;
          this.codigoSeguimiento = response.encomienda.codigoSeguimiento;
          
          this.encomiendasCreadas.push(response.encomienda);
          this.formEncomienda.reset();
          
          setTimeout(() => {
            this.success = '';
          }, 5000);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Error al crear encomienda';
          console.error('Error:', err);
        }
      });
  }

  limpiar() {
    this.formEncomienda.reset();
    this.error = '';
    this.success = '';
  }

  logout() {
    if (confirm('¿Deseas cerrar sesión?')) {
      this.authService.logout();
    }
  }

  volver() {
    this.router.navigate(['/operador']);
  }

  get codigoInvalido(): boolean {
    const control = this.formEncomienda.get('codigoSeguimiento');
    return control ? control.invalid && control.touched : false;
  }

  get valorInvalido(): boolean {
    const control = this.formEncomienda.get('valor');
    return control ? control.invalid && control.touched : false;
  }

  get pesoInvalido(): boolean {
    const control = this.formEncomienda.get('peso');
    return control ? control.invalid && control.touched : false;
  }
}