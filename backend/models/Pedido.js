const mongoose = require('mongoose');

const PedidoSchema = new mongoose.Schema({
    cliente: { type: String, required: true },
    productos: [
        {
            productoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Producto', required: true },
            cantidad: { type: Number, required: true }
        }
    ],
    total: { type: Number, required: true },
    estado: { type: String, enum: ['Pendiente', 'Enviado', 'Entregado', 'Cancelado'], default: "Pendiente" },
    fecha: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pedido', PedidoSchema);
