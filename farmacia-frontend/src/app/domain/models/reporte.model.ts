import { Inventario } from './inventario.model';
import { Producto } from './producto.model';
import { Venta } from './venta.model';

export interface ReporteVentas {
  cantidadVentas: number;
  ventas: Venta[];
}

export interface ReporteInventario {
  cantidadRegistros: number;
  inventario: Inventario[];
}

export interface ReporteVencimientos {
  fechaLimite: string;
  productos: Producto[];
}
