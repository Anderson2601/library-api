import { ObjectId } from "mongodb";
import { getDb } from "../config/database";
import { Author } from "../modules/authors/author.model";
import { Book } from "../modules/books/book.model";

const initialAuthors: Array<Pick<Author, "name" | "nationality" | "birthYear">> = [
    { name: "Miguel de Cervantes", nationality: "Española", birthYear: 1547 },
    { name: "Jane Austen", nationality: "Británica", birthYear: 1775 },
    { name: "Mary Shelley", nationality: "Británica", birthYear: 1797 },
    { name: "Fiódor Dostoyevski", nationality: "Rusa", birthYear: 1821 },
    { name: "Franz Kafka", nationality: "Austrohúngara", birthYear: 1883 },
    { name: "Jorge Luis Borges", nationality: "Argentina", birthYear: 1899 },
    { name: "George Orwell", nationality: "Británica", birthYear: 1903 },
    { name: "Gabriel García Márquez", nationality: "Colombiana", birthYear: 1927 },
    { name: "Toni Morrison", nationality: "Estadounidense", birthYear: 1931 },
    { name: "Isabel Allende", nationality: "Chilena", birthYear: 1942 },
];

type InitialBook = Pick<Book, "title" | "isbn" | "year" | "publicationLabel"> & {
    authorName: string;
};

const initialBooks: InitialBook[] = [
    {
        title: "Don Quijote de la Mancha",
        isbn: "978-84-204-7987-3",
        year: 1605,
        publicationLabel: "1605 (1.ª parte) / 1615 (2.ª parte)",
        authorName: "Miguel de Cervantes",
    },
    { title: "Novelas ejemplares", isbn: "978-84-7993-310-4", year: 1613, authorName: "Miguel de Cervantes" },
    { title: "Orgullo y prejuicio", isbn: "978-84-670-7783-4", year: 1813, authorName: "Jane Austen" },
    { title: "Sentido y sensibilidad", isbn: "978-958-5573-59-8", year: 1811, authorName: "Jane Austen" },
    { title: "Emma", isbn: "978-84-9105-007-0", year: 1815, authorName: "Jane Austen" },
    { title: "Frankenstein", isbn: "978-0-553-21247-1", year: 1818, authorName: "Mary Shelley" },
    { title: "El último hombre", isbn: "978-84-460-4856-5", year: 1826, authorName: "Mary Shelley" },
    { title: "Crimen y castigo", isbn: "978-84-9105-006-3", year: 1866, authorName: "Fiódor Dostoyevski" },
    { title: "Los hermanos Karamázov", isbn: "978-958-8925-36-3", year: 1880, authorName: "Fiódor Dostoyevski" },
    { title: "El idiota", isbn: "978-84-206-0907-2", year: 1869, authorName: "Fiódor Dostoyevski" },
    { title: "La metamorfosis", isbn: "978-628-7624-46-7", year: 1915, authorName: "Franz Kafka" },
    {
        title: "El proceso",
        isbn: "978-84-9759-281-9",
        year: 1925,
        publicationLabel: "1925 (póstuma)",
        authorName: "Franz Kafka",
    },
    {
        title: "El castillo",
        isbn: "978-84-9759-326-7",
        year: 1926,
        publicationLabel: "1926 (póstuma)",
        authorName: "Franz Kafka",
    },
    { title: "Ficciones", isbn: "978-84-9908-950-8", year: 1944, authorName: "Jorge Luis Borges" },
    { title: "El Aleph", isbn: "978-84-663-4683-2", year: 1949, authorName: "Jorge Luis Borges" },
    { title: "El libro de arena", isbn: "978-84-264-0750-4", year: 1975, authorName: "Jorge Luis Borges" },
    { title: "1984", isbn: "978-84-9989-094-4", year: 1949, authorName: "George Orwell" },
    { title: "Rebelión en la granja", isbn: "978-628-7624-14-6", year: 1945, authorName: "George Orwell" },
    { title: "Cien años de soledad", isbn: "978-84-9759-220-8", year: 1967, authorName: "Gabriel García Márquez" },
    {
        title: "El amor en los tiempos del cólera",
        isbn: "978-84-9759-245-1",
        year: 1985,
        authorName: "Gabriel García Márquez",
    },
    {
        title: "Crónica de una muerte anunciada",
        isbn: "978-84-9759-243-7",
        year: 1981,
        authorName: "Gabriel García Márquez",
    },
    { title: "Beloved", isbn: "978-84-9062-510-1", year: 1987, authorName: "Toni Morrison" },
    { title: "Ojos azules", isbn: "978-958-8820-88-0", year: 1970, authorName: "Toni Morrison" },
    { title: "La canción de Salomón", isbn: "978-84-9062-338-1", year: 1977, authorName: "Toni Morrison" },
    { title: "La casa de los espíritus", isbn: "978-628-7624-55-9", year: 1982, authorName: "Isabel Allende" },
    { title: "Paula", isbn: "978-958-8611-80-8", year: 1994, authorName: "Isabel Allende" },
    { title: "Eva Luna", isbn: "978-84-01-35291-1", year: 1987, authorName: "Isabel Allende" },
];

/** Carga el catálogo inicial solo en una base vacía, sin reemplazar datos existentes. */
export const seedInitialCatalog = async (): Promise<void> => {
    const db = getDb();
    const authors = db.collection<Author>("authors");
    const books = db.collection<Book>("books");
    const [authorCount, bookCount] = await Promise.all([
        authors.countDocuments(),
        books.countDocuments(),
    ]);

    if (authorCount > 0 || bookCount > 0) {
        return;
    }

    const now = new Date();
    const authorDocuments = initialAuthors.map((author) => ({
        ...author,
        createdAt: now,
        updatedAt: now,
    }));
    const authorResult = await authors.insertMany(authorDocuments);
    const authorIds = new Map<string, ObjectId>();

    initialAuthors.forEach((author, index) => {
        const id = authorResult.insertedIds[index];
        if (!id) {
            throw new Error(`No se pudo crear el autor ${author.name}`);
        }
        authorIds.set(author.name, id);
    });

    const bookDocuments: Book[] = initialBooks.map(({ authorName, ...book }) => {
        const authorId = authorIds.get(authorName);
        if (!authorId) {
            throw new Error(`No existe el autor de ${book.title}`);
        }
        return {
            ...book,
            authorId,
            available: true,
            createdAt: now,
            updatedAt: now,
        };
    });

    await books.insertMany(bookDocuments);
    console.log(`Catálogo inicial cargado: ${initialAuthors.length} autores y ${initialBooks.length} libros.`);
};
