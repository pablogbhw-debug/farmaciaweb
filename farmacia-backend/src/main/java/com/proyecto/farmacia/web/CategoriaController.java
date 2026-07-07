package com.proyecto.farmacia.web;

import java.util.List;
import java.util.Optional;

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
import com.proyecto.farmacia.repository.CategoriaRepo;

@RestController
@RequestMapping("/api/categorias")
public class CategoriaController {

    private final CategoriaRepo categoriaRepo;

    public CategoriaController(CategoriaRepo categoriaRepo) {
        this.categoriaRepo = categoriaRepo;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Categoria> crear(@RequestBody Categoria categoria) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoriaRepo.save(categoria));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<Categoria> listar() {
        return categoriaRepo.findAll();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        Optional<Categoria> categoria = categoriaRepo.findById(id);
        if (categoria.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(categoria.get());
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @RequestBody Categoria categoria) {
        Optional<Categoria> categoriaOptional = categoriaRepo.findById(id);
        if (categoriaOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Categoria actual = categoriaOptional.get();
        actual.setNombre(categoria.getNombre());
        return ResponseEntity.ok(categoriaRepo.save(actual));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        if (!categoriaRepo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        categoriaRepo.deleteById(id);
        return ResponseEntity.ok("Categoria eliminada correctamente");
    }
}
