class ConsumerApp {
    constructor() {
        this.currentUser = null;
        this.cart = [];
        this.currentStore = null;
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

        // Back buttons
        document.getElementById('back-to-stores').addEventListener('click', () => {
            this.showMainScreen();
            this.showScreen('stores');
        });

        document.getElementById('back-to-cart').addEventListener('click', () => {
            this.showMainScreen();
            this.showScreen('cart');
        });

        // Checkout form
        document.getElementById('checkout-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCheckout();
        });

        // Checkout button
        document.getElementById('checkout-btn').addEventListener('click', () => {
            if (this.cart.length > 0) {
                this.showCheckoutScreen();
            }
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
        document.getElementById('store-detail-screen').classList.remove('active');
        document.getElementById('checkout-screen').classList.remove('active');
    }

    showMainScreen() {
        document.getElementById('login-screen').classList.remove('active');
        document.getElementById('main-screen').classList.add('active');
        document.getElementById('store-detail-screen').classList.remove('active');
        document.getElementById('checkout-screen').classList.remove('active');
        
        document.getElementById('user-name').textContent = this.currentUser.name;
        this.loadStores();
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
            case 'stores':
                this.loadStores();
                break;
            case 'cart':
                this.loadCart();
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
                    role: 'consumer'
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
        this.cart = [];
        this.showLoginScreen();
    }

    async loadStores() {
        try {
            const response = await fetch('/stores');
            const stores = await response.json();
            this.renderStores(stores);
        } catch (error) {
            console.error('Error cargando tiendas:', error);
        }
    }

    renderStores(stores) {
        const container = document.getElementById('stores-list');
        container.innerHTML = '';

        stores.forEach(store => {
            const storeCard = document.createElement('div');
            storeCard.className = 'store-card';
            storeCard.innerHTML = `
                <h3>${store.name}</h3>
                <p>${store.description}</p>
                <p>📍 ${store.address}</p>
                <p>📞 ${store.phone}</p>
                <span class="store-status ${store.isOpen ? 'open' : 'closed'}">
                    ${store.isOpen ? 'Abierto' : 'Cerrado'}
                </span>
            `;
            storeCard.addEventListener('click', () => {
                if (store.isOpen) {
                    this.showStoreDetail(store);
                }
            });
            container.appendChild(storeCard);
        });
    }

    async showStoreDetail(store) {
        this.currentStore = store;
        document.getElementById('store-name').textContent = store.name;
        
        // Show store info
        document.getElementById('store-info').innerHTML = `
            <h3>${store.name}</h3>
            <p>${store.description}</p>
            <p>📍 ${store.address}</p>
            <p>📞 ${store.phone}</p>
        `;

        // Load products
        try {
            const response = await fetch(`/products/${store.id}`);
            const products = await response.json();
            this.renderProducts(products);
        } catch (error) {
            console.error('Error cargando productos:', error);
        }

        // Show store detail screen
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('store-detail-screen').classList.add('active');
    }

    renderProducts(products) {
        const container = document.getElementById('store-products');
        container.innerHTML = '<h3>Productos</h3><div class="products-grid"></div>';
        const grid = container.querySelector('.products-grid');

        products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <h4>${product.name}</h4>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <button class="add-to-cart" data-product='${JSON.stringify(product)}'>
                    Agregar al Carrito
                </button>
            `;
            
            productCard.querySelector('.add-to-cart').addEventListener('click', (e) => {
                const product = JSON.parse(e.target.dataset.product);
                this.addToCart(product);
            });
            
            grid.appendChild(productCard);
        });
    }

    addToCart(product) {
        const existingItem = this.cart.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }
        
        this.updateCartUI();
        this.showNotification('Producto agregado al carrito');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.updateCartUI();
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.updateCartUI();
            }
        }
    }

    loadCart() {
        this.updateCartUI();
    }

    updateCartUI() {
        const container = document.getElementById('cart-items');
        const totalElement = document.getElementById('cart-total');
        const checkoutBtn = document.getElementById('checkout-btn');

        // Update cart badge in navigation
        this.updateCartBadge();

        if (this.cart.length === 0) {
            container.innerHTML = '<p>Tu carrito está vacío</p>';
            totalElement.innerHTML = '';
            checkoutBtn.disabled = true;
            return;
        }

        container.innerHTML = '';
        let total = 0;

        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>$${item.price.toFixed(2)} c/u</p>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" data-action="decrease" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn" data-action="increase" data-id="${item.id}">+</button>
                    <button class="btn-secondary" data-action="remove" data-id="${item.id}">Eliminar</button>
                </div>
            `;
            
            // Add event listeners for cart item controls
            cartItem.querySelectorAll('[data-action]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    const id = parseInt(e.target.dataset.id);
                    
                    switch(action) {
                        case 'decrease':
                            this.updateQuantity(id, -1);
                            break;
                        case 'increase':
                            this.updateQuantity(id, 1);
                            break;
                        case 'remove':
                            this.removeFromCart(id);
                            break;
                    }
                });
            });
            container.appendChild(cartItem);
        });

        totalElement.innerHTML = `<div class="cart-total">Total: $${total.toFixed(2)}</div>`;
        checkoutBtn.disabled = false;
    }

    updateCartBadge() {
        const cartBtn = document.querySelector('[data-screen="cart"]');
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        if (totalItems > 0) {
            cartBtn.innerHTML = `Carrito (${totalItems})`;
        } else {
            cartBtn.innerHTML = 'Carrito';
        }
    }

    showCheckoutScreen() {
        document.getElementById('main-screen').classList.remove('active');
        document.getElementById('checkout-screen').classList.add('active');
        
        this.renderOrderSummary();
    }

    renderOrderSummary() {
        const container = document.getElementById('order-items');
        const totalElement = document.getElementById('order-total');
        let total = 0;

        container.innerHTML = '';
        this.cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const orderItem = document.createElement('div');
            orderItem.innerHTML = `
                <p>${item.name} x${item.quantity} - $${itemTotal.toFixed(2)}</p>
            `;
            container.appendChild(orderItem);
        });

        totalElement.textContent = total.toFixed(2);
    }

    async handleCheckout() {
        const address = document.getElementById('address').value;
        const paymentMethod = document.getElementById('payment-method').value;

        if (!this.currentStore) {
            this.showNotification('Error: No hay tienda seleccionada');
            return;
        }

        const orderData = {
            userId: this.currentUser.id,
            storeId: this.currentStore.id,
            products: this.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            address,
            paymentMethod
        };

        try {
            const response = await fetch('/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            const data = await response.json();

            if (data.success) {
                this.showNotification('Pedido creado exitosamente');
                this.cart = [];
                this.showScreen('orders');
            } else {
                this.showNotification('Error al crear el pedido');
            }
        } catch (error) {
            this.showNotification('Error de conexión');
        }
    }

    async loadOrders() {
        try {
            const response = await fetch(`/orders/user/${this.currentUser.id}`);
            const orders = await response.json();
            this.renderOrders(orders);
        } catch (error) {
            console.error('Error cargando pedidos:', error);
        }
    }

    renderOrders(orders) {
        const container = document.getElementById('orders-list');
        container.innerHTML = '';

        if (orders.length === 0) {
            container.innerHTML = '<p>No tienes pedidos aún</p>';
            return;
        }

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            const statusText = {
                'pending': 'Pendiente',
                'accepted': 'Aceptado',
                'in_progress': 'En camino',
                'delivered': 'Entregado'
            };

            orderCard.innerHTML = `
                <div class="order-header">
                    <h3>Pedido #${order.id}</h3>
                    <span class="order-status ${order.status}">${statusText[order.status] || order.status}</span>
                </div>
                <p><strong>Tienda:</strong> ${order.storeId}</p>
                <p><strong>Dirección:</strong> ${order.address}</p>
                <p><strong>Método de pago:</strong> ${order.paymentMethod}</p>
                <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
                <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
            `;
            container.appendChild(orderCard);
        });
    }

    showNotification(message) {
        // Create a more user-friendly notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #ff6b35;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            font-weight: bold;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ConsumerApp();
});
