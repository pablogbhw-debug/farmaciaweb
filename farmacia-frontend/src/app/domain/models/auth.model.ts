export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  email: string;
  password: string;
  rol: string;
}

export interface TokenResponse {
  tokenType: string;
  token: string;
  roles: string[];
}
