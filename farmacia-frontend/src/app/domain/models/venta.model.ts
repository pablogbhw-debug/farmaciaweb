export interface VentaDetalleRequest {
  idProducto: number;
  cantidad: number;
}

export interface VentaRequest {
  idUsuario: number;
  metodoPago: string;
  detalle: VentaDetalleRequest[];
}

export interface VentaDetalle {
  idDetalle?: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  producto?: {
    idProducto?: number;
    nombre: string;
  };
}

export interface Venta {
  idVenta?: number;
  fecha: string;
  total: number;
  metodoPago: string;
  usuario?: {
    idUsuario?: number;
    nombre: string;
  };
  detalles: VentaDetalle[];
}
