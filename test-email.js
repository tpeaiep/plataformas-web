const nodemailer = require('nodemailer');

// Crear el transportador SMTP
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', // Aquí debes poner tu servidor SMTP (ej. smtp.gmail.com, smtp.yourdomain.com)
    port: 587,  // O el puerto correcto (25, 465 o 587)
    secure: false,  // Si usas TLS o SSL, pon 'true' para puerto 465, y 'false' para otros puertos
    auth: {
        user: 'proyecto.plataformasweb@gmail.com',  // Tu dirección de correo electrónico
        pass: 'lktb rdbu nmww napx'      // Tu contraseña de correo electrónico
    }
});

// Opciones del correo
const mailOptions = {
    from: 'proyecto.plataformasweb@gmail.com',  // Remitente
    to: 'aleguajardo17@gmail.com',     // Destinatario
    subject: 'Prueba de SMTP',       // Asunto
    text: 'Este es un mensaje de prueba para verificar el servidor SMTP.' // Cuerpo del mensaje
};

// Enviar el correo
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log('Error al enviar el correo:', error);
    } else {
        console.log('Correo enviado: ' + info.response);
    }
});
