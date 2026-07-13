package com.proyecto.farmacia.web;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.farmacia.model.Rol;
import com.proyecto.farmacia.model.Usuario;
import com.proyecto.farmacia.repository.RolRepo;
import com.proyecto.farmacia.repository.UsuarioRepo;
import com.proyecto.farmacia.security.JwtUtil;
import com.proyecto.farmacia.web.dto.LoginRequest;
import com.proyecto.farmacia.web.dto.RegisterRequest;
import com.proyecto.farmacia.web.dto.TokenResponse;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UsuarioRepo usuarioRepo;

    @Autowired
    private RolRepo rolRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (request.getNombre() == null || request.getNombre().isBlank()) {
            return ResponseEntity.badRequest().body("El nombre es obligatorio");
        }
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("El email es obligatorio");
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body("La password es obligatoria");
        }
        if (usuarioRepo.findByNombre(request.getNombre()) != null) {
            return ResponseEntity.badRequest().body("Ya existe un usuario con ese nombre");
        }
        if (usuarioRepo.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Ya existe un usuario con ese email");
        }

        String nombreRol = request.getRol() == null || request.getRol().isBlank()
                ? "EMPLEADO"
                : request.getRol().trim().toUpperCase();

        Rol rol = rolRepo.findByNombre(nombreRol);
        if (rol == null) {
            rol = new Rol();
            rol.setNombre(nombreRol);
            rol = rolRepo.save(rol);
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setEmail(request.getEmail());
        usuario.setPassword(passwordEncoder.encode(request.getPassword()));
        usuario.setEstado(true);
        usuario.setRol(rol);

        Usuario guardado = usuarioRepo.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String token = jwtUtil.generateToken(userDetails);
        List<String> roles = userDetails.getAuthorities()
                .stream()
                .map(GrantedAuthority::getAuthority)
                .map(role -> role.replace("ROLE_", ""))
                .toList();

        return ResponseEntity.ok(new TokenResponse("Bearer", token, roles, userDetails.getUsername()));
    }
}
