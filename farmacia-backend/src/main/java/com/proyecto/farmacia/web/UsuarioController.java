package com.proyecto.farmacia.web;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.farmacia.model.Rol;
import com.proyecto.farmacia.model.Usuario;
import com.proyecto.farmacia.repository.RolRepo;
import com.proyecto.farmacia.repository.UsuarioRepo;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepo usuarioRepo;

    @Autowired
    private RolRepo rolRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Usuario usuario) {
        if (usuario.getRol() == null || usuario.getRol().getIdRol() == null) {
            return ResponseEntity.badRequest().body("Debe enviar el idRol");
        }
        Rol rol = rolRepo.findById(usuario.getRol().getIdRol()).orElse(null);
        if (rol == null) {
            return ResponseEntity.badRequest().body("Rol no encontrado");
        }
        if (usuarioRepo.findByNombre(usuario.getNombre()) != null) {
            return ResponseEntity.badRequest().body("Ya existe un usuario con ese nombre");
        }
        usuario.setRol(rol);
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        if (usuario.getEstado() == null) {
            usuario.setEstado(true);
        }
        Usuario guardado = usuarioRepo.save(usuario);
        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Usuario> listar() {
        return usuarioRepo.findAll();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        Optional<Usuario> usuarioOptional = usuarioRepo.findById(id);
        if (usuarioOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(usuarioOptional.get());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Usuario usuario) {
        Optional<Usuario> usuarioOptional = usuarioRepo.findById(id);
        if (usuarioOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Usuario actual = usuarioOptional.get();
        actual.setNombre(usuario.getNombre());
        actual.setEmail(usuario.getEmail());
        actual.setEstado(usuario.getEstado());

        if (usuario.getPassword() != null && !usuario.getPassword().isBlank()) {
            actual.setPassword(passwordEncoder.encode(usuario.getPassword()));
        }
        if (usuario.getRol() != null) {
            Rol rol = null;
            if (usuario.getRol().getIdRol() != null) {
                rol = rolRepo.findById(usuario.getRol().getIdRol()).orElse(null);
            } else if (usuario.getRol().getNombre() != null && !usuario.getRol().getNombre().isBlank()) {
                String nombreRol = usuario.getRol().getNombre().trim().toUpperCase();
                rol = rolRepo.findByNombre(nombreRol);
                if (rol == null) {
                    rol = new Rol();
                    rol.setNombre(nombreRol);
                    rol = rolRepo.save(rol);
                }
            }
            if (rol == null) {
                return ResponseEntity.badRequest().body("Rol no encontrado");
            }
            actual.setRol(rol);
        }

        Usuario guardado = usuarioRepo.save(actual);
        return ResponseEntity.ok(guardado);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        if (!usuarioRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        usuarioRepo.deleteById(id);
        return ResponseEntity.ok("Usuario eliminado correctamente");
    }
}
