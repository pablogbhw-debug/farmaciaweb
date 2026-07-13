import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Inventario, InventarioRequest } from '../../domain/models/inventario.model';
import { Producto } from '../../domain/models/producto.model';
import { InventarioApiService } from '../../infrastructure/api/inventario-api.service';
import { ProductoApiService } from '../../infrastructure/api/producto-api.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
export class InventarioComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  productos: Producto[] = [];
  inventario: Inventario[] = [];
  alertas: Inventario[] = [];
  inventarioEditandoId: number | null = null;
  mensajeExito = '';
  mensajeError = '';

  formulario = this.fb.group({
    idProducto: [null as number | null, [Validators.required, Validators.min(1)]],
    stock: [null as number | null, [Validators.required, Validators.min(0)]],
    stockMinimo: [null as number | null, [Validators.required, Validators.min(0)]]
  });

  constructor(
    private productoApiService: ProductoApiService,
    private inventarioApiService: InventarioApiService
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
    this.listar();
    this.verAlertas();
  }

  guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const formValue = this.formulario.getRawValue();
    const request: InventarioRequest = {
      idProducto: Number(formValue.idProducto),
      stock: Number(formValue.stock),
      stockMinimo: Number(formValue.stockMinimo)
    };

    const peticion = this.inventarioEditandoId
      ? this.inventarioApiService.actualizar(this.inventarioEditandoId, request)
      : this.inventarioApiService.crear(request);

    peticion.subscribe({
      next: () => {
        this.mensajeExito = this.inventarioEditandoId ? 'Inventario actualizado correctamente.' : 'Inventario creado correctamente.';
        this.mensajeError = '';
        this.limpiar();
        this.listar();
        this.verAlertas();
      },
      error: (error) => {
        console.error('Error al guardar inventario', error);
        this.mensajeExito = '';
        this.mensajeError = error?.error || 'No se pudo guardar el inventario.';
      }
    });
  }

  listar(): void {
    this.inventarioApiService.listar().subscribe({
      next: (data) => {
        this.inventario = data;
      },
      error: (error) => {
        console.error('Error al listar inventario', error);
        this.mensajeError = error?.error || 'No se pudo listar el inventario.';
      }
    });
  }

  editar(item: Inventario): void {
    this.inventarioEditandoId = item.idInventario ?? null;
    this.formulario.patchValue({
      idProducto: item.producto?.idProducto ?? null,
      stock: item.stock,
      stockMinimo: item.stockMinimo
    });
  }

  verAlertas(): void {
    this.inventarioApiService.alertas().subscribe({
      next: (data) => {
        this.alertas = data;
      },
      error: (error) => {
        console.error('Error al obtener alertas de inventario', error);
        this.mensajeError = error?.error || 'No se pudo obtener las alertas.';
      }
    });
  }

  limpiar(): void {
    this.inventarioEditandoId = null;
    this.formulario.reset({ idProducto: null, stock: null, stockMinimo: null });
  }

  campoInvalido(nombreCampo: 'idProducto' | 'stock' | 'stockMinimo'): boolean {
    const control = this.formulario.get(nombreCampo);
    return !!control && control.invalid && control.touched;
  }

  private cargarProductos(): void {
    this.productoApiService.listar().subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (error) => {
        console.error('Error al cargar productos para inventario', error);
        this.mensajeError = 'No se pudo cargar los productos.';
      }
    });
  }
}
