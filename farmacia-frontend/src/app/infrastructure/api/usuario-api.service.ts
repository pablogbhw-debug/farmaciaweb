import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Usuario, UsuarioRequest, UsuarioVenta } from '../../domain/models/usuario.model';
import { API_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class UsuarioApiService {
  constructor(private http: HttpClient) {}

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${API_URL}/api/usuarios`, this.getHeaders());
  }

  listarParaVentas(): Observable<UsuarioVenta[]> {
    return this.http.get<UsuarioVenta[]>(`${API_URL}/api/usuarios/para-ventas`, this.getHeaders());
  }

  actualizar(id: number, usuario: UsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${API_URL}/api/usuarios/${id}`, usuario, this.getHeaders());
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete(`${API_URL}/api/usuarios/${id}`, {
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
