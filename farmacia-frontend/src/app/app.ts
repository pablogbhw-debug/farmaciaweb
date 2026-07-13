import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import { DashboardComponent } from './presentation/dashboard/dashboard.component';
import { LoginComponent } from './presentation/login/login.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LoginComponent, DashboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  authenticated = this.hasToken();

  actualizarSesion(): void {
    this.authenticated = this.hasToken();
  }

  cerrarSesion(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('roles');
    localStorage.removeItem('username');
    this.authenticated = false;
  }

  private hasToken(): boolean {
    const token = localStorage.getItem('token');
    return !!token && token !== 'null' && token !== 'undefined';
  }
}
