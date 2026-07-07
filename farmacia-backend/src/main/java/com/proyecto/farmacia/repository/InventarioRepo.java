package com.proyecto.farmacia.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.proyecto.farmacia.model.Inventario;
import com.proyecto.farmacia.model.Producto;

public interface InventarioRepo extends JpaRepository<Inventario, Long> {

    Optional<Inventario> findByProducto(Producto producto);

    @Query("select i from Inventario i join i.producto p where i.stock <= i.stockMinimo or (p.fechaVencimiento is not null and p.fechaVencimiento <= :fechaLimite)")
    List<Inventario> listarAlertas(@Param("fechaLimite") LocalDate fechaLimite);
}
