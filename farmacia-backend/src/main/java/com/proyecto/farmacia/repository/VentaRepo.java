package com.proyecto.farmacia.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.proyecto.farmacia.model.Venta;
import com.proyecto.farmacia.model.Usuario;

public interface VentaRepo extends JpaRepository<Venta, Long> {

    List<Venta> findByFechaBetween(LocalDateTime inicio, LocalDateTime fin);

    List<Venta> findByUsuario(Usuario usuario);

    List<Venta> findByUsuarioAndFechaBetween(Usuario usuario, LocalDateTime inicio, LocalDateTime fin);
}
