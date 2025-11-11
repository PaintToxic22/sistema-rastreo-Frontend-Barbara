import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { EncomiendaService } from '../../../services/encomienda';

@Component({
  selector: 'app-crear-encomienda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-encomienda.html',
  styleUrls: ['./crear-encomienda.css']
})
export class CrearEncomiendaComponent {
  formEncomienda!: FormGroup;
  loading = false;
  error = '';
  success = false;
  codigoSeguimiento = '';

  constructor(
    private fb: FormBuilder,
    private encomiendaService: EncomiendaService,
    private router: Router
  ) {
    this.initForm();
  }

  initForm() {
    this.formEncomienda = this.fb.group({
      remitenteNombre: ['', Validators.required],
      remitenteTelefono: [''],
      remitenteCity: ['', Validators.required],
      remitenteAddress: ['', Validators.required],
      destinatarioNombre: ['', Validators.required],
      destinatarioTelefono: [''],
      destinatarioCity: ['', Validators.required],
      destinatarioAddress: ['', Validators.required],
      descripcion: ['', Validators.required],
      peso: [''],
      valor: ['', [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit() {
    if (this.formEncomienda.invalid) return;

    this.loading = true;
    this.error = '';

    const datos = {
      remitente: {
        nombre: this.formEncomienda.value.remitenteNombre,
        telefono: this.formEncomienda.value.remitenteTelefono,
        ciudad: this.formEncomienda.value.remitenteCity,
        direccion: this.formEncomienda.value.remitenteAddress
      },
      destinatario: {
        nombre: this.formEncomienda.value.destinatarioNombre,
        telefono: this.formEncomienda.value.destinatarioTelefono,
        ciudad: this.formEncomienda.value.destinatarioCity,
        direccion: this.formEncomienda.value.destinatarioAddress
      },
      descripcion: this.formEncomienda.value.descripcion,
      peso: this.formEncomienda.value.peso || 0,
      valor: parseInt(this.formEncomienda.value.valor)
    };

    this.encomiendaService.crearEncomienda(datos).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = true;
        this.codigoSeguimiento = response.codigoSeguimiento;
        
        setTimeout(() => {
          this.router.navigate(['/operador/encomiendas']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al crear encomienda';
      }
    });
  }

  volver() {
    this.router.navigate(['/operador/encomiendas']);
  }
}