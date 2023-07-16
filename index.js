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
      const { pdf, searchWordObject } = req.body

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
      const foundWords = []

      searchWordObject.forEach((obj) => {
        const { searchWord, wordLength, finishSearchWord } = obj
        const searchWordLength = searchWord.length

        let results = []

        //------------------ CASOS ---------------------

        if (searchWordLength === 0) {
          // Si la palabra buscada está vacía, no se agrega ningún resultado
          results = []
        } else if (wordLength === 0 && finishSearchWord === '') {
          // Si no se especifica longitud ni final de búsqueda, se obtienen todas las ocurrencias
          let currentIndex = text.indexOf(searchWord)
          while (currentIndex !== -1) {
            const result = text.slice(currentIndex + searchWordLength).trim()

            let trimmedResult = result
            if (trimmedResult.startsWith(':')) {
              trimmedResult = trimmedResult.slice(1).trim() // Eliminar el ":" al inicio
            }

            results.push(trimmedResult)

            currentIndex = text.indexOf(searchWord, currentIndex + 1)
          }
        } else if (wordLength > 0 && finishSearchWord === '') {
          // Si se especifica solo la longitud, se busca sin restricciones de final
          let currentIndex = 0
          while (currentIndex !== -1) {
            currentIndex = text.indexOf(searchWord, currentIndex)
            if (currentIndex !== -1) {
              const result = text
                .slice(currentIndex + searchWordLength)
                .trim()
                .replace(/^:/, '') // Eliminar el ":" al inicio

              results.push(result.substring(0, wordLength))

              currentIndex = text.indexOf(searchWord, currentIndex + 1)
            }
          }
        } else {
          // Si se especifica longitud o final de búsqueda, se realiza la búsqueda con restricciones
          let currentIndex = 0
          while (currentIndex !== -1) {
            currentIndex = text.indexOf(searchWord, currentIndex)
            if (currentIndex !== -1) {
              const endIndex =
                finishSearchWord === ''
                  ? currentIndex + searchWordLength
                  : text.indexOf(finishSearchWord, currentIndex + 1)
              if (endIndex !== -1) {
                const result = text
                  .slice(currentIndex + searchWordLength, endIndex)
                  .trim()

                if (result.startsWith(':')) {
                  if (wordLength > 0) {
                    results.push(
                      result.slice(1).trim().substring(0, wordLength)
                    ) // Eliminar el ":" al inicio
                  } else {
                    results.push(result.slice(1).trim()) // Eliminar el ":" al inicio
                  }
                } else {
                  if (wordLength > 0) {
                    results.push(result.substring(0, wordLength))
                  } else {
                    results.push(result)
                  }
                }
                currentIndex = endIndex
              } else {
                break
              }
            }
          }
        }

        foundWords.push({
          searchWord,
          results,
        })
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
  console.log('Servidor escuchando en el puerto:', port)
})
