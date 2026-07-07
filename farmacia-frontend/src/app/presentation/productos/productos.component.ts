import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Categoria } from '../../domain/models/categoria.model';
import { Producto, ProductoRequest } from '../../domain/models/producto.model';
import { CategoriaApiService } from '../../infrastructure/api/categoria-api.service';
import { ProductoApiService } from '../../infrastructure/api/producto-api.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  categorias: Categoria[] = [];
  productos: Producto[] = [];
  productoEditandoId: number | null = null;
  mensajeExito = '';
  mensajeError = '';

  formulario = this.fb.group({
    idCategoria: [null as number | null, [Validators.required, Validators.min(1)]],
    nombre: ['', Validators.required],
    descripcion: [''],
    precio: [null as number | null, [Validators.required, Validators.min(0.01)]],
    fechaVencimiento: ['', Validators.required],
    estado: [true as boolean | null, Validators.required]
  });

  constructor(
    private categoriaApiService: CategoriaApiService,
    private productoApiService: ProductoApiService
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.listar();
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const formValue = this.formulario.getRawValue();
    const producto: ProductoRequest = {
      categoria: { idCategoria: Number(formValue.idCategoria) },
      nombre: formValue.nombre ?? '',
      descripcion: formValue.descripcion ?? '',
      precio: Number(formValue.precio),
      fechaVencimiento: formValue.fechaVencimiento ?? '',
      estado: !!formValue.estado
    };

    const peticion = this.productoEditandoId
      ? this.productoApiService.actualizar(this.productoEditandoId, producto)
      : this.productoApiService.crear(producto);

    peticion.subscribe({
      next: () => {
        this.mensajeExito = this.productoEditandoId ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.';
        this.mensajeError = '';
        this.limpiar();
        this.listar();
      },
      error: (error) => {
        console.error('Error al guardar producto', error);
        this.mensajeExito = '';
        this.mensajeError = error?.error || 'No se pudo guardar el producto.';
      }
    });
  }

  listar(): void {
    this.productoApiService.listar().subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (error) => {
        console.error('Error al listar productos', error);
        this.mensajeError = error?.error || 'No se pudo listar los productos.';
      }
    });
  }

  editar(producto: Producto): void {
    this.productoEditandoId = producto.idProducto ?? null;
    this.formulario.patchValue({
      idCategoria: producto.categoria?.idCategoria ?? null,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      fechaVencimiento: producto.fechaVencimiento,
      estado: producto.estado
    });
  }

  eliminar(idProducto?: number): void {
    if (!idProducto) {
      return;
    }

    this.productoApiService.eliminar(idProducto).subscribe({
      next: (mensaje) => {
        this.mensajeExito = mensaje || 'Producto eliminado correctamente.';
        this.mensajeError = '';
        this.listar();
        if (this.productoEditandoId === idProducto) {
          this.limpiar();
        }
      },
      error: (error) => {
        console.error('Error al eliminar producto', error);
        this.mensajeExito = '';
        this.mensajeError = error?.error || 'No se pudo eliminar el producto.';
      }
    });
  }

  limpiar(): void {
    this.productoEditandoId = null;
    this.formulario.reset({
      idCategoria: null,
      nombre: '',
      descripcion: '',
      precio: null,
      fechaVencimiento: '',
      estado: true
    });
  }

  campoInvalido(nombreCampo: 'idCategoria' | 'nombre' | 'precio' | 'fechaVencimiento' | 'estado'): boolean {
    const control = this.formulario.get(nombreCampo);
    return !!control && control.invalid && control.touched;
  }

  private cargarCategorias(): void {
    this.categoriaApiService.listar().subscribe({
      next: (data) => {
        this.categorias = data;
      },
      error: (error) => {
        console.error('Error al cargar categorias para productos', error);
        this.mensajeError = 'No se pudo cargar las categorias.';
      }
    });
  }
}
