import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Categoria } from '../../domain/models/categoria.model';
import { API_URL } from './api.config';

@Injectable({
  providedIn: 'root'
})
export class CategoriaApiService {
  constructor(private http: HttpClient) {}

  listar(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${API_URL}/api/categorias`, this.getHeaders());
  }

  crear(categoria: Categoria): Observable<Categoria> {
    return this.http.post<Categoria>(`${API_URL}/api/categorias`, categoria, this.getHeaders());
  }

  actualizar(id: number, categoria: Categoria): Observable<Categoria> {
    return this.http.put<Categoria>(`${API_URL}/api/categorias/${id}`, categoria, this.getHeaders());
  }

  eliminar(id: number): Observable<string> {
    return this.http.delete(`${API_URL}/api/categorias/${id}`, {
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
