import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';

import { Categoria } from '../../domain/models/categoria.model';
import { Inventario } from '../../domain/models/inventario.model';
import { Producto } from '../../domain/models/producto.model';
import { ReporteVencimientos } from '../../domain/models/reporte.model';
import { Venta } from '../../domain/models/venta.model';
import { CategoriaApiService } from '../../infrastructure/api/categoria-api.service';
import { InventarioApiService } from '../../infrastructure/api/inventario-api.service';
import { ProductoApiService } from '../../infrastructure/api/producto-api.service';
import { ReporteApiService } from '../../infrastructure/api/reporte-api.service';
import { VentaApiService } from '../../infrastructure/api/venta-api.service';
import { CategoriasComponent } from '../categorias/categorias.component';
import { InventarioComponent } from '../inventario/inventario.component';
import { ProductosComponent } from '../productos/productos.component';
import { ReportesComponent } from '../reportes/reportes.component';
import { UsuariosRegistroComponent } from '../usuarios-registro/usuarios-registro.component';
import { VentasComponent } from '../ventas/ventas.component';

type VistaActual = 'dashboard' | 'usuarios-registro' | 'categorias' | 'productos' | 'inventario' | 'ventas' | 'reportes';

interface MenuItem {
  id: VistaActual;
  label: string;
}

interface ResumenCard {
  titulo: string;
  valor: string;
  descripcion: string;
  icono: 'productos' | 'categorias' | 'alertas' | 'ventas' | 'ingresos' | 'vencimientos';
}

interface ChartBar {
  label: string;
  value: number;
  displayValue: string;
  helper: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CategoriasComponent,
    ProductosComponent,
    InventarioComponent,
    VentasComponent,
    ReportesComponent,
    UsuariosRegistroComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();

  menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'usuarios-registro', label: 'Registrar usuarios' },
    { id: 'categorias', label: 'Categorias' },
    { id: 'productos', label: 'Productos' },
    { id: 'inventario', label: 'Inventario' },
    { id: 'ventas', label: 'Ventas' },
    { id: 'reportes', label: 'Reportes' }
  ];

  vistaActual: VistaActual = 'dashboard';
  roles = this.obtenerRoles();
  sidebarOpen = false;
  cargandoResumen = false;
  mensajeResumen = '';
  ultimaActualizacion = new Date();
  resumenCards: ResumenCard[] = [];
  ventasRecientes: ChartBar[] = [];
  stockProductos: ChartBar[] = [];

  constructor(
    private categoriaApiService: CategoriaApiService,
    private productoApiService: ProductoApiService,
    private inventarioApiService: InventarioApiService,
    private ventaApiService: VentaApiService,
    private reporteApiService: ReporteApiService
  ) {}

  ngOnInit(): void {
    this.cargarResumen();
  }

  get tituloVistaActual(): string {
    return this.menuItemsVisibles.find((item) => item.id === this.vistaActual)?.label ?? 'Dashboard';
  }

  get menuItemsVisibles(): MenuItem[] {
    if (this.esAdmin()) {
      return this.menuItems;
    }

    return this.menuItems.filter((item) => ['dashboard', 'productos', 'inventario', 'ventas'].includes(item.id));
  }

  get rolPrincipal(): string {
    return this.roles[0] ?? 'USUARIO';
  }

  get descripcionVistaActual(): string {
    const descripciones: Record<VistaActual, string> = {
      dashboard: 'Resumen general de la farmacia con indicadores y graficos simples.',
      'usuarios-registro': 'Creacion de usuarios internos con acceso controlado por rol.',
      categorias: 'Gestion de categorias registradas en el sistema.',
      productos: 'Control de medicamentos y productos disponibles.',
      inventario: 'Seguimiento de stock, alertas y movimientos clave.',
      ventas: 'Registro de ventas y consulta de historiales.',
      reportes: 'Presentacion clara de reportes sin exponer JSON crudo.'
    };

    return descripciones[this.vistaActual];
  }

  cambiarVista(vista: VistaActual): void {
    if (!this.menuItemsVisibles.some((item) => item.id === vista)) {
      this.vistaActual = 'dashboard';
      return;
    }

    this.vistaActual = vista;
    this.sidebarOpen = false;

    if (vista === 'dashboard') {
      this.cargarResumen();
    }
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  cerrarSidebar(): void {
    this.sidebarOpen = false;
  }

  cerrarSesion(): void {
    this.cerrar.emit();
  }

  cargarResumen(): void {
    this.cargandoResumen = true;
    this.mensajeResumen = '';

    forkJoin({
      categorias: this.esAdmin()
        ? this.categoriaApiService.listar().pipe(catchError((error) => this.handleDashboardError('categorias', error, [] as Categoria[])))
        : of([] as Categoria[]),
      productos: this.productoApiService.listar().pipe(catchError((error) => this.handleDashboardError('productos', error, [] as Producto[]))),
      inventario: this.inventarioApiService.listar().pipe(catchError((error) => this.handleDashboardError('inventario', error, [] as Inventario[]))),
      alertas: this.inventarioApiService.alertas().pipe(catchError((error) => this.handleDashboardError('alertas', error, [] as Inventario[]))),
      ventas: this.esAdmin()
        ? this.ventaApiService.listar().pipe(catchError((error) => this.handleDashboardError('ventas', error, [] as Venta[])))
        : of([] as Venta[]),
      vencimientos: this.esAdmin()
        ? this.reporteApiService.vencimientos().pipe(
            catchError((error) => this.handleDashboardError('vencimientos', error, { fechaLimite: '', productos: [] } as ReporteVencimientos))
          )
        : of({ fechaLimite: '', productos: [] } as ReporteVencimientos)
    }).subscribe(({ categorias, productos, inventario, alertas, ventas, vencimientos }) => {
      const totalIngresos = ventas.reduce((acumulado, venta) => acumulado + Number(venta.total ?? 0), 0);
      const productosBajoStock = alertas.length || inventario.filter((item) => item.stock <= item.stockMinimo).length;
      const productosPorVencer = vencimientos.productos.length;

      this.resumenCards = [
        {
          titulo: 'Alertas de stock',
          valor: this.formatearNumero(productosBajoStock),
          descripcion: 'Alertas detectadas',
          icono: 'alertas'
        },
        {
          titulo: 'Total de ventas',
          valor: this.formatearNumero(ventas.length),
          descripcion: 'Ventas realizadas',
          icono: 'ventas'
        },
        {
          titulo: 'Ingresos',
          valor: this.formatearMoneda(totalIngresos),
          descripcion: 'Total vendido',
          icono: 'ingresos'
        },
        {
          titulo: 'Proximos a vencer',
          valor: this.formatearNumero(productosPorVencer),
          descripcion: 'Vencimientos proximos',
          icono: 'vencimientos'
        }
      ];

      this.ventasRecientes = this.construirGraficoVentas(ventas);
      this.stockProductos = this.construirGraficoStock(inventario);
      this.ultimaActualizacion = new Date();
      this.cargandoResumen = false;

      if (
        categorias.length === 0 &&
        productos.length === 0 &&
        inventario.length === 0 &&
        ventas.length === 0 &&
        productosPorVencer === 0
      ) {
        this.mensajeResumen = 'No se encontraron datos para poblar el resumen inicial.';
      }
    });
  }

  getBarHeight(value: number, collection: ChartBar[]): string {
    const max = Math.max(...collection.map((item) => item.value), 1);
    return `${Math.max((value / max) * 100, 14)}%`;
  }

  getBarWidth(value: number, collection: ChartBar[]): string {
    const max = Math.max(...collection.map((item) => item.value), 1);
    return `${Math.max((value / max) * 100, 16)}%`;
  }

  private obtenerRoles(): string[] {
    const roles = localStorage.getItem('roles');
    return roles ? JSON.parse(roles) : [];
  }

  private esAdmin(): boolean {
    return this.roles.includes('ADMIN');
  }

  private handleDashboardError<T>(origen: string, error: unknown, fallback: T) {
    console.error(`Error al cargar ${origen} en dashboard`, error);
    return of(fallback);
  }

  private construirGraficoVentas(ventas: Venta[]): ChartBar[] {
    const agrupadas = ventas.reduce<Record<string, number>>((acumulado, venta) => {
      const fecha = (venta.fecha ?? '').slice(0, 10);
      if (!fecha) {
        return acumulado;
      }

      acumulado[fecha] = (acumulado[fecha] ?? 0) + Number(venta.total ?? 0);
      return acumulado;
    }, {});

    return Object.entries(agrupadas)
      .sort(([fechaA], [fechaB]) => fechaA.localeCompare(fechaB))
      .slice(-6)
      .map(([fecha, total]) => ({
        label: this.formatearFechaCorta(fecha),
        value: total,
        displayValue: this.formatearMoneda(total),
        helper: 'Ventas por fecha'
      }));
  }

  private construirGraficoStock(inventario: Inventario[]): ChartBar[] {
    return [...inventario]
      .sort((itemA, itemB) => itemB.stock - itemA.stock)
      .slice(0, 5)
      .map((item) => ({
        label: item.producto?.nombre ?? 'Producto',
        value: item.stock,
        displayValue: `${item.stock} unidades`,
        helper: `Stock minimo: ${item.stockMinimo}`
      }));
  }

  private formatearNumero(valor: number): string {
    return new Intl.NumberFormat('es-PE').format(valor);
  }

  private formatearMoneda(valor: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(valor);
  }

  private formatearFechaCorta(fecha: string): string {
    const fechaFormateada = new Date(`${fecha}T00:00:00`);

    if (Number.isNaN(fechaFormateada.getTime())) {
      return fecha;
    }

    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit'
    }).format(fechaFormateada);
  }
}
