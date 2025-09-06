# Rappi Clone - Sistema de Delivery

Un sistema completo de delivery con 3 aplicaciones cliente y un servidor backend, desarrollado con Node.js/Express y JavaScript vanilla.

## Estructura del Proyecto

```
├── public/                 # Página de inicio con selección de roles
├── consumer-app/          # App de Consumidor
├── store-app/            # App de Restaurante/Tienda
├── delivery-app/         # App de Repartidor
├── data/                 # Bases de datos mock (JSON)
│   ├── users.json
│   ├── stores.json
│   ├── products.json
│   └── orders.json
├── server/               # Servidor backend
│   └── index.js
└── package.json
```

## Características

### Backend (Servidor)
- **Tecnología**: Node.js + Express
- **API REST** con endpoints para:
  - Autenticación (`/auth/login`)
  - Gestión de tiendas (`/stores`)
  - Gestión de productos (`/products`)
  - Gestión de órdenes (`/orders`)
- **Bases de datos mock** en archivos JSON
- **CORS** habilitado para comunicación entre apps

### App de Consumidor
- Login de usuario
- Lista de tiendas disponibles
- Detalle de tienda con productos
- Carrito de compras
- Crear órdenes (dirección y método de pago)
- Ver historial de órdenes

### App de Tienda
- Login de administrador
- Información general de la tienda
- Abrir/cerrar tienda
- Gestión de productos (crear, editar, eliminar)
- Ver y aceptar pedidos

### App de Repartidor
- Login de repartidor
- Lista de órdenes disponibles
- Detalle de órdenes
- Cambiar estado de órdenes (aceptada, en camino, entregada)

## Instalación y Ejecución

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Ejecutar el servidor**:
   ```bash
   npm start
   ```

3. **Acceder a la aplicación**:
   - Abrir navegador en `http://localhost:5050`
   - Seleccionar el rol deseado

## Usuarios de Prueba

### Consumidores
- Email: `juan@email.com` / Contraseña: `123456`
- Email: `maria@email.com` / Contraseña: `123456`

### Tiendas
- Email: `carlos@restaurant.com` / Contraseña: `123456`
- Email: `ana@restaurant.com` / Contraseña: `123456`

### Repartidores
- Email: `pedro@delivery.com` / Contraseña: `123456`
- Email: `luis@delivery.com` / Contraseña: `123456`

## Flujo de la Aplicación

1. **Consumidor**:
   - Inicia sesión
   - Ve tiendas disponibles
   - Selecciona tienda y productos
   - Agrega productos al carrito
   - Crea pedido con dirección y método de pago

2. **Tienda**:
   - Inicia sesión
   - Gestiona estado de la tienda (abrir/cerrar)
   - Agrega/edita/elimina productos
   - Ve y acepta pedidos pendientes

3. **Repartidor**:
   - Inicia sesión
   - Ve pedidos disponibles
   - Acepta pedidos
   - Actualiza estado de entrega

## Tecnologías Utilizadas

- **Backend**: Node.js, Express, CORS
- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Almacenamiento**: Archivos JSON (mock)
- **Comunicación**: Fetch API, JSON

## Características Técnicas

- **Responsive Design**: Adaptable a dispositivos móviles
- **Autenticación**: Sistema de login por roles
- **Estado Persistente**: Datos guardados en archivos JSON
- **Interfaz Moderna**: Diseño limpio con colores naranjas
- **Navegación Intuitiva**: SPA (Single Page Application) por app

## Endpoints de la API

### Autenticación
- `POST /auth/login` - Login de usuarios

### Tiendas
- `GET /stores` - Listar tiendas
- `POST /stores/:id/status` - Cambiar estado de tienda

### Productos
- `GET /products/:storeId` - Productos de una tienda
- `POST /products` - Crear producto
- `PUT /products/:id` - Actualizar producto
- `DELETE /products/:id` - Eliminar producto

### Órdenes
- `POST /orders` - Crear orden
- `GET /orders/user/:userId` - Órdenes de un usuario
- `GET /orders/available` - Órdenes disponibles para repartidores
- `PATCH /orders/:id/status` - Actualizar estado de orden

## Desarrollo

El proyecto está estructurado de manera modular con cada aplicación cliente en su propio directorio. El servidor maneja toda la lógica de negocio y persistencia de datos.

### Estructura de Datos

- **Users**: Información de usuarios con roles
- **Stores**: Datos de tiendas y su estado
- **Products**: Productos asociados a tiendas
- **Orders**: Órdenes con productos, estado y información de entrega

## Licencia

Este proyecto es para fines educativos y de demostración.
