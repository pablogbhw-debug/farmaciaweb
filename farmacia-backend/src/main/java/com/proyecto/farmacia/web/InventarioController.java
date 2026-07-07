package com.proyecto.farmacia.web;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.farmacia.model.Inventario;
import com.proyecto.farmacia.model.Producto;
import com.proyecto.farmacia.repository.InventarioRepo;
import com.proyecto.farmacia.repository.ProductoRepo;
import com.proyecto.farmacia.web.dto.StockRequest;

@RestController
@RequestMapping("/api/inventario")
public class InventarioController {

    @Autowired
    private InventarioRepo inventarioRepo;

    @Autowired
    private ProductoRepo productoRepo;

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public List<Inventario> listar() {
        return inventarioRepo.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        Optional<Inventario> inventario = inventarioRepo.findById(id);
        if (inventario.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(inventario.get());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody StockRequest request) {
        Producto producto = productoRepo.findById(request.getIdProducto()).orElse(null);
        if (producto == null) {
            return ResponseEntity.badRequest().body("Producto no encontrado");
        }
        if (inventarioRepo.findByProducto(producto).isPresent()) {
            return ResponseEntity.badRequest().body("Ya existe inventario para ese producto");
        }
        Inventario inventario = new Inventario();
        inventario.setProducto(producto);
        inventario.setStock(request.getStock());
        inventario.setStockMinimo(request.getStockMinimo());
        return ResponseEntity.status(HttpStatus.CREATED).body(inventarioRepo.save(inventario));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody StockRequest request) {
        Optional<Inventario> inventarioOptional = inventarioRepo.findById(id);
        if (inventarioOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Inventario actual = inventarioOptional.get();
        if (request.getIdProducto() != null) {
            Producto producto = productoRepo.findById(request.getIdProducto()).orElse(null);
            if (producto == null) {
                return ResponseEntity.badRequest().body("Producto no encontrado");
            }
            actual.setProducto(producto);
        }
        actual.setStock(request.getStock());
        actual.setStockMinimo(request.getStockMinimo());
        return ResponseEntity.ok(inventarioRepo.save(actual));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/alertas")
    public List<Inventario> alertas() {
        return inventarioRepo.listarAlertas(LocalDate.now().plusDays(90));
    }
}
