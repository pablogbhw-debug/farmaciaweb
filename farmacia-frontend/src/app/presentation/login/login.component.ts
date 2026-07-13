import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthApiService } from '../../infrastructure/api/auth-api.service';
import { LoginRequest } from '../../domain/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  @Output() loginExitoso = new EventEmitter<void>();
  private readonly fb = inject(FormBuilder);

  mensajeError = '';
  cargando = false;

  formulario = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  constructor(
    private authApiService: AuthApiService
  ) {}

  iniciarSesion(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.mensajeError = '';
    this.cargando = true;

    this.authApiService.login(this.formulario.getRawValue() as LoginRequest).subscribe({
      next: (respuesta) => {
        localStorage.setItem('token', respuesta.token);
        localStorage.setItem('roles', JSON.stringify(respuesta.roles ?? []));
        localStorage.setItem('username', respuesta.username);
        this.cargando = false;
        this.loginExitoso.emit();
      },
      error: (error) => {
        console.error('Error al iniciar sesion', error);
        this.cargando = false;
        this.mensajeError = 'Usuario o contrasena incorrectos.';
      }
    });
  }

  campoInvalido(nombreCampo: 'username' | 'password'): boolean {
    const control = this.formulario.get(nombreCampo);
    return !!control && control.invalid && control.touched;
  }
}
