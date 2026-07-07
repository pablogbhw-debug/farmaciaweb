import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Producto, ProductoRequest } from '../../domain/models/producto.model';
import { API_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class ProductoApiService {
  constructor(private http: HttpClient) {}

  listar(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${API_URL}/api/productos`, this.getHeaders());
  }

  crear(producto: ProductoRequest): Observable<Producto> {
    return this.http.post<Producto>(`${API_URL}/api/productos`, producto, this.getHeaders());
  }

  actualizar(id: number, producto: ProductoRequest): Observable<Producto> {
    return this.http.put<Producto>(`${API_URL}/api/productos/${id}`, producto, this.getHeaders());
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete(`${API_URL}/api/productos/${id}`, {
      ...this.getHeaders(),
      responseType: 'text'
    });
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }
}
