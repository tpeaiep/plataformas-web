// Función para validar el correo electrónico
function validateEmail(email) {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
}

// Función para validar el formato del RUT chileno (ejemplo simplificado)
function validateRUT(rut) {
    const regex = /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/; // Formato XX.XXX.XXX-X
    return regex.test(rut);
}

module.exports = { validateEmail, validateRUT };