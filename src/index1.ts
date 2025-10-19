import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()
// API displaying my name
app.get('/', (c) => {
  return c.text('Hello Hono!  This is Evanson!')
})

// In-memory books done here
type Book = {
  id: number
  title: string
  author: string
  description?: string
  published?: string
  pages?: number
}

let books: Book[] = [
  { id: 1, title: 'The Hono Guide', author: 'Evan', description: 'Learn Hono', published: '2024-01-01', pages: 120 },
  { id: 2, title: 'Node APIs', author: 'Alex', description: 'Building APIs on Node', published: '2023-06-15', pages: 220 },
  { id: 3, title: 'Javascript', author: 'Duncan', description: 'Javascript for Developrts', published: '2021-11-20', pages: 380 }
]

let nextId = books.length + 1
const getNextId = () => nextId++

// --- handlers extracted so they can be reused by /books and /api/books 
const listBooks = (c: any) => {
  const url = new URL(c.req.url)
  const author = url.searchParams.get('author')
  const title = url.searchParams.get('title')
  const q = url.searchParams.get('q')

  let result = books.slice()

  if (author) {
    result = result.filter(b => b.author.toLowerCase() === author.toLowerCase())
  }
  if (title) {
    result = result.filter(b => b.title.toLowerCase().includes(title.toLowerCase()))
  }
  if (q) {
    const qlc = q.toLowerCase()
    result = result.filter(b => b.title.toLowerCase().includes(qlc) || b.author.toLowerCase().includes(qlc))
  }

  return c.json(result)
}

const getBook = (c: any) => {
  const id = Number(c.req.param('id'))
  const book = books.find(b => b.id === id)
  if (!book) return c.json({ message: 'Book not found' }, 404)
  return c.json(book)
}

const createBook = async (c: any) => {
  const body = await c.req.json().catch(() => ({}))
  const { title, author, description, published, pages } = body

  if (!title || !author) {
    return c.json({ message: 'title and author are required' }, 400)
  }

  const newBook: Book = {
    id: getNextId(),
    title,
    author,
    description,
    published,
    pages
  }
  books.push(newBook)
  return c.json(newBook, 201)
}

const updateBook = async (c: any) => {
  const id = Number(c.req.param('id'))
  const bookIndex = books.findIndex(b => b.id === id)
  if (bookIndex === -1) return c.json({ message: 'Book not found' }, 404)

  const body = await c.req.json().catch(() => ({}))
  const updated = { ...books[bookIndex], ...body, id }
  books[bookIndex] = updated
  return c.json(updated)
}

const deleteBook = (c: any) => {
  const id = Number(c.req.param('id'))
  const before = books.length
  books = books.filter(b => b.id !== id)
  if (books.length === before) return c.json({ message: 'Book not found' }, 404)
  return c.text('', 204)
}

// --- register routes for both /books and /api/books ---
app.get('/books', listBooks)
app.get('/api/books', listBooks)

app.get('/books/:id', getBook)
app.get('/api/books/:id', getBook)

app.post('/books', createBook)
app.post('/api/books', createBook)

app.put('/books/:id', updateBook)
app.put('/api/books/:id', updateBook)

app.delete('/books/:id', deleteBook)
app.delete('/api/books/:id', deleteBook)

// 
serve({
  fetch: app.fetch,
  port: 5050
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
