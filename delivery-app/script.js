class DeliveryApp {
    constructor() {
        this.currentUser = null;
        this.availableOrders = [];
        this.myOrders = [];
        this.currentOrder = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuth();
    }

    bindEvents() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.logout();
        });

        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.showScreen(e.target.dataset.screen);
            });
        });

        // Back button
        document.getElementById('back-to-available').addEventListener('click', () => {
            this.showMainScreen();
            this.showScreen('available');
        });
    }

    async checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            this.showMainScreen();
        } else {
            this.showLoginScreen();
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('order-detail-screen').classList.remove('active');
    }

    showMainScreen() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        document.getElementById('order-detail-screen').classList.remove('active');
        
        document.getElementById('user-name').textContent = this.currentUser.name;
        this.loadAvailableOrders();
    }

    showScreen(screenName) {
        // Hide all content screens
        document.querySelectorAll('.content-screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Remove active class from nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected screen
        document.getElementById(screenName + '-screen').classList.add('active');
        document.querySelector(`[data-screen="${screenName}"]`).classList.add('active');

        // Load data based on screen
        switch(screenName) {
            case 'available':
                this.loadAvailableOrders();
                break;
            case 'my-orders':
                this.loadMyOrders();
                break;
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorElement = document.getElementById('login-error');

        try {
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password,
                    role: 'delivery'
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                this.showMainScreen();
            } else {
                errorElement.textContent = data.message;
            }
        } catch (error) {
            errorElement.textContent = 'Error de conexión';
        }
    }

    logout() {
        localStorage.removeItem('currentUser');
        this.currentUser = null;
        this.showLoginScreen();
    }

    async loadAvailableOrders() {
        try {
            const response = await fetch('/orders/available');
            this.availableOrders = await response.json();
            this.renderAvailableOrders();
        } catch (error) {
            console.error('Error cargando pedidos disponibles:', error);
        }
    }

    renderAvailableOrders() {
        const container = document.getElementById('available-orders-list');
        container.innerHTML = '';

        if (this.availableOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No hay pedidos disponibles</h3>
                    <p>Los pedidos aparecerán aquí cuando estén listos para ser entregados</p>
                </div>
            `;
            return;
        }

        this.availableOrders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            const statusText = {
                'pending': 'Pendiente',
                'accepted': 'Aceptado',
                'in_progress': 'En camino',
                'delivered': 'Entregado'
            };

            const productsList = order.products.map(p => 
                `${p.name} x${p.quantity}`
            ).join(', ');

            orderCard.innerHTML = `
                <div class="order-header">
                    <h3>Pedido #${order.id}</h3>
                    <span class="order-status ${order.status}">${statusText[order.status] || order.status}</span>
                </div>
                <div class="order-info">
                    <p><strong>Tienda ID:</strong> ${order.storeId}</p>
                    <p><strong>Cliente ID:</strong> ${order.userId}</p>
                    <p><strong>Productos:</strong> ${productsList}</p>
                    <p><strong>Dirección:</strong> ${order.address}</p>
                    <p><strong>Método de pago:</strong> ${order.paymentMethod}</p>
                    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                    <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div class="order-actions">
                    <button class="btn-primary" onclick="app.viewOrderDetail(${order.id})">Ver Detalles</button>
                    ${order.status === 'pending' ? 
                        `<button class="btn-accept" onclick="app.acceptOrder(${order.id})">Aceptar Pedido</button>` : 
                        ''
                    }
                </div>
            `;
            container.appendChild(orderCard);
        });
    }

    async loadMyOrders() {
        try {
            // For simplicity, we'll show all orders that are not pending
            // In a real app, you'd filter by delivery person
            const response = await fetch('/orders/available');
            const allOrders = await response.json();
            this.myOrders = allOrders.filter(order => 
                order.status === 'accepted' || order.status === 'in_progress' || order.status === 'delivered'
            );
            this.renderMyOrders();
        } catch (error) {
            console.error('Error cargando mis pedidos:', error);
        }
    }

    renderMyOrders() {
        const container = document.getElementById('my-orders-list');
        container.innerHTML = '';

        if (this.myOrders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No tienes pedidos asignados</h3>
                    <p>Acepta pedidos desde la pestaña "Pedidos Disponibles"</p>
                </div>
            `;
            return;
        }

        this.myOrders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            const statusText = {
                'pending': 'Pendiente',
                'accepted': 'Aceptado',
                'in_progress': 'En camino',
                'delivered': 'Entregado'
            };

            const productsList = order.products.map(p => 
                `${p.name} x${p.quantity}`
            ).join(', ');

            orderCard.innerHTML = `
                <div class="order-header">
                    <h3>Pedido #${order.id}</h3>
                    <span class="order-status ${order.status}">${statusText[order.status] || order.status}</span>
                </div>
                <div class="order-info">
                    <p><strong>Tienda ID:</strong> ${order.storeId}</p>
                    <p><strong>Cliente ID:</strong> ${order.userId}</p>
                    <p><strong>Productos:</strong> ${productsList}</p>
                    <p><strong>Dirección:</strong> ${order.address}</p>
                    <p><strong>Método de pago:</strong> ${order.paymentMethod}</p>
                    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                    <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div class="order-actions">
                    <button class="btn-primary" onclick="app.viewOrderDetail(${order.id})">Ver Detalles</button>
                    ${order.status !== 'delivered' ? 
                        `<button class="btn-update" onclick="app.updateOrderStatus(${order.id})">Actualizar Estado</button>` : 
                        ''
                    }
                </div>
            `;
            container.appendChild(orderCard);
        });
    }

    viewOrderDetail(orderId) {
        const order = [...this.availableOrders, ...this.myOrders].find(o => o.id === orderId);
        if (order) {
            this.currentOrder = order;
            this.showOrderDetail();
        }
    }

    showOrderDetail() {
        if (!this.currentOrder) return;

        const container = document.getElementById('order-detail-content');
        const statusText = {
            'pending': 'Pendiente',
            'accepted': 'Aceptado',
            'in_progress': 'En camino',
            'delivered': 'Entregado'
        };

        const productsList = this.currentOrder.products.map(p => 
            `<div class="product-item">
                <span>${p.name} x${p.quantity}</span>
                <span>$${(p.price * p.quantity).toFixed(2)}</span>
            </div>`
        ).join('');

        container.innerHTML = `
            <div class="order-detail-card">
                <div class="order-detail-header">
                    <h2>Pedido #${this.currentOrder.id}</h2>
                    <span class="order-status ${this.currentOrder.status}">${statusText[this.currentOrder.status] || this.currentOrder.status}</span>
                </div>
                
                <div class="order-detail-content">
                    <div class="detail-section">
                        <h3>Información del Pedido</h3>
                        <p><strong>Tienda ID:</strong> ${this.currentOrder.storeId}</p>
                        <p><strong>Cliente ID:</strong> ${this.currentOrder.userId}</p>
                        <p><strong>Fecha:</strong> ${new Date(this.currentOrder.createdAt).toLocaleString()}</p>
                        <p><strong>Total:</strong> $${this.currentOrder.total.toFixed(2)}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h3>Información de Entrega</h3>
                        <p><strong>Dirección:</strong> ${this.currentOrder.address}</p>
                        <p><strong>Método de pago:</strong> ${this.currentOrder.paymentMethod}</p>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>Productos</h3>
                    <div class="products-list">
                        ${productsList}
                    </div>
                </div>
                
                <div class="status-controls">
                    <label for="status-select">Actualizar Estado:</label>
                    <select id="status-select" class="status-select">
                        <option value="accepted" ${this.currentOrder.status === 'accepted' ? 'selected' : ''}>Aceptado</option>
                        <option value="in_progress" ${this.currentOrder.status === 'in_progress' ? 'selected' : ''}>En camino</option>
                        <option value="delivered" ${this.currentOrder.status === 'delivered' ? 'selected' : ''}>Entregado</option>
                    </select>
                    <button class="btn-update" onclick="app.updateOrderStatusFromDetail()">Actualizar</button>
                </div>
            </div>
        `;

        // Show order detail screen
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('order-detail-screen').classList.add('active');
    }

    async acceptOrder(orderId) {
        try {
            const response = await fetch(`/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'accepted' })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Pedido aceptado exitosamente');
                this.loadAvailableOrders();
                this.loadMyOrders();
            } else {
                this.showNotification('Error al aceptar el pedido');
            }
        } catch (error) {
            this.showNotification('Error de conexión');
        }
    }

    async updateOrderStatus(orderId) {
        const newStatus = prompt('Ingresa el nuevo estado (accepted, in_progress, delivered):');
        if (newStatus && ['accepted', 'in_progress', 'delivered'].includes(newStatus)) {
            await this.updateOrderStatusAPI(orderId, newStatus);
        }
    }

    async updateOrderStatusFromDetail() {
        if (!this.currentOrder) return;
        
        const statusSelect = document.getElementById('status-select');
        const newStatus = statusSelect.value;
        
        if (newStatus !== this.currentOrder.status) {
            await this.updateOrderStatusAPI(this.currentOrder.id, newStatus);
        }
    }

    async updateOrderStatusAPI(orderId, newStatus) {
        try {
            const response = await fetch(`/orders/${orderId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Estado del pedido actualizado');
                this.loadAvailableOrders();
                this.loadMyOrders();
                
                // Update current order if it's the same
                if (this.currentOrder && this.currentOrder.id === orderId) {
                    this.currentOrder.status = newStatus;
                }
            } else {
                this.showNotification('Error al actualizar el estado del pedido');
            }
        } catch (error) {
            this.showNotification('Error de conexión');
        }
    }

    showNotification(message) {
        // Simple notification - could be enhanced with a proper notification system
        alert(message);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DeliveryApp();
});
