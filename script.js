const productos = [
    { id: 'galaxia', nombre: 'Gomitas Galácticas', descripcion: 'Mezcla frutal con formas del espacio.', precio: 15, imagen: 'images/1.jpg' },
    { id: 'estrellas', nombre: 'Gomitas Estelares', descripcion: 'Dulces en forma de estrella.', precio: 12, imagen: 'images/2.jpg' },
    { id: 'planetas', nombre: 'Gomitas Planetarias', descripcion: 'Colores y sabores en órbita.', precio: 18, imagen: 'images/3.jpg' },
    { id: 'cometas', nombre: 'Gomitas Cometa', descripcion: 'Un viaje dulce con sabor frutal.', precio: 14, imagen: 'images/4.jpg' },
    { id: 'luna', nombre: 'Gomitas Luna', descripcion: 'Pequeños bocados de gran sabor.', precio: 10, imagen: 'images/5.jpg' },
    { id: 'universo', nombre: 'Caja Universo', descripcion: 'La selección completa de la tienda.', precio: 25, imagen: 'images/6.png' }
];

const productosElement = document.getElementById('products');
const carritoElement = document.getElementById('cart');
const itemsElement = document.getElementById('cart-items');
const totalElement = document.getElementById('cart-total');
const contadorElement = document.getElementById('cart-count');
const clienteElement = document.getElementById('customer-name');
const cedulaElement = document.getElementById('customer-id');
let carrito = cargarCarrito();

function cargarCarrito() {
    try { return JSON.parse(localStorage.getItem('gomitasCarrito')) || {}; }
    catch (error) { return {}; }
}

function guardarCarrito() {
    localStorage.setItem('gomitasCarrito', JSON.stringify(carrito));
}

function dinero(valor) {
    return valor.toFixed(2);
}

function renderizarProductos() {
    productosElement.innerHTML = productos.map(producto => `
        <article class="card">
            <img src="${producto.imagen}" alt="${producto.nombre}" onerror="this.style.display='none'">
            <h4>${producto.nombre}</h4>
            <p>${producto.descripcion}</p>
            <div class="price">Bs.${dinero(producto.precio)}</div>
            <button class="add-product" data-id="${producto.id}">Agregar al carrito</button>
        </article>
    `).join('');
}

function lineasCarrito() {
    return Object.entries(carrito)
        .map(([id, cantidad]) => ({ producto: productos.find(item => item.id === id), cantidad }))
        .filter(linea => linea.producto && linea.cantidad > 0);
}

function actualizarCarrito() {
    const lineas = lineasCarrito();
    const cantidadTotal = lineas.reduce((total, linea) => total + linea.cantidad, 0);
    const total = lineas.reduce((suma, linea) => suma + linea.producto.precio * linea.cantidad, 0);
    contadorElement.textContent = cantidadTotal;
    totalElement.textContent = dinero(total);
    itemsElement.innerHTML = lineas.length ? lineas.map(linea => `
        <li>
            <span class="item-name">${linea.producto.nombre}</span>
            <div class="qty-controls">
                <button class="change-quantity" data-id="${linea.producto.id}" data-change="-1" aria-label="Quitar una unidad">-</button>
                <span>${linea.cantidad}</span>
                <button class="change-quantity" data-id="${linea.producto.id}" data-change="1" aria-label="Agregar una unidad">+</button>
            </div>
            <span class="price-line">Bs.${dinero(linea.producto.precio * linea.cantidad)}</span>
            <button class="remove-product" data-id="${linea.producto.id}" aria-label="Eliminar producto">Eliminar</button>
        </li>
    `).join('') : '<li class="empty-cart">Tu carrito está vacío.</li>';
}

function cambiarCantidad(id, cambio) {
    carrito[id] = (carrito[id] || 0) + cambio;
    if (carrito[id] <= 0) delete carrito[id];
    guardarCarrito();
    actualizarCarrito();
}

function finalizarPedido() {
    const lineas = lineasCarrito();
    if (!lineas.length) {
        alert('Tu carrito está vacío.');
        return;
    }

    const cliente = clienteElement.value.trim();
    const cedula = cedulaElement.value.trim();
    if (!cliente || !cedula) {
        alert('Completa el nombre y la cédula de identidad para finalizar el pedido.');
        (!cliente ? clienteElement : cedulaElement).focus();
        return;
    }
    const total = lineas.reduce((suma, linea) => suma + linea.producto.precio * linea.cantidad, 0);
    const numeroPedido = `PED-${Date.now().toString().slice(-6)}`;
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('No se pudo cargar el generador de PDF. Revisa tu conexión a internet.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const documento = new jsPDF();
    const fecha = new Date().toLocaleString('es-BO');

    documento.setFillColor(35, 24, 80);
    documento.rect(0, 0, 210, 35, 'F');
    documento.setTextColor(255, 255, 255);
    documento.setFontSize(20);
    documento.setFont(undefined, 'bold');
    documento.text('GOMITAS GALÁCTICAS', 105, 15, { align: 'center' });
    documento.setFontSize(20);
    documento.setFont(undefined, 'normal');
    documento.text('RECIBO', 105, 24, { align: 'center' });

    documento.setTextColor(30, 30, 40);
    documento.setFontSize(11);
    documento.text(`Pedido: ${numeroPedido}`, 20, 48);
    documento.text(`Fecha: ${fecha}`, 20, 56);
    documento.text(`Cliente: ${cliente}`, 20, 64);
    documento.text(`Cédula: ${cedula}`, 20, 72);
    documento.line(20, 78, 190, 78);

    documento.setFont(undefined, 'bold');
    documento.text('Cantidad', 20, 88);
    documento.text('Producto', 55, 88);
    documento.text('P. Unit.', 135, 88, { align: 'right' });
    documento.text('Subtotal', 190, 88, { align: 'right' });
    documento.line(20, 92, 190, 92);

    documento.setFont(undefined, 'normal');
    let posicionY = 102;
    lineas.forEach(linea => {
        documento.text(String(linea.cantidad), 25, posicionY);
        documento.text(linea.producto.nombre, 55, posicionY);
        documento.text(`Bs.${dinero(linea.producto.precio)}`, 135, posicionY, { align: 'right' });
        documento.text(`Bs.${dinero(linea.producto.precio * linea.cantidad)}`, 190, posicionY, { align: 'right' });
        posicionY += 9;
    });

    documento.line(20, posicionY, 190, posicionY);
    documento.setFont(undefined, 'bold');
    documento.setFontSize(14);
    documento.text(`TOTAL: Bs.${dinero(total)}`, 190, posicionY + 12, { align: 'right' });
    documento.setFontSize(12);
    documento.setTextColor(30, 30, 40);
    documento.setFont(undefined, 'italic');
    documento.setFontSize(10);
    documento.text('¡Gracias por tu compra!', 105, 283, { align: 'center' });
    documento.save(`${numeroPedido}-gomitas-galacticas.pdf`);

    carrito = {};
    clienteElement.value = '';
    cedulaElement.value = '';
    guardarCarrito();
    actualizarCarrito();
    carritoElement.classList.add('hidden');
}

productosElement.addEventListener('click', event => {
    const boton = event.target.closest('.add-product');
    if (!boton) return;
    carrito[boton.dataset.id] = (carrito[boton.dataset.id] || 0) + 1;
    guardarCarrito();
    actualizarCarrito();
    carritoElement.classList.remove('hidden');
});

itemsElement.addEventListener('click', event => {
    const cambio = event.target.closest('.change-quantity');
    const eliminar = event.target.closest('.remove-product');
    if (cambio) cambiarCantidad(cambio.dataset.id, Number(cambio.dataset.change));
    if (eliminar) cambiarCantidad(eliminar.dataset.id, -carrito[eliminar.dataset.id]);
});

document.getElementById('cart-button').addEventListener('click', () => carritoElement.classList.toggle('hidden'));
document.getElementById('clear-cart').addEventListener('click', () => {
    carrito = {};
    guardarCarrito();
    actualizarCarrito();
});
document.getElementById('finalize-order').addEventListener('click', finalizarPedido);

renderizarProductos();
actualizarCarrito();