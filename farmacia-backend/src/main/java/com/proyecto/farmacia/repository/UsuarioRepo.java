package com.proyecto.farmacia.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.farmacia.model.Usuario;

public interface UsuarioRepo extends JpaRepository<Usuario, Long> {

    Usuario findByNombre(String nombre);

    Optional<Usuario> findByEmail(String email);
}
