// /api/server.js
require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()
const port = 3001

const authRoutes = require('./routes/auth')
const entityRoutes = require('./routes/entities')
const itemRoutes = require('./routes/items')

app.use(cors())
app.use(express.json())

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/entities', entityRoutes)
app.use('/api/v1/items', itemRoutes)

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`)
})
