import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TrackingService } from '../../../services/tracking.service';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tracking.html',
  styleUrls: ['./tracking.css']
})
export class TrackingComponent implements OnInit {
  formTracking!: FormGroup;
  encomienda: any = null;
  historial: any[] = [];
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private trackingService: TrackingService
  ) {
    this.initForm();
  }

  ngOnInit() {
  }

  initForm() {
    this.formTracking = this.fb.group({
      codigo: ['', Validators.required]
    });
  }

  buscar() {
    const codigo = this.formTracking.value.codigo.trim();
    if (!codigo) return;

    this.loading = true;
    this.error = '';
    this.encomienda = null;

    this.trackingService.rastrearPorCodigo(codigo).subscribe({
      next: (response) => {
        this.loading = false;
        if (response && response.encomienda) {
          this.encomienda = response.encomienda;
          this.historial = response.historial || [];
        } else {
          this.error = 'Encomienda no encontrada';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Encomienda no encontrada';
      }
    });
  }

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
}