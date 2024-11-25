const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

// Función para inicializar la base de datos y crear tablas si no existen
function initializeDatabase() {
    db.serialize(() => {
        // Crear tabla para usuarios
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                password TEXT
            )
        `, (err) => {
            if (err) {
                console.error("Error al crear la tabla 'users':", err.message);
            } else {
                console.log("Tabla 'users' creada o ya existente.");
            }
        });

        // Crear tabla para reservas médicas
        db.run(`
            CREATE TABLE IF NOT EXISTS reservations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                rut TEXT NOT NULL,
                email TEXT NOT NULL,
                doctor TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error("Error al crear la tabla 'reservations':", err.message);
            } else {
                console.log("Tabla 'reservations' creada o ya existente.");
            }
        });
    });
}

// Función para crear un usuario nuevo
function createUser(username, email, password, callback) {
    const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    db.run(query, [username, email, password], function(err) {
        callback(err, this?.lastID);
    });
}

// Función para encontrar un usuario por nombre de usuario
function findUserByUsername(username, callback) {
    const query = `SELECT * FROM users WHERE username = ?`;
    db.get(query, [username], (err, row) => {
        callback(err, row);
    });
}

// Función para encontrar un usuario por correo electrónico
function findUserByEmail(email, callback) {
    const query = `SELECT * FROM users WHERE email = ?`;
    db.get(query, [email], (err, row) => {
        callback(err, row);
    });
}

// Función para verificar si un nombre de usuario o correo ya están registrados
function checkUserExists(username, email, callback) {
    const query = `SELECT * FROM users WHERE username = ? OR email = ?`;
    db.get(query, [username, email], (err, row) => {
        callback(err, row);
    });
}

// Función para crear una nueva reserva
function createReservation(name, rut, email, doctor, callback) {
    const query = `INSERT INTO reservations (name, rut, email, doctor) VALUES (?, ?, ?, ?)`;
    db.run(query, [name, rut, email, doctor], function(err) {
        if (err) {
            callback(err);
        } else {
            callback(null, this.lastID); // ID de la reserva creada
        }
    });
}

// Exporta las funciones
module.exports = {
    initializeDatabase,
    createUser,
    findUserByUsername,
    findUserByEmail,
    checkUserExists,
    createReservation, // Se incluye la función para reservas
};
