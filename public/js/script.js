const socket = io();

// ✅ Notificación emergente
function mostrarNotificacion(mensaje) {
    let notificacion = document.createElement("div");
    notificacion.innerText = mensaje;
    notificacion.classList.add("notificacion");
    document.body.appendChild(notificacion);
    setTimeout(() => notificacion.remove(), 3000);
}

// ✅ Obtener y mostrar productos
async function obtenerProductos() {
    const response = await fetch('/api/productos');
    const productos = await response.json();
    let catalogo = document.getElementById("catalogo");
    if (catalogo) {
        catalogo.innerHTML = "";
        productos.forEach(producto => {
            let item = document.createElement("div");
            item.classList.add("producto");
            item.innerHTML = `
                <h3>${producto.nombre}</h3>
                <p>${producto.descripcion}</p>
                <p>Precio: $${producto.precio}</p>
                <button onclick="agregarAlCarrito('${producto._id}', '${producto.nombre}')">Agregar</button>
            `;
            catalogo.appendChild(item);
        });
    }
}

// ✅ Agregar productos al carrito
function agregarAlCarrito(productoId, nombre) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let itemExistente = carrito.find(item => item.productoId === productoId);

    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({ productoId, cantidad: 1 });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    mostrarCarrito();
    mostrarNotificacion(`${nombre} agregado al carrito 🛒`);
}

// ✅ Mostrar productos en el carrito
function mostrarCarrito() {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let carritoDiv = document.getElementById("carrito");
    if (carritoDiv) {
        carritoDiv.innerHTML = carrito.map(item => `
            <p>Producto ID: ${item.productoId} - Cantidad: ${item.cantidad} 
                <button onclick="eliminarDelCarrito('${item.productoId}')">❌</button>
            </p>
        `).join("");
    }
}

// ✅ Eliminar producto del carrito
function eliminarDelCarrito(productoId) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito = carrito.filter(item => item.productoId !== productoId);
    localStorage.setItem("carrito", JSON.stringify(carrito));
    mostrarCarrito();
    mostrarNotificacion("Producto eliminado del carrito 🗑️");
}

// ✅ Realizar pedido
async function realizarPedido() {
    let cliente = prompt("Ingrese su nombre:");
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    if (carrito.length === 0) {
        mostrarNotificacion("El carrito está vacío ❌");
        return;
    }

    await fetch('/api/pedidos', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente, productos: carrito, total: carrito.length * 10 })
    });

    localStorage.removeItem("carrito");
    mostrarCarrito();
    mostrarNotificacion("Pedido realizado con éxito 🎉");
    socket.emit("actualizarPedidos"); // 🔥 Notifica a todos los clientes
}

// ✅ Obtener historial de pedidos
async function obtenerHistorial() {
    const response = await fetch('/api/pedidos');
    const pedidos = await response.json();
    let historialDiv = document.getElementById("historial");
    if (historialDiv) {
        historialDiv.innerHTML = pedidos.map(pedido => `
            <p><strong>${pedido.cliente}</strong> - Estado: ${pedido.estado} - Total: $${pedido.total}</p>
        `).join("");
    }
}

// ✅ Obtener y mostrar pedidos en `pedidos.html`
async function obtenerPedidos() {
    const response = await fetch('/api/pedidos');
    const pedidos = await response.json();
    let pedidosDiv = document.getElementById("pedidos");
    if (pedidosDiv) {
        pedidosDiv.innerHTML = "";
        pedidos.forEach(pedido => {
            let item = document.createElement("div");
            item.classList.add("pedido");
            item.innerHTML = `
                <h3>Cliente: ${pedido.cliente}</h3>
                <p>Total: $${pedido.total}</p>
                <p>Estado: 
                    <select onchange="cambiarEstadoPedido('${pedido._id}', this.value)">
                        <option value="Pendiente" ${pedido.estado === "Pendiente" ? "selected" : ""}>Pendiente</option>
                        <option value="Enviado" ${pedido.estado === "Enviado" ? "selected" : ""}>Enviado</option>
                        <option value="Entregado" ${pedido.estado === "Entregado" ? "selected" : ""}>Entregado</option>
                    </select>
                </p>
            `;
            pedidosDiv.appendChild(item);
        });
    }
}

// ✅ Cambiar estado del pedido
async function cambiarEstadoPedido(id, nuevoEstado) {
    await fetch(`/api/pedidos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: nuevoEstado })
    });

    socket.emit("actualizarPedidos");  // 🔥 Notifica a todos los clientes
    mostrarNotificacion(`Estado del pedido actualizado a ${nuevoEstado} 📦`);
}

// ✅ Enviar pregunta en soporte
function enviarPregunta() {
    let pregunta = document.getElementById("pregunta").value;
    if (pregunta.trim() !== "") {
        socket.emit("nuevaPregunta", pregunta);
        document.getElementById("pregunta").value = "";
    }
}

// ✅ Escuchar preguntas y respuestas en tiempo real
socket.on("nuevaRespuesta", (respuesta) => {
    let respuestasDiv = document.getElementById("respuestas");
    if (respuestasDiv) {
        respuestasDiv.innerHTML += `<p>${respuesta}</p>`;
    }
});

// ✅ WebSockets: Actualización en tiempo real
socket.on('actualizarHistorial', obtenerHistorial);
socket.on('actualizarPedidos', () => {
    obtenerPedidos();
    obtenerHistorial();
});
socket.on('actualizarProductos', obtenerProductos);

// ✅ Cargar datos al iniciar
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("catalogo")) obtenerProductos();
    if (document.getElementById("carrito")) mostrarCarrito();
    if (document.getElementById("historial")) obtenerHistorial();
    if (document.getElementById("pedidos")) obtenerPedidos();
});
