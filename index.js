const express = require('express')
const router = express.Router()
const pdfjsLib = require('pdfjs-dist/build/pdf')
const cors = require('cors')

// Creo mi aplicación express
const app = express()

// Especifico el puerto a utilizar
const port = process.env.PORT || 3000

// Especifico que express use JSON para el body
app.use(express.json({ limit: '50mb' }))
app.use(cors())

// Declaro un objeto que contenga mis funciones para mi PDF
const PDF = {
  getTextFromPDF: async (req, res) => {
    try {
      const { pdf, searchWords } = req.body

      const buffer = Buffer.from(pdf, 'base64')
      const data = new Uint8Array(buffer)
      const doc = await pdfjsLib.getDocument(data).promise
      const numPages = await doc.numPages
      let text = ''

      for (let i = 1; i <= numPages; i++) {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((item) => item.str).join(' ')
        text += pageText
      }

      // Buscar palabras en el texto obtenido del PDF
      const foundWords = {}
      searchWords.forEach((word) => {
        const regex = new RegExp(`\\b${word}\\b(?=:)(.*?)(?=\\b\\w+:|$)`, 'g')
        const matches = text.match(regex)
        if (matches) {
          foundWords[word] = matches.map((match) => match.trim())
        } else {
          foundWords[word] = []
        }
      })

      res.status(200).json({ text, foundWords })
    } catch (error) {
      res.status(500).send(`Error al extraer el texto: ${error}`)
    }
  },
}

// Le asigno al router las acciones y su función a realizar
router.post('/PDF', PDF.getTextFromPDF)

// Agrego mis rutas para crear los endpoints de las entidades
app.use('/process', router)

// Cualquier otra ruta que no esté definida arroja un status 404 page not found
app.get('*', (req, res) => {
  res.status(404).send('Esta página no existe')
})

app.listen(port, () => {
  console.log('Servidor escuchando en el puerto: ', port)
})
