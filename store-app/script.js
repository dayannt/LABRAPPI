class StoreApp {
    constructor() {
        this.currentUser = null;
        this.currentStore = null;
        this.products = [];
        this.orders = [];
        this.editingProduct = null;
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

        // Store status toggle
        document.getElementById('toggle-status').addEventListener('click', () => {
            this.toggleStoreStatus();
        });

        // Product management
        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.showProductModal();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideProductModal();
        });

        document.getElementById('cancel-product').addEventListener('click', () => {
            this.hideProductModal();
        });

        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleProductSubmit();
        });

        // Close modal when clicking outside
        document.getElementById('product-modal').addEventListener('click', (e) => {
            if (e.target.id === 'product-modal') {
                this.hideProductModal();
            }
        });
    }

    async checkAuth() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUser = JSON.parse(user);
            await this.loadStoreData();
            this.showMainScreen();
        } else {
            this.showLoginScreen();
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.add('active');
        document.getElementById('main-screen').classList.remove('active');
    }

    showMainScreen() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        
        document.getElementById('user-name').textContent = this.currentUser.name;
        this.loadDashboard();
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
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'products':
                this.loadProducts();
                break;
            case 'orders':
                this.loadOrders();
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
                    role: 'store'
                })
            });

            const data = await response.json();

            if (data.success) {
                this.currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                await this.loadStoreData();
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
        this.currentStore = null;
        this.showLoginScreen();
    }

    async loadStoreData() {
        try {
            // Load stores to find the one owned by current user
            const storesResponse = await fetch('/stores');
            const stores = await storesResponse.json();
            this.currentStore = stores.find(store => store.ownerId === this.currentUser.id);
            
            if (this.currentStore) {
                // Load products for this store
                const productsResponse = await fetch(`/products/${this.currentStore.id}`);
                this.products = await productsResponse.json();
                
                // Load orders for this store
                const ordersResponse = await fetch('/orders/available');
                const allOrders = await ordersResponse.json();
                this.orders = allOrders.filter(order => order.storeId === this.currentStore.id);
            }
        } catch (error) {
            console.error('Error cargando datos de la tienda:', error);
        }
    }

    loadDashboard() {
        if (!this.currentStore) {
            document.getElementById('store-info').innerHTML = '<p>No se encontró información de la tienda</p>';
            return;
        }

        // Show store info
        document.getElementById('store-info').innerHTML = `
            <h3>${this.currentStore.name}</h3>
            <p><strong>Descripción:</strong> ${this.currentStore.description}</p>
            <p><strong>Dirección:</strong> ${this.currentStore.address}</p>
            <p><strong>Teléfono:</strong> ${this.currentStore.phone}</p>
        `;

        // Update status
        const statusElement = document.getElementById('current-status');
        const toggleBtn = document.getElementById('toggle-status');
        
        if (this.currentStore.isOpen) {
            statusElement.textContent = 'Abierto';
            statusElement.className = 'open';
            toggleBtn.textContent = 'Cerrar Tienda';
        } else {
            statusElement.textContent = 'Cerrado';
            statusElement.className = 'closed';
            toggleBtn.textContent = 'Abrir Tienda';
        }

        // Update stats
        document.getElementById('products-count').textContent = this.products.length;
        
        const pendingOrders = this.orders.filter(order => order.status === 'pending').length;
        document.getElementById('pending-orders-count').textContent = pendingOrders;
        
        const today = new Date().toDateString();
        const todayOrders = this.orders.filter(order => 
            new Date(order.createdAt).toDateString() === today
        ).length;
        document.getElementById('today-orders-count').textContent = todayOrders;
    }

    async toggleStoreStatus() {
        if (!this.currentStore) return;

        const newStatus = !this.currentStore.isOpen;
        
        try {
            const response = await fetch(`/stores/${this.currentStore.id}/status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isOpen: newStatus })
            });

            const data = await response.json();
            
            if (data.success) {
                this.currentStore.isOpen = newStatus;
                this.loadDashboard();
                this.showNotification(`Tienda ${newStatus ? 'abierta' : 'cerrada'} exitosamente`);
            } else {
                this.showNotification('Error al cambiar el estado de la tienda');
            }
        } catch (error) {
            this.showNotification('Error de conexión');
        }
    }

    loadProducts() {
        const container = document.getElementById('products-list');
        container.innerHTML = '';

        if (this.products.length === 0) {
            container.innerHTML = '<p>No hay productos registrados</p>';
            return;
        }

        this.products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <h4>${product.name}</h4>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <button class="btn-edit" onclick="app.editProduct(${product.id})">Editar</button>
                    <button class="btn-delete" onclick="app.deleteProduct(${product.id})">Eliminar</button>
                </div>
            `;
            container.appendChild(productCard);
        });
    }

    showProductModal(product = null) {
        this.editingProduct = product;
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('product-form');
        
        if (product) {
            title.textContent = 'Editar Producto';
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-image').value = product.image || '';
        } else {
            title.textContent = 'Agregar Producto';
            form.reset();
        }
        
        modal.classList.add('active');
    }

    hideProductModal() {
        document.getElementById('product-modal').classList.remove('active');
        this.editingProduct = null;
    }

    async handleProductSubmit() {
        const name = document.getElementById('product-name').value;
        const price = parseFloat(document.getElementById('product-price').value);
        const image = document.getElementById('product-image').value;

        if (!this.currentStore) {
            this.showNotification('Error: No hay tienda seleccionada');
            return;
        }

        const productData = {
            name,
            price,
            image,
            storeId: this.currentStore.id
        };

        try {
            let response;
            if (this.editingProduct) {
                // Update existing product
                response = await fetch(`/products/${this.editingProduct.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productData)
                });
            } else {
                // Create new product
                response = await fetch('/products', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(productData)
                });
            }

            const data = await response.json();
            
            if (data.success) {
                this.showNotification(this.editingProduct ? 'Producto actualizado' : 'Producto creado');
                this.hideProductModal();
                await this.loadStoreData();
                this.loadProducts();
            } else {
                this.showNotification('Error al guardar el producto');
            }
        } catch (error) {
            this.showNotification('Error de conexión');
        }
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showProductModal(product);
        }
    }

    async deleteProduct(productId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
            return;
        }

        try {
            const response = await fetch(`/products/${productId}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('Producto eliminado');
                await this.loadStoreData();
                this.loadProducts();
            } else {
                this.showNotification('Error al eliminar el producto');
            }
        } catch (error) {
            this.showNotification('Error de conexión');
        }
    }

    loadOrders() {
        const container = document.getElementById('orders-list');
        container.innerHTML = '';

        if (this.orders.length === 0) {
            container.innerHTML = '<p>No hay pedidos</p>';
            return;
        }

        this.orders.forEach(order => {
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
                <p><strong>Cliente ID:</strong> ${order.userId}</p>
                <p><strong>Productos:</strong> ${productsList}</p>
                <p><strong>Dirección:</strong> ${order.address}</p>
                <p><strong>Método de pago:</strong> ${order.paymentMethod}</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
                <div class="order-actions">
                    ${order.status === 'pending' ? 
                        `<button class="btn-primary" onclick="app.acceptOrder(${order.id})">Aceptar Pedido</button>` : 
                        ''
                    }
                </div>
            `;
            container.appendChild(orderCard);
        });
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
                this.showNotification('Pedido aceptado');
                await this.loadStoreData();
                this.loadOrders();
                this.loadDashboard();
            } else {
                this.showNotification('Error al aceptar el pedido');
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
    window.app = new StoreApp();
});
