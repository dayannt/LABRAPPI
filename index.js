const express = require("express")
const path = require("path")
const cors = require("cors")
const fs = require("fs")

const app = express()

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

// Servir las aplicaciones cliente
app.use("/consumer-app", express.static(path.join(__dirname, "consumer-app")))
app.use("/store-app", express.static(path.join(__dirname, "store-app")))
app.use("/delivery-app", express.static(path.join(__dirname, "delivery-app")))

// Cargar datos mock
let users = []
let stores = []
let products = []
let orders = []

// Función para cargar datos desde archivos JSON
function loadMockData() {
  try {
    users = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "users.json"), "utf8"))
    stores = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "stores.json"), "utf8"))
    products = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "products.json"), "utf8"))
    orders = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "orders.json"), "utf8"))
  } catch (error) {
    console.log("Error cargando datos mock:", error.message)
  }
}

// Función para guardar datos en archivos JSON
function saveMockData() {
  try {
    fs.writeFileSync(path.join(__dirname, "data", "users.json"), JSON.stringify(users, null, 2))
    fs.writeFileSync(path.join(__dirname, "data", "stores.json"), JSON.stringify(stores, null, 2))
    fs.writeFileSync(path.join(__dirname, "data", "products.json"), JSON.stringify(products, null, 2))
    fs.writeFileSync(path.join(__dirname, "data", "orders.json"), JSON.stringify(orders, null, 2))
  } catch (error) {
    console.log("Error guardando datos mock:", error.message)
  }
}

// Cargar datos al iniciar
loadMockData()

// ===== ENDPOINTS DE AUTENTICACIÓN =====
app.post("/auth/login", (req, res) => {
  const { email, password, role } = req.body
  
  const user = users.find(u => u.email === email && u.password === password && u.role === role)
  
  if (user) {
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } else {
    res.status(401).json({
      success: false,
      message: "Credenciales inválidas"
    })
  }
})

// ===== ENDPOINTS DE TIENDAS =====
app.get("/stores", (req, res) => {
  res.json(stores)
})

app.post("/stores/:id/status", (req, res) => {
  const { id } = req.params
  const { isOpen } = req.body
  
  const store = stores.find(s => s.id === parseInt(id))
  if (store) {
    store.isOpen = isOpen
    saveMockData()
    res.json({ success: true, store })
  } else {
    res.status(404).json({ success: false, message: "Tienda no encontrada" })
  }
})

// ===== ENDPOINTS DE PRODUCTOS =====
app.get("/products/:storeId", (req, res) => {
  const { storeId } = req.params
  const storeProducts = products.filter(p => p.storeId === parseInt(storeId))
  res.json(storeProducts)
})

app.post("/products", (req, res) => {
  const { name, price, image, storeId } = req.body
  
  const newProduct = {
    id: products.length + 1,
    name,
    price: parseFloat(price),
    image: image || "",
    storeId: parseInt(storeId)
  }
  
  products.push(newProduct)
  saveMockData()
  res.json({ success: true, product: newProduct })
})

// ===== ENDPOINTS DE ÓRDENES =====
app.post("/orders", (req, res) => {
  const { userId, storeId, products: orderProducts, total, address, paymentMethod } = req.body
  
  const newOrder = {
    id: orders.length + 1,
    userId: parseInt(userId),
    storeId: parseInt(storeId),
    products: orderProducts,
    total: parseFloat(total),
    address,
    paymentMethod,
    status: "pending",
    createdAt: new Date().toISOString()
  }
  
  orders.push(newOrder)
  saveMockData()
  res.json({ success: true, order: newOrder })
})

app.get("/orders/user/:userId", (req, res) => {
  const { userId } = req.params
  const userOrders = orders.filter(o => o.userId === parseInt(userId))
  res.json(userOrders)
})

app.get("/orders/available", (req, res) => {
  const availableOrders = orders.filter(o => o.status === "pending" || o.status === "accepted")
  res.json(availableOrders)
})

app.patch("/orders/:id/status", (req, res) => {
  const { id } = req.params
  const { status } = req.body
  
  const order = orders.find(o => o.id === parseInt(id))
  if (order) {
    order.status = status
    saveMockData()
    res.json({ success: true, order })
  } else {
    res.status(404).json({ success: false, message: "Orden no encontrada" })
  }
})

// Endpoint para actualizar productos
app.put("/products/:id", (req, res) => {
  const { id } = req.params
  const { name, price, image, storeId } = req.body
  
  const product = products.find(p => p.id === parseInt(id))
  if (product) {
    product.name = name
    product.price = parseFloat(price)
    product.image = image || ""
    product.storeId = parseInt(storeId)
    saveMockData()
    res.json({ success: true, product })
  } else {
    res.status(404).json({ success: false, message: "Producto no encontrado" })
  }
})

// Endpoint para eliminar productos
app.delete("/products/:id", (req, res) => {
  const { id } = req.params
  
  const productIndex = products.findIndex(p => p.id === parseInt(id))
  if (productIndex !== -1) {
    products.splice(productIndex, 1)
    saveMockData()
    res.json({ success: true, message: "Producto eliminado" })
  } else {
    res.status(404).json({ success: false, message: "Producto no encontrado" })
  }
})

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"))
})

const PORT = process.env.PORT || 5050
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`)
})
