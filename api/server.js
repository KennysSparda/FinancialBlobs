const express = require('express')
const cors = require('cors')
const app = express()
const port = 3001

const entityRoutes = require('./routes/entities')
const itemRoutes = require('./routes/items')

app.use(cors())
app.use(express.json())

app.use('/entities', entityRoutes)
app.use('/items', itemRoutes)

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`)
})
