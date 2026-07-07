import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { Producto } from '../../domain/models/producto.model';
import { Venta } from '../../domain/models/venta.model';
import { Inventario } from '../../domain/models/inventario.model';

import { ReporteInventario, ReporteVencimientos, ReporteVentas } from '../../domain/models/reporte.model';
import { ReporteApiService } from '../../infrastructure/api/reporte-api.service';

type TipoReporte = 'ventas' | 'inventario' | 'vencimientos' | '';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent {
  tipoReporte: TipoReporte = '';
  ventasReporte: ReporteVentas | null = null;
  inventarioReporte: ReporteInventario | null = null;
  vencimientosReporte: ReporteVencimientos | null = null;
  mensajeError = '';

  constructor(private reporteApiService: ReporteApiService) {}

  get ventas(): Venta[] {
    return this.ventasReporte?.ventas ?? [];
  }

  get inventario(): Inventario[] {
    return this.inventarioReporte?.inventario ?? [];
  }

  get productosVencimiento(): Producto[] {
    return this.vencimientosReporte?.productos ?? [];
  }

  get totalVendido(): number {
    return this.ventas.reduce((acumulado, venta) => acumulado + Number(venta.total ?? 0), 0);
  }

  get inventarioConAlerta(): number {
    return this.inventario.filter((item) => item.stock <= item.stockMinimo).length;
  }

  cargarReporteVentas(): void {
    this.reporteApiService.ventas().subscribe({
      next: (data) => {
        this.tipoReporte = 'ventas';
        this.ventasReporte = data;
        this.inventarioReporte = null;
        this.vencimientosReporte = null;
        this.mensajeError = '';
      },
      error: (error) => {
        console.error('Error al cargar reporte de ventas', error);
        this.mensajeError = error?.error || 'No se pudo cargar el reporte de ventas.';
      }
    });
  }

  cargarReporteInventario(): void {
    this.reporteApiService.inventario().subscribe({
      next: (data) => {
        this.tipoReporte = 'inventario';
        this.inventarioReporte = data;
        this.ventasReporte = null;
        this.vencimientosReporte = null;
        this.mensajeError = '';
      },
      error: (error) => {
        console.error('Error al cargar reporte de inventario', error);
        this.mensajeError = error?.error || 'No se pudo cargar el reporte de inventario.';
      }
    });
  }

  cargarReporteVencimientos(): void {
    this.reporteApiService.vencimientos().subscribe({
      next: (data) => {
        this.tipoReporte = 'vencimientos';
        this.vencimientosReporte = data;
        this.ventasReporte = null;
        this.inventarioReporte = null;
        this.mensajeError = '';
      },
      error: (error) => {
        console.error('Error al cargar reporte de vencimientos', error);
        this.mensajeError = error?.error || 'No se pudo cargar el reporte de vencimientos.';
      }
    });
  }
}
