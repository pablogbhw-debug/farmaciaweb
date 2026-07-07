import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { RegisterRequest } from '../../domain/models/auth.model';
import { Rol, Usuario, UsuarioRequest } from '../../domain/models/usuario.model';
import { AuthApiService } from '../../infrastructure/api/auth-api.service';
import { UsuarioApiService } from '../../infrastructure/api/usuario-api.service';

@Component({
  selector: 'app-usuarios-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuarios-registro.component.html',
  styleUrl: './usuarios-registro.component.css'
})
export class UsuariosRegistroComponent {
  private readonly fb = inject(FormBuilder);

  cargando = false;
  mensajeExito = '';
  mensajeError = '';
  usuarioEditandoId: number | null = null;
  usuarios: Usuario[] = [];
  roles: Rol[] = [];

  formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rol: ['EMPLEADO', Validators.required],
    estado: [true as boolean | null, Validators.required]
  });

  constructor(
    private authApiService: AuthApiService,
    private usuarioApiService: UsuarioApiService
  ) {}

  ngOnInit(): void {
    this.listar();
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.mensajeExito = '';
    this.mensajeError = '';

    const peticion = this.usuarioEditandoId
      ? this.usuarioApiService.actualizar(this.usuarioEditandoId, this.construirUsuarioRequest())
      : this.authApiService.register(this.formulario.getRawValue() as RegisterRequest);

    peticion.subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeExito = this.usuarioEditandoId ? 'Usuario actualizado correctamente.' : 'Usuario registrado correctamente.';
        this.limpiar();
        this.listar();
      },
      error: (error) => {
        console.error('Error al guardar usuario', error);
        this.cargando = false;
        this.mensajeError = error?.error || 'No se pudo guardar el usuario.';
      }
    });
  }

  listar(): void {
    this.usuarioApiService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.roles = this.extraerRoles(data);
        this.mensajeError = '';
      },
      error: (error) => {
        console.error('Error al listar usuarios', error);
        this.mensajeError = error?.error || 'No se pudo listar los usuarios.';
      }
    });
  }

  editar(usuario: Usuario): void {
    this.usuarioEditandoId = usuario.idUsuario ?? null;
    this.formulario.patchValue({
      nombre: usuario.nombre,
      email: usuario.email,
      password: '',
      rol: usuario.rol.nombre,
      estado: usuario.estado
    });
    this.actualizarValidadoresPassword();
  }

  eliminar(idUsuario?: number): void {
    if (!idUsuario) {
      return;
    }

    this.usuarioApiService.eliminar(idUsuario).subscribe({
      next: (mensaje) => {
        this.mensajeExito = mensaje || 'Usuario eliminado correctamente.';
        this.mensajeError = '';
        this.listar();
        if (this.usuarioEditandoId === idUsuario) {
          this.limpiar();
        }
      },
      error: (error) => {
        console.error('Error al eliminar usuario', error);
        this.mensajeExito = '';
        this.mensajeError = error?.error || 'No se pudo eliminar el usuario.';
      }
    });
  }

  limpiar(): void {
    this.usuarioEditandoId = null;
    this.formulario.reset({
      nombre: '',
      email: '',
      password: '',
      rol: 'EMPLEADO',
      estado: true
    });
    this.actualizarValidadoresPassword();
  }

  campoInvalido(nombreCampo: 'nombre' | 'email' | 'password' | 'rol' | 'estado'): boolean {
    const control = this.formulario.get(nombreCampo);
    return !!control && control.invalid && control.touched;
  }

  private construirUsuarioRequest(): UsuarioRequest {
    const formValue = this.formulario.getRawValue();
    const rol = this.roles.find((item) => item.nombre === formValue.rol);
    const usuario: UsuarioRequest = {
      nombre: formValue.nombre ?? '',
      email: formValue.email ?? '',
      estado: !!formValue.estado,
      rol: {
        idRol: rol?.idRol,
        nombre: formValue.rol ?? 'EMPLEADO'
      }
    };

    if (formValue.password) {
      usuario.password = formValue.password;
    }

    return usuario;
  }

  private extraerRoles(usuarios: Usuario[]): Rol[] {
    const rolesPorNombre = new Map<string, Rol>();

    for (const usuario of usuarios) {
      if (usuario.rol?.nombre && !rolesPorNombre.has(usuario.rol.nombre)) {
        rolesPorNombre.set(usuario.rol.nombre, usuario.rol);
      }
    }

    if (!rolesPorNombre.has('EMPLEADO')) {
      rolesPorNombre.set('EMPLEADO', { nombre: 'EMPLEADO' });
    }
    if (!rolesPorNombre.has('ADMIN')) {
      rolesPorNombre.set('ADMIN', { nombre: 'ADMIN' });
    }

    return Array.from(rolesPorNombre.values());
  }

  private actualizarValidadoresPassword(): void {
    const passwordControl = this.formulario.get('password');
    passwordControl?.setValidators(
      this.usuarioEditandoId
        ? [Validators.minLength(6)]
        : [Validators.required, Validators.minLength(6)]
    );
    passwordControl?.updateValueAndValidity();
  }
}
