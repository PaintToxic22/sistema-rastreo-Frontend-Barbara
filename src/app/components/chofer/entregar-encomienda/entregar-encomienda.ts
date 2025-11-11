import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EncomiendaService } from '../../../services/encomienda';

@Component({
  selector: 'app-entregar-encomienda',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './entregar-encomienda.html',
  styleUrls: ['./entregar-encomienda.css']
})
export class EntregarEncomiendaComponent implements OnInit {
  formEntrega!: FormGroup;
  encomienda: any = null;
  loading = false;
  error = '';
  success = false;
  fotoPreview: string | null = null;
  fotoBase64: string | null = null;
  encomiendaId = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private encomiendaService: EncomiendaService
  ) {
    this.initForm();
  }

  ngOnInit() {
    this.encomiendaId = this.route.snapshot.paramMap.get('id') || '';
    this.cargarEncomienda();
  }

  initForm() {
    this.formEntrega = this.fb.group({
      nombreRecibidor: ['', Validators.required],
      rutRecibidor: [''],
      notas: ['']
    });
  }

  cargarEncomienda() {
    this.encomiendaService.obtenerEncomiendaPorId(this.encomiendaId).subscribe({
      next: (response) => {
        this.encomienda = response.encomienda;
      },
      error: (err) => {
        this.error = 'No se pudo cargar la encomienda';
      }
    });
  }

  onFotoSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.fotoPreview = reader.result as string;
        this.fotoBase64 = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  entregarEncomienda() {
    if (this.formEntrega.invalid) return;

    this.loading = true;
    this.error = '';

    const datos = {
      nombreRecibidor: this.formEntrega.value.nombreRecibidor,
      rutRecibidor: this.formEntrega.value.rutRecibidor || null,
      notas: this.formEntrega.value.notas,
      fotoBase64: this.fotoBase64
    };

    this.encomiendaService.marcarEntregada(this.encomiendaId, datos).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/chofer/asignadas']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al entregar encomienda';
      }
    });
  }

  volver() {
    this.router.navigate(['/chofer/asignadas']);
  }
}