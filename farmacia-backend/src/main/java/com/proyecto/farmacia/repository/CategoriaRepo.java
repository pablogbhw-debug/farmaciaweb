package com.proyecto.farmacia.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.farmacia.model.Categoria;

public interface CategoriaRepo extends JpaRepository<Categoria, Long> {
}
