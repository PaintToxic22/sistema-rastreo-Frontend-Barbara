import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth';
import { EncomiendaService } from '../../../services/encomienda';

@Component({
  selector: 'app-operador-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './panel.html',
  styleUrls: ['./panel.css']
})
export class OperadorPanelComponent implements OnInit {
  usuario: any = null;
  seccion = 'inicio';
  loading = false;
  formEncomienda!: FormGroup;
  encomiendas: any[] = [];
  success = false;
  error = '';

  constructor(
    private authService: AuthService,
    private encomiendaService: EncomiendaService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.usuario = this.authService.currentUser();
    if (!this.usuario || (this.usuario.rol !== 'operador' && this.usuario.rol !== 'admin')) {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarEncomiendas();
  }

  initForm() {
    this.formEncomienda = this.fb.group({
      remitenteNombre: ['', Validators.required],
      remitenteCity: ['', Validators.required],
      remitenteAddress: ['', Validators.required],
      destinatarioNombre: ['', Validators.required],
      destinatarioCity: ['', Validators.required],
      destinatarioAddress: ['', Validators.required],
      descripcion: ['', Validators.required],
      peso: [''],
      valor: ['', [Validators.required, Validators.min(0)]]
    });
  }

  cargarEncomiendas() {
    this.loading = true;
    this.encomiendaService.obtenerEncomiendas().subscribe({
      next: (res) => {
        this.encomiendas = res.encomiendas || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
      }
    });
  }

  crearEncomienda() {
    if (this.formEncomienda.invalid) return;

    this.loading = true;
    this.error = '';

    const datos = {
      remitente: {
        nombre: this.formEncomienda.value.remitenteNombre,
        ciudad: this.formEncomienda.value.remitenteCity,
        direccion: this.formEncomienda.value.remitenteAddress
      },
      destinatario: {
        nombre: this.formEncomienda.value.destinatarioNombre,
        ciudad: this.formEncomienda.value.destinatarioCity,
        direccion: this.formEncomienda.value.destinatarioAddress
      },
      descripcion: this.formEncomienda.value.descripcion,
      peso: this.formEncomienda.value.peso || 0,
      valor: parseInt(this.formEncomienda.value.valor)
    };

    this.encomiendaService.crearEncomienda(datos).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = true;
        this.formEncomienda.reset();
        setTimeout(() => {
          this.seccion = 'encomiendas';
          this.cargarEncomiendas();
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al crear encomienda';
      }
    });
  }

  mostrarSeccion(sec: string) {
    this.seccion = sec;
    this.success = false;
    this.error = '';
  }

  logout() {
    this.authService.logout();
  }
}