const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const Producto = require('./models/Producto');
const Pedido = require('./models/Pedido'); // Modelo de pedidos

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ✅ Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {})
    .then(async () => {
        console.log("🟢 Conectado a MongoDB");

        // Insertar productos de ejemplo si no existen
        const productosExistentes = await Producto.countDocuments();
        if (productosExistentes === 0) {
            await Producto.insertMany([
                { nombre: "Paracetamol", descripcion: "Analgésico", precio: 2.50, stock: 50 },
                { nombre: "Ibuprofeno", descripcion: "Antiinflamatorio", precio: 3.00, stock: 40 },
                { nombre: "Omeprazol", descripcion: "Protector gástrico", precio: 4.00, stock: 30 }
            ]);
            console.log("✅ Productos de ejemplo agregados");
        }
    })
    .catch(err => {
        console.error("🔴 Error conectando a MongoDB:", err.message);
        process.exit(1);
    });

// ✅ Rutas API con WebSockets
app.use('/api/productos', require('./routes/productos')(io));
app.use('/api/pedidos', require('./routes/pedidos')(io));

// ✅ Ruta para actualizar estado de pedidos
app.put('/api/pedidos/:id', async (req, res) => {
    try {
        const pedido = await Pedido.findByIdAndUpdate(req.params.id, { estado: req.body.estado }, { new: true });
        io.emit("actualizarPedidos"); // 🔥 Notifica en tiempo real a `pedidos.html` y `historial.html`
        res.json(pedido);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el pedido" });
    }
});

// ✅ WebSockets - Soporte y Pedidos en tiempo real
io.on('connection', (socket) => {
    console.log("🟢 Usuario conectado");

    // Manejo de preguntas en soporte
    socket.on("nuevaPregunta", (pregunta) => {
        console.log("❓ Pregunta recibida:", pregunta);
        setTimeout(() => {
            const respuesta = `Respuesta automática: "${pregunta}"`;
            io.emit("nuevaRespuesta", respuesta);
        }, 3000);
    });

    // Manejo de actualización de pedidos en tiempo real
    socket.on('actualizarPedidos', () => {
        io.emit("actualizarPedidos"); // 🔥 Notifica a todos los clientes
    });

    socket.on('disconnect', () => console.log("🔴 Usuario desconectado"));
});

// ✅ Servir `index.html`
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ✅ Iniciar servidor
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🟢 Servidor corriendo en http://localhost:${PORT}`));
