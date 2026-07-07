import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ReporteInventario, ReporteVencimientos, ReporteVentas } from '../../domain/models/reporte.model';
import { API_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class ReporteApiService {
  constructor(private http: HttpClient) {}

  ventas(): Observable<ReporteVentas> {
    return this.http.get<ReporteVentas>(`${API_URL}/api/reportes/ventas`, this.getHeaders());
  }

  inventario(): Observable<ReporteInventario> {
    return this.http.get<ReporteInventario>(`${API_URL}/api/reportes/inventario`, this.getHeaders());
  }

  vencimientos(): Observable<ReporteVencimientos> {
    return this.http.get<ReporteVencimientos>(`${API_URL}/api/reportes/vencimientos`, this.getHeaders());
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
