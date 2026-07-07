import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Inventario, InventarioRequest } from '../../domain/models/inventario.model';
import { API_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class InventarioApiService {
  constructor(private http: HttpClient) {}

  listar(): Observable<Inventario[]> {
    return this.http.get<Inventario[]>(`${API_URL}/api/inventario`, this.getHeaders());
  }

  crear(request: InventarioRequest): Observable<Inventario> {
    return this.http.post<Inventario>(`${API_URL}/api/inventario`, request, this.getHeaders());
  }

  actualizar(id: number, request: InventarioRequest): Observable<Inventario> {
    return this.http.put<Inventario>(`${API_URL}/api/inventario/${id}`, request, this.getHeaders());
  }

  alertas(): Observable<Inventario[]> {
    return this.http.get<Inventario[]>(`${API_URL}/api/inventario/alertas`, this.getHeaders());
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
