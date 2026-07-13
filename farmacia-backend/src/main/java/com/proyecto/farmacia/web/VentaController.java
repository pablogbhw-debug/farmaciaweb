package com.proyecto.farmacia.web;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.farmacia.model.DetalleVenta;
import com.proyecto.farmacia.model.Inventario;
import com.proyecto.farmacia.model.Producto;
import com.proyecto.farmacia.model.Usuario;
import com.proyecto.farmacia.model.Venta;
import com.proyecto.farmacia.repository.InventarioRepo;
import com.proyecto.farmacia.repository.ProductoRepo;
import com.proyecto.farmacia.repository.UsuarioRepo;
import com.proyecto.farmacia.repository.VentaRepo;
import com.proyecto.farmacia.web.dto.DetalleVentaRequest;
import com.proyecto.farmacia.web.dto.VentaRequest;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    @Autowired
    private VentaRepo ventaRepo;

    @Autowired
    private UsuarioRepo usuarioRepo;

    @Autowired
    private ProductoRepo productoRepo;

    @Autowired
    private InventarioRepo inventarioRepo;

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @Transactional
    @PostMapping
    public ResponseEntity<?> registrar(@RequestBody VentaRequest request, Authentication authentication) {
        if (request.getDetalle() == null || request.getDetalle().isEmpty()) {
            return ResponseEntity.badRequest().body("La venta debe tener al menos un detalle");
        }

        Usuario usuario = esAdmin(authentication)
                ? request.getIdUsuario() == null ? null : usuarioRepo.findById(request.getIdUsuario()).orElse(null)
                : usuarioRepo.findByNombre(authentication.getName());
        if (usuario == null) {
            return ResponseEntity.badRequest().body("Usuario no encontrado");
        }

        Venta venta = new Venta();
        venta.setUsuario(usuario);
        venta.setFecha(LocalDateTime.now());
        venta.setMetodoPago(request.getMetodoPago());

        List<DetalleVenta> detalles = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (DetalleVentaRequest item : request.getDetalle()) {
            Producto producto = productoRepo.findById(item.getIdProducto()).orElse(null);
            if (producto == null) {
                return ResponseEntity.badRequest().body("Producto no encontrado con id: " + item.getIdProducto());
            }

            Inventario inventario = inventarioRepo.findByProducto(producto).orElse(null);
            if (inventario == null) {
                return ResponseEntity.badRequest().body("No existe inventario para el producto: " + producto.getNombre());
            }
            if (inventario.getStock() < item.getCantidad()) {
                return ResponseEntity.badRequest().body("Stock insuficiente para el producto: " + producto.getNombre());
            }

            BigDecimal subtotal = producto.getPrecio().multiply(BigDecimal.valueOf(item.getCantidad()));

            DetalleVenta detalle = new DetalleVenta();
            detalle.setVenta(venta);
            detalle.setProducto(producto);
            detalle.setCantidad(item.getCantidad());
            detalle.setPrecioUnitario(producto.getPrecio());
            detalle.setSubtotal(subtotal);
            detalles.add(detalle);

            inventario.setStock(inventario.getStock() - item.getCantidad());
            inventarioRepo.save(inventario);

            total = total.add(subtotal);
        }

        venta.setTotal(total);
        venta.setDetalles(detalles);

        return ResponseEntity.status(HttpStatus.CREATED).body(ventaRepo.save(venta));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping
    public List<Venta> listar(Authentication authentication) {
        if (esAdmin(authentication)) {
            return ventaRepo.findAll();
        }
        return ventaRepo.findByUsuario(usuarioAutenticado(authentication));
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id, Authentication authentication) {
        Optional<Venta> venta = ventaRepo.findById(id);
        if (venta.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (!esAdmin(authentication)
                && !venta.get().getUsuario().getNombre().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(venta.get());
    }

    @PreAuthorize("hasAnyRole('ADMIN','EMPLEADO')")
    @GetMapping("/fecha")
    public List<Venta> listarPorFecha(@RequestParam LocalDate inicio, @RequestParam LocalDate fin,
            Authentication authentication) {
        LocalDateTime fechaInicio = inicio.atStartOfDay();
        LocalDateTime fechaFin = LocalDateTime.of(fin, LocalTime.MAX);
        if (esAdmin(authentication)) {
            return ventaRepo.findByFechaBetween(fechaInicio, fechaFin);
        }
        return ventaRepo.findByUsuarioAndFechaBetween(
                usuarioAutenticado(authentication), fechaInicio, fechaFin);
    }

    private Usuario usuarioAutenticado(Authentication authentication) {
        Usuario usuario = usuarioRepo.findByNombre(authentication.getName());
        if (usuario == null) {
            throw new IllegalStateException("Usuario autenticado no encontrado");
        }
        return usuario;
    }

    private boolean esAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }
}
