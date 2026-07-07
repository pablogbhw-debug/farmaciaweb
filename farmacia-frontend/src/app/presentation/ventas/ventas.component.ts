import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Producto } from '../../domain/models/producto.model';
import { Usuario } from '../../domain/models/usuario.model';
import { Venta, VentaRequest } from '../../domain/models/venta.model';
import { ProductoApiService } from '../../infrastructure/api/producto-api.service';
import { UsuarioApiService } from '../../infrastructure/api/usuario-api.service';
import { VentaApiService } from '../../infrastructure/api/venta-api.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.css'
})
export class VentasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  usuarios: Usuario[] = [];
  productos: Producto[] = [];
  ventas: Venta[] = [];
  mensajeExito = '';
  mensajeError = '';

  formulario = this.fb.group({
    idUsuario: [null as number | null, [Validators.required, Validators.min(1)]],
    metodoPago: ['', Validators.required],
    idProducto: [null as number | null, [Validators.required, Validators.min(1)]],
    cantidad: [null as number | null, [Validators.required, Validators.min(1)]]
  });

  filtroForm = this.fb.group({
    inicio: [''],
    fin: ['']
  });

  constructor(
    private usuarioApiService: UsuarioApiService,
    private productoApiService: ProductoApiService,
    private ventaApiService: VentaApiService
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarProductos();
    this.listarVentas();
  }

  registrarVenta(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const formValue = this.formulario.getRawValue();
    const request: VentaRequest = {
      idUsuario: Number(formValue.idUsuario),
      metodoPago: formValue.metodoPago ?? '',
      detalle: [
        {
          idProducto: Number(formValue.idProducto),
          cantidad: Number(formValue.cantidad)
        }
      ]
    };

    this.ventaApiService.registrar(request).subscribe({
      next: () => {
        this.mensajeExito = 'Venta registrada correctamente. El backend descuenta el stock automaticamente.';
        this.mensajeError = '';
        this.limpiar();
        this.listarVentas();
      },
      error: (error) => {
        console.error('Error al registrar venta', error);
        this.mensajeExito = '';
        this.mensajeError = error?.error || 'No se pudo registrar la venta.';
      }
    });
  }

  listarVentas(): void {
    this.ventaApiService.listar().subscribe({
      next: (data) => {
        this.ventas = data;
      },
      error: (error) => {
        console.error('Error al listar ventas', error);
        this.mensajeError = error?.error || 'No se pudo listar las ventas.';
      }
    });
  }

  buscarPorFechas(): void {
    const inicio = this.filtroForm.get('inicio')?.value;
    const fin = this.filtroForm.get('fin')?.value;

    if (!inicio || !fin) {
      this.mensajeError = 'Selecciona fecha de inicio y fin para filtrar ventas.';
      return;
    }

    this.ventaApiService.listarPorFecha(inicio, fin).subscribe({
      next: (data) => {
        this.ventas = data;
        this.mensajeError = '';
      },
      error: (error) => {
        console.error('Error al buscar ventas por fecha', error);
        this.mensajeError = error?.error || 'No se pudo consultar ventas por fecha.';
      }
    });
  }

  limpiar(): void {
    this.formulario.reset({
      idUsuario: null,
      metodoPago: '',
      idProducto: null,
      cantidad: null
    });
  }

  campoInvalido(nombreCampo: 'idUsuario' | 'metodoPago' | 'idProducto' | 'cantidad'): boolean {
    const control = this.formulario.get(nombreCampo);
    return !!control && control.invalid && control.touched;
  }

  private cargarUsuarios(): void {
    this.usuarioApiService.listar().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (error) => {
        console.error('Error al cargar usuarios para ventas', error);
        this.mensajeError = 'No se pudo cargar los usuarios.';
      }
    });
  }

  private cargarProductos(): void {
    this.productoApiService.listar().subscribe({
      next: (data) => {
        this.productos = data;
      },
      error: (error) => {
        console.error('Error al cargar productos para ventas', error);
        this.mensajeError = 'No se pudo cargar los productos.';
      }
    });
  }
}
