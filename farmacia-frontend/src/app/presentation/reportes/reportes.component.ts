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

  async descargarReporteVentasPdf(): Promise<void> {
    if (!this.ventasReporte) {
      return;
    }

    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ]);
    const documento = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const fechaGeneracion = new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(new Date());
    const formatoMoneda = new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    });

    documento.setFontSize(18);
    documento.setTextColor(23, 63, 76);
    documento.text('Reporte de ventas', 14, 17);

    documento.setFontSize(10);
    documento.setTextColor(80, 96, 112);
    documento.text(`Generado: ${fechaGeneracion}`, 14, 24);
    documento.text(`Cantidad de ventas: ${this.ventasReporte.cantidadVentas}`, 14, 30);
    documento.text(`Total vendido: ${formatoMoneda.format(this.totalVendido)}`, 14, 36);

    autoTable(documento, {
      startY: 43,
      head: [['ID', 'Usuario', 'Fecha', 'Metodo de pago', 'Total']],
      body: this.ventas.map((venta) => [
        venta.idVenta ?? '-',
        venta.usuario?.nombre ?? 'Sin usuario',
        this.formatearFechaPdf(venta.fecha),
        venta.metodoPago,
        formatoMoneda.format(Number(venta.total ?? 0))
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [45, 106, 79],
        textColor: [255, 255, 255]
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      },
      columnStyles: {
        0: { cellWidth: 22 },
        4: { halign: 'right', cellWidth: 35 }
      }
    });

    const totalPaginas = documento.getNumberOfPages();
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      documento.setPage(pagina);
      documento.setFontSize(8);
      documento.setTextColor(100, 100, 100);
      documento.text(
        `Pagina ${pagina} de ${totalPaginas}`,
        documento.internal.pageSize.getWidth() - 14,
        documento.internal.pageSize.getHeight() - 8,
        { align: 'right' }
      );
    }

    documento.save(`reporte-ventas-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  private formatearFechaPdf(fecha: string): string {
    const fechaVenta = new Date(fecha);
    return Number.isNaN(fechaVenta.getTime())
      ? fecha
      : new Intl.DateTimeFormat('es-PE', {
          dateStyle: 'short',
          timeStyle: 'short'
        }).format(fechaVenta);
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
