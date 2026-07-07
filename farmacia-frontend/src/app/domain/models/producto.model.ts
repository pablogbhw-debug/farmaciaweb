import { Categoria } from './categoria.model';

export interface Producto {
  idProducto?: number;
  categoria: Categoria;
  nombre: string;
  descripcion: string;
  precio: number;
  fechaVencimiento: string;
  estado: boolean;
}

export interface ProductoRequest {
  categoria: { idCategoria: number };
  nombre: string;
  descripcion: string;
  precio: number;
  fechaVencimiento: string;
  estado: boolean;
}
