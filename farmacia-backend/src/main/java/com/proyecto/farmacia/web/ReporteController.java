package com.proyecto.farmacia.web;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.proyecto.farmacia.model.Inventario;
import com.proyecto.farmacia.model.Producto;
import com.proyecto.farmacia.model.Venta;
import com.proyecto.farmacia.repository.InventarioRepo;
import com.proyecto.farmacia.repository.ProductoRepo;
import com.proyecto.farmacia.repository.VentaRepo;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    @Autowired
    private VentaRepo ventaRepo;

    @Autowired
    private InventarioRepo inventarioRepo;

    @Autowired
    private ProductoRepo productoRepo;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/ventas")
    public Map<String, Object> reporteVentas() {
        List<Venta> ventas = ventaRepo.findAll();
        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("cantidadVentas", ventas.size());
        respuesta.put("ventas", ventas);
        return respuesta;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/inventario")
    public Map<String, Object> reporteInventario() {
        List<Inventario> inventario = inventarioRepo.findAll();
        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("cantidadRegistros", inventario.size());
        respuesta.put("inventario", inventario);
        return respuesta;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/vencimientos")
    public Map<String, Object> reporteVencimientos() {
        LocalDate fechaLimite = LocalDate.now().plusDays(90);
        List<Producto> productos = productoRepo.findAll()
                .stream()
                .filter(producto -> producto.getFechaVencimiento() != null
                        && !producto.getFechaVencimiento().isAfter(fechaLimite))
                .collect(Collectors.toList());

        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("fechaLimite", fechaLimite);
        respuesta.put("productos", productos);
        return respuesta;
    }
}
