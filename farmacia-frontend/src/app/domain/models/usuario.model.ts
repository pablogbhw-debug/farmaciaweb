export interface Rol {
  idRol?: number;
  nombre: string;
}

export interface Usuario {
  idUsuario?: number;
  nombre: string;
  email: string;
  estado: boolean;
  rol: Rol;
}

export interface UsuarioRequest {
  nombre: string;
  email: string;
  password?: string;
  estado: boolean;
  rol: Rol;
}
