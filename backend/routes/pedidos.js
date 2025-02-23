const express = require('express');
const router = express.Router();
const Pedido = require('../models/Pedido');

module.exports = (io) => {
    router.get('/', async (req, res) => {
        const pedidos = await Pedido.find().populate('productos.productoId');
        res.json(pedidos);
    });

    router.post('/', async (req, res) => {
        const { cliente, productos, total } = req.body;
        const nuevoPedido = new Pedido({ cliente, productos, total });
        await nuevoPedido.save();
        io.emit("actualizarPedidos", nuevoPedido);
        res.json(nuevoPedido);
    });

    return router;
};
