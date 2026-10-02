# library-api — API REST de gestión de una Biblioteca

API REST para gestionar **autores**, **libros** y **préstamos** de una biblioteca.
Construida con **Node.js + Express 5 + TypeScript + MongoDB** (driver oficial `mongodb`).

Arquitectura por capas en cada módulo: **rutas → controlador → servicio → repositorio**.

## Instalación y ejecución

```bash
npm install
cp .env.example .env      # y edita MONGO_URI / MONGO_DB_NAME
npm run dev               # desarrollo (nodemon + ts-node)
npm run build && npm start   # producción
```

Variables de entorno (`.env.example`): `PORT`, `NODE_ENV`, `MONGO_URI`, `MONGO_DB_NAME`.

## Estructura

```
src/
├── api/v1/index.ts            # enrutador /api/v1
├── config/                    # env.ts (variables) y database.ts (conexión Mongo)
├── shared/
│   ├── errors/AppError.ts     # errores con código HTTP (400, 404, 409)
│   ├── middlewares/           # asyncHandler y errorHandler centralizado
│   └── utils/                 # validators.ts y pagination.ts
└── modules/
    ├── authors/  (model · repository · service · controller · routes)
    ├── books/
    └── loans/
```

## Endpoints (base: `http://localhost:3000/api/v1`)

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST / GET / GET :id / PUT :id / DELETE :id | `/authors` | CRUD de autores |
| GET | `/authors/:id/books` | Libros de un autor (extra) |
| POST / GET / GET :id / PUT :id / DELETE :id | `/books` | CRUD de libros |
| POST / GET / GET :id / PUT :id / DELETE :id | `/loans` | CRUD de préstamos |
| GET | `/loans/active` | Préstamos sin devolver (extra) |
| GET | `/health` | Estado del servidor (fuera de `/api/v1`) |

**Filtros y paginación (extras):** todos los listados aceptan `?page=1&limit=10` y responden
`{ data, page, limit, total, totalPages }`. Además: `/books?available=true&authorId=<id>` y `/loans?returned=false&bookId=<id>`.

### Ejemplos (curl)

```bash
# Crear autor
curl -X POST http://localhost:3000/api/v1/authors -H "Content-Type: application/json" \
  -d '{"name":"Gabriel García Márquez","nationality":"Colombiana","birthYear":1927}'

# Crear libro (usa el _id del autor)
curl -X POST http://localhost:3000/api/v1/books -H "Content-Type: application/json" \
  -d '{"title":"Cien años de soledad","isbn":"978-0307474728","authorId":"<AUTHOR_ID>","year":1967}'

# Registrar préstamo (el libro pasa a available:false)
curl -X POST http://localhost:3000/api/v1/loans -H "Content-Type: application/json" \
  -d '{"bookId":"<BOOK_ID>","userName":"Ana Pérez","loanDate":"2025-05-20"}'

# Devolver el libro (asigna returnDate y el libro vuelve a available:true)
curl -X PUT http://localhost:3000/api/v1/loans/<LOAN_ID> -H "Content-Type: application/json" \
  -d '{"returned":true}'

# Listar libros disponibles, página 1
curl "http://localhost:3000/api/v1/books?available=true&page=1&limit=5"
```

Se incluye `requests.http` con todas las peticiones listas para la extensión **REST Client** de VS Code.

## Validaciones y reglas de negocio

- **Autores:** `name` y `nationality` obligatorios; `birthYear` entero positivo (opcional). **No se puede eliminar un autor con libros asociados.**
- **Libros:** `title`, `isbn` (único) y `authorId` obligatorios; el autor debe existir; `available` por defecto `true`. **Al registrar un préstamo el libro debe estar disponible y pasa a `available:false`.** Un libro con préstamo activo no puede eliminarse.
- **Préstamos:** `bookId` (debe existir), `userName` y `loanDate` obligatorios. **Al enviar `returned:true` se asigna `returnDate` (la enviada o la actual) y el libro vuelve a `available:true`.** Un préstamo devuelto no puede modificarse; el libro de un préstamo no puede cambiarse.
- La reserva del libro es atómica (`findOneAndUpdate` con `available:true`), evitando que dos préstamos simultáneos tomen el mismo libro.

## Códigos HTTP

`201` creado · `200` OK · `204` eliminado · `400` datos inválidos (campos, ids, fechas) · `404` recurso o referencia inexistente · `409` conflicto con una regla de negocio (ISBN repetido, libro no disponible, autor con libros…) · `500` error interno.
