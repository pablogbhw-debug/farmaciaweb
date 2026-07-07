package com.proyecto.farmacia.web.dto;

import java.util.List;

public class VentaRequest {

    private Long idUsuario;
    private String metodoPago;
    private List<DetalleVentaRequest> detalle;

    public Long getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Long idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(String metodoPago) {
        this.metodoPago = metodoPago;
    }

    public List<DetalleVentaRequest> getDetalle() {
        return detalle;
    }

    public void setDetalle(List<DetalleVentaRequest> detalle) {
        this.detalle = detalle;
    }
}
