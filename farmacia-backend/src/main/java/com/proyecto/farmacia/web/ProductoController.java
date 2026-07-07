package com.proyecto.farmacia.web;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.farmacia.model.Categoria;
import com.proyecto.farmacia.model.Producto;
import com.proyecto.farmacia.repository.CategoriaRepo;
import com.proyecto.farmacia.repository.ProductoRepo;

@RestController
@RequestMapping("/api/productos")
public class ProductoController {

    @Autowired
    private ProductoRepo productoRepo;

    @Autowired
    private CategoriaRepo categoriaRepo;

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> crear(@RequestBody Producto producto) {
        if (producto.getCategoria() == null || producto.getCategoria().getIdCategoria() == null) {
            return ResponseEntity.badRequest().body("Debe enviar el idCategoria");
        }
        Categoria categoria = categoriaRepo.findById(producto.getCategoria().getIdCategoria()).orElse(null);
        if (categoria == null) {
            return ResponseEntity.badRequest().body("Categoria no encontrada");
        }
        producto.setCategoria(categoria);
        if (producto.getEstado() == null) {
            producto.setEstado(true);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(productoRepo.save(producto));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public List<Producto> listar() {
        return productoRepo.findAll();
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        Optional<Producto> producto = productoRepo.findById(id);
        if (producto.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(producto.get());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Producto producto) {
        Optional<Producto> productoOptional = productoRepo.findById(id);
        if (productoOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Producto actual = productoOptional.get();
        actual.setNombre(producto.getNombre());
        actual.setDescripcion(producto.getDescripcion());
        actual.setPrecio(producto.getPrecio());
        actual.setFechaVencimiento(producto.getFechaVencimiento());
        actual.setEstado(producto.getEstado());

        if (producto.getCategoria() != null && producto.getCategoria().getIdCategoria() != null) {
            Categoria categoria = categoriaRepo.findById(producto.getCategoria().getIdCategoria()).orElse(null);
            if (categoria == null) {
                return ResponseEntity.badRequest().body("Categoria no encontrada");
            }
            actual.setCategoria(categoria);
        }

        return ResponseEntity.ok(productoRepo.save(actual));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        if (!productoRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productoRepo.deleteById(id);
        return ResponseEntity.ok("Producto eliminado correctamente");
    }
}
