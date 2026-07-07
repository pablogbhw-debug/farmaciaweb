package com.proyecto.farmacia.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.farmacia.model.DetalleVenta;

public interface DetalleVentaRepo extends JpaRepository<DetalleVenta, Long> {
}
