import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  formLogin!: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.formLogin = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.formLogin.invalid) return;

    this.loading = true;
    this.error = '';

    const { email, password } = this.formLogin.value;

    this.authService.login(email, password).subscribe({
      next: (response) => {
        const rol = this.authService.obtenerRol();
        
        switch (rol) {
          case 'admin':
            this.router.navigate(['/admin/dashboard']);
            break;
          case 'operador':
            this.router.navigate(['/operador/encomiendas']);
            break;
          case 'chofer':
            this.router.navigate(['/chofer/asignadas']);
            break;
          default:
            this.router.navigate(['/usuario/tracking']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Error al iniciar sesión';
      }
    });
  }
}