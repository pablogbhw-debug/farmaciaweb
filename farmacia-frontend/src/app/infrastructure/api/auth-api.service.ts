import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { API_URL } from './api.config';
import { LoginRequest, RegisterRequest, TokenResponse } from '../../domain/models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthApiService {
  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<TokenResponse> {
    return this.http.post<TokenResponse>(`${API_URL}/auth/login`, request);
  }

  register(request: RegisterRequest): Observable<unknown> {
    return this.http.post(`${API_URL}/auth/register`, request, this.getHeaders());
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
