package com.proyecto.farmacia.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.farmacia.model.Producto;

public interface ProductoRepo extends JpaRepository<Producto, Long> {
}
