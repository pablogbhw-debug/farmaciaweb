import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Venta, VentaRequest } from '../../domain/models/venta.model';
import { API_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class VentaApiService {
  constructor(private http: HttpClient) {}

  registrar(request: VentaRequest): Observable<Venta> {
    return this.http.post<Venta>(`${API_URL}/api/ventas`, request, this.getHeaders());
  }

  listar(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${API_URL}/api/ventas`, this.getHeaders());
  }

  listarPorFecha(inicio: string, fin: string): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${API_URL}/api/ventas/fecha?inicio=${inicio}&fin=${fin}`, this.getHeaders());
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
