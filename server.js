const express = require('express');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const nodemailer = require('nodemailer');
const db = require('./database');

const app = express();

// Configurar body-parser para manejar datos JSON y formularios
app.use(express.json());  // Para manejar datos en formato JSON
app.use(express.urlencoded({ extended: true }));  // Para manejar datos de formularios

// Configuración de sesión
app.use(session({
    secret: 'yourSecretKey', // Cambia esto por una clave secreta segura
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cambiar a `true` si usas HTTPS
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));

// Inicializa la base de datos
db.initializeDatabase();

// Configuración de nodemailer para enviar correos electrónicos
const transporter = nodemailer.createTransport({
    service: 'gmail',  // Puedes usar otro servicio
    auth: {
        user: 'proyecto.plataformasweb@gmail.com',  // Reemplaza con tu correo
        pass: 'lktb rdbu nmww napx'  // Reemplaza con tu contraseña
    }
});

// Rutas para las páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/create-user', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'create-user.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/verify-code', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verify-code.html')); // Página del formulario de verificación
});

// Ruta para la página de reservas
app.get('/reservar', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reservar.html')); // Página para el formulario de reserva
});

// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Error al cerrar sesión.");
        }
        res.redirect('/login'); // Redirigir al login después de cerrar sesión
    });
});

// Ruta para crear un usuario (sin enviar código de verificación aquí)
app.post('/create-user', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    // Validación de campos vacíos
    if (!username || !email || !password || !confirmPassword) {
        return res.json({ success: false, message: "Todos los campos son obligatorios." });
    }

    // Validar que las contraseñas coinciden
    if (password !== confirmPassword) {
        return res.json({ success: false, message: "Las contraseñas no coinciden." });
    }

    // Validación de la longitud mínima de la contraseña
    if (password.length < 8) {
        return res.json({ success: false, message: "La contraseña debe tener al menos 8 caracteres." });
    }

    // Validación del formato del email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.json({ success: false, message: "El correo electrónico no es válido." });
    }

    // Validación para que el nombre de usuario no contenga caracteres no permitidos
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(username)) {
        return res.json({ success: false, message: "El nombre de usuario solo puede contener letras y números." });
    }

    try {
        // Verificar si el nombre de usuario o el correo ya existen
        db.checkUserExists(username, email, (err, existingUser) => {
            if (existingUser) {
                return res.json({ success: false, message: "El nombre de usuario o el correo electrónico ya están registrados." });
            }

            // Si no existe, crear usuario
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.json({ success: false, message: "Error al procesar la contraseña." });
                }

                // Insertar el nuevo usuario
                db.createUser(username, email, hashedPassword, (err, userId) => {
                    if (err) {
                        return res.json({ success: false, message: "Error al crear el usuario." });
                    }

                    // No enviamos el correo de verificación aquí
                    res.json({ success: true, message: "Usuario creado con éxito. Ahora inicia sesión para verificar tu cuenta." });
                });
            });
        });
    } catch (error) {
        console.error("Error al procesar la solicitud:", error); // Log de error para debugging
        res.status(500).json({ success: false, message: "Error al procesar la solicitud." });
    }
});

// Ruta para iniciar sesión (enviar código de verificación aquí)
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ success: false, message: "Todos los campos son obligatorios." });
    }

    db.findUserByUsername(username, async (err, user) => {
        if (err || !user) {
            return res.json({ success: false, message: "Usuario no encontrado." });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.json({ success: false, message: "Contraseña incorrecta." });
        }

        // Guardar la sesión del usuario
        req.session.userId = user.id;

        // Generar y enviar el código de verificación al correo del usuario
        sendVerificationCode(user.email, (success, message) => {
            if (success) {
                res.json({ success: true, message: "Inicio de sesión exitoso. Revisa tu correo para el código de verificación." });
            } else {
                res.json({ success: false, message: message });
            }
        });
    });
});

// Función para enviar código de verificación
function sendVerificationCode(email, callback) {
    const verificationCode = Math.floor(100000 + Math.random() * 900000);  // Genera un código aleatorio de 6 dígitos

    // Guardar el código y el correo electrónico en la sesión
    session.verificationCode = verificationCode;
    session.email = email;

    const mailOptions = {
        from: 'proyecto.plataformasweb@gmail.com',  // Reemplaza con tu correo
        to: email,
        subject: 'Código de Verificación',
        text: `Tu código de verificación es: ${verificationCode}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return callback(false, "Error al enviar el correo de verificación.");
        }
        callback(true, "Correo de verificación enviado.");
    });
}

// Ruta para verificar el código
app.post('/verify-code', (req, res) => {
    const { enteredCode } = req.body;          
    const sessionCode = req.session.verificationCode;  

    if (enteredCode === sessionCode) {
        req.session.verified = true;           
        res.json({ success: true, message: 'Código verificado correctamente' });
    } else {
        res.json({ success: false, message: 'Código incorrecto' });
    }
});

// Importar librerías necesarias
const { validateEmail, validateRUT } = require('./utils'); // Asumiendo que has creado estas funciones en un archivo separado

// Ruta para reservar
app.post('/reservar', (req, res) => {
    const { name, rut, email, doctor } = req.body;

    console.log('Datos recibidos en el servidor:', req.body);  // Verifica los datos recibidos

    // Validar que todos los campos estén completos
    if (!name || !rut || !email || !doctor) {
        return res.json({ success: false, message: "Todos los campos son obligatorios." });
    }

    // Validar el formato del RUT
    if (!validateRUT(rut)) {
        return res.json({ success: false, message: "El RUT ingresado no es válido." });
    }

    // Validar el formato del correo electrónico
    if (!validateEmail(email)) {
        return res.json({ success: false, message: "El correo electrónico no es válido." });
    }

    // Verificar si el email ya está registrado
    db.findUserByEmail(email, (err, user) => {
        if (err) {
            return res.json({ success: false, message: "Error al verificar el correo electrónico." });
        }
        if (!user) {
            return res.json({ success: false, message: "El correo electrónico no está registrado." });
        }

        // Guardar la reserva en la base de datos
        db.createReservation(name, rut, email, doctor, (err, reservationId) => {
            if (err) {
                return res.json({ success: false, message: "Error al realizar la reserva." });
            }

            // Enviar un correo de confirmación de la reserva
            const mailOptions = {
                from: 'proyecto.plataformasweb@gmail.com',
                to: email,
                subject: 'Confirmación de Reserva',
                text: `Tu reserva fue realizada con éxito. Detalles:\n\nNombre: ${name}\nRUT: ${rut}\nDoctor: ${doctor}`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.json({ success: false, message: "Error al enviar la confirmación de la reserva." });
                }

                res.json({ success: true, message: "Reserva realizada con éxito. Revisa tu correo para la confirmación." });
            });
        });
    });
});

// Ruta para comprobar el estado de la sesión
app.get('/check-session', (req, res) => {
    if (req.session.userId && req.session.verified) {
        return res.json({ success: true, verified: req.session.verified });
    }
    res.json({ success: false });
});

app.listen(3000, () => {
    console.log("Servidor iniciado en http://localhost:3000");
});

