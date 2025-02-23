const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');

module.exports = (io) => {
    router.get('/', async (req, res) => {
        const productos = await Producto.find();
        res.json(productos);
    });

    router.post('/', async (req, res) => {
        const { nombre, descripcion, precio, stock, imagen } = req.body;
        const nuevoProducto = new Producto({ nombre, descripcion, precio, stock, imagen });
        await nuevoProducto.save();
        io.emit("actualizarProductos", nuevoProducto);
        res.json(nuevoProducto);
    });

    router.put('/:id', async (req, res) => {
        const productoActualizado = await Producto.findByIdAndUpdate(req.params.id, req.body, { new: true });
        io.emit("actualizarProductos", productoActualizado);
        res.json(productoActualizado);
    });

    router.delete('/:id', async (req, res) => {
        await Producto.findByIdAndDelete(req.params.id);
        io.emit("actualizarProductos");
        res.json({ mensaje: "Producto eliminado" });
    });

    return router;
};
