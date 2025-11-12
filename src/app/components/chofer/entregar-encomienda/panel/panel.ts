import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { EncomiendaService } from '../../../../services/encomienda.service';

@Component({
  selector: 'app-chofer-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './panel.html',
  styleUrls: ['./panel.css']
})
export class ChoferPanelComponent implements OnInit {
  usuario: any = null;
  encomiendas: any[] = [];
  loading = false;
  formEntrega!: FormGroup;
  entregaSeleccionada: any = null;

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
    if (!this.usuario || this.usuario.rol !== 'chofer') {
      this.router.navigate(['/login']);
      return;
    }
    this.cargarEncomiendas();
  }

  initForm() {
    this.formEntrega = this.fb.group({
      nombreRecibidor: ['', Validators.required],
      rutRecibidor: [''],
      notas: ['']
    });
  }

 cargarEncomiendas() {
  this.loading = true;
  this.encomiendaService.obtenerEncomiendas().subscribe({
    next: (response: any) => {
      if (response.success && response.encomiendas) {
        this.encomiendas = response.encomiendas.filter((e: any) => e.estado === 'en_transito');
      } else {
        this.encomiendas = [];
      }
      this.loading = false;
    },
    error: (err: any) => {
      console.error('Error:', err);
      this.encomiendas = [];
      this.loading = false;
    }
  });
}

  seleccionarEntrega(encomienda: any) {
    this.entregaSeleccionada = encomienda;
  }

  confirmarEntrega() {
    if (this.formEntrega.invalid || !this.entregaSeleccionada) return;

    this.loading = true;
    const datos = {
      nombreRecibidor: this.formEntrega.value.nombreRecibidor,
      rutRecibidor: this.formEntrega.value.rutRecibidor,
      notas: this.formEntrega.value.notas
    };

    this.encomiendaService.marcarEntregada(this.entregaSeleccionada.id, datos).subscribe({
      next: () => {
        this.loading = false;
        this.formEntrega.reset();
        this.entregaSeleccionada = null;
        this.cargarEncomiendas();
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
      }
    });
  }

  cancelar() {
    this.entregaSeleccionada = null;
    this.formEntrega.reset();
  }

  logout() {
    this.authService.logout();
  }
}