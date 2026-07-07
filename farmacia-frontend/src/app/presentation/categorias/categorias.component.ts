import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Categoria } from '../../domain/models/categoria.model';
import { CategoriaApiService } from '../../infrastructure/api/categoria-api.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categorias.component.html',
  styleUrl: './categorias.component.css'
})
export class CategoriasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  categorias: Categoria[] = [];
  categoriaEditandoId: number | null = null;
  mensajeExito = '';
  mensajeError = '';

  formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]]
  });

  constructor(
    private categoriaApiService: CategoriaApiService
  ) {}

  ngOnInit(): void {
    this.listar();
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const categoria: Categoria = {
      nombre: this.formulario.getRawValue().nombre ?? ''
    };

    const peticion = this.categoriaEditandoId
      ? this.categoriaApiService.actualizar(this.categoriaEditandoId, categoria)
      : this.categoriaApiService.crear(categoria);

    peticion.subscribe({
      next: () => {
        this.mensajeExito = this.categoriaEditandoId ? 'Categoria actualizada correctamente.' : 'Categoria creada correctamente.';
        this.mensajeError = '';
        this.limpiar();
        this.listar();
      },
      error: (error) => {
        console.error('Error al guardar categoria', error);
        this.mensajeExito = '';
        this.mensajeError = error?.error || 'No se pudo guardar la categoria.';
      }
    });
  }

  listar(): void {
    this.categoriaApiService.listar().subscribe({
      next: (data) => {
        this.categorias = data;
        this.mensajeError = '';
      },
      error: (error) => {
        console.error('Error al listar categorias', error);
        this.mensajeError = error?.error || 'No se pudo listar las categorias.';
      }
    });
  }

  editar(categoria: Categoria): void {
    this.categoriaEditandoId = categoria.idCategoria ?? null;
    this.formulario.patchValue({ nombre: categoria.nombre });
  }

  eliminar(idCategoria?: number): void {
    if (!idCategoria) {
      return;
    }

    this.categoriaApiService.eliminar(idCategoria).subscribe({
      next: (mensaje) => {
        this.mensajeExito = mensaje || 'Categoria eliminada correctamente.';
        this.mensajeError = '';
        this.listar();
        if (this.categoriaEditandoId === idCategoria) {
          this.limpiar();
        }
      },
      error: (error) => {
        console.error('Error al eliminar categoria', error);
        this.mensajeExito = '';
        this.mensajeError = error?.error || 'No se pudo eliminar la categoria.';
      }
    });
  }

  limpiar(): void {
    this.categoriaEditandoId = null;
    this.formulario.reset();
  }

  campoInvalido(nombreCampo: 'nombre'): boolean {
    const control = this.formulario.get(nombreCampo);
    return !!control && control.invalid && control.touched;
  }
}
