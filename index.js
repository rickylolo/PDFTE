// Mis modulos de terceros
const express = require('express')
const router = express.Router()

// Creo mi aplicación express
const app = express()

//Especifico el puerto a utilizar
const port = process.env.PORT || 3000

// Especifico que express use JSON para el body
app.use(express.json({ limit: '50mb' }))

//Declaro un objeto que contenga mis funciones para mi PDF
const PDF = {
  getTextFromPDF: async (req, res) => {
    try {
      res.send(req.body)
    } catch (err) {
      res.status(500).send(err.message)
    }
  },
}

//Le asigno al router las acciones y su función a realizar
router.post('/PDF', PDF.getTextFromPDF)

// Agrego mis rutas para crear los endpoints de las entidades
app.use('/process', router)

// Cualquier otra ruta que no este definida arroja un status 404 page not found
app.get('*', (req, res) => {
  res.status(404).send('Esta página no existe')
})

app.listen(port, () => {
  console.log('Servidor escuchando en el puerto: ', port)
})
