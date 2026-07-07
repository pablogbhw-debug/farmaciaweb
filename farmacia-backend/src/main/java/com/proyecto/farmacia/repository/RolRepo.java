package com.proyecto.farmacia.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.farmacia.model.Rol;

public interface RolRepo extends JpaRepository<Rol, Long> {

    Rol findByNombre(String nombre);
}
