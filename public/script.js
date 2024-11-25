// Mostrar el mensaje emergente (pop-up)
function showPopup(message, isError = false) {
    const popupBackground = document.getElementById('popupBackground');
    const popupMessage = document.getElementById('popupMessage');

    // Aplica estilo de error o éxito
    popupMessage.className = isError ? 'popup-content popup-error' : 'popup-content popup-success';
    popupMessage.innerText = message;

    // Muestra el pop-up
    popupBackground.style.display = 'flex';

    // Oculta el pop-up después de 3 segundos
    setTimeout(() => {
        popupBackground.style.display = 'none';
    }, 3000);
}
// Función para formatear el RUT automáticamente
function formatRUT(rutInput) {
    let rut = rutInput.value.replace(/[^\dkK]/g, '');

    if (rut.length > 1) {
        rut = rut.replace(/^(\d{1,2})(\d{3})(\d{3})([\dkK])$/, '$1.$2.$3-$4');
    }
    rutInput.value = rut;
}

// Event listener para aplicar la función al campo RUT
document.getElementById('rutInput')?.addEventListener('input', (e) => formatRUT(e.target));


// Función para manejar respuestas del servidor y mostrar el mensaje en el pop-up
function handleServerResponse(response) {
    if (response.success) {
        showPopup(response.message, false); // Mensaje de éxito
    } else {
        showPopup(response.message, true);  // Mensaje de error
    }
}

// Verificar si el usuario está autenticado y verificado
window.onload = async function() {
    try {
        const response = await fetch('/check-session');
        const result = await response.json();

        if (result.success && result.verified) {
            // Si está autenticado y verificado, mostrar el botón de cerrar sesión
            document.getElementById('logoutButton').style.display = 'block';
            document.querySelectorAll('.user-buttons a').forEach(button => button.style.display = 'none');
        } else {
            // Si no está autenticado o verificado, mostrar los botones de inicio de sesión y crear usuario
            document.querySelectorAll('.user-buttons a').forEach(button => button.style.display = 'block');
            // Manejar reserva de horas desde la URL
            handleReservationURL();
        }
    } catch (error) {
        console.error('Error al verificar la sesión:', error);
    }
}

// Validación de correo electrónico
function validateEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

// Validación del input general
function validateInput(inputValue, type) {
    let regex;

    if (type === "username") {
        regex = /^[a-zA-Z0-9]+$/;
    } else if (type === "password") {
        regex = /^[a-zA-Z0-9@#$&*]+$/;
        if (inputValue.length < 8) {
            showPopup("La contraseña debe tener al menos 8 caracteres.", true);
            return false;
        }
    } else if (type === "email") {
        return validateEmail(inputValue);
    }

    return regex.test(inputValue);
}

// Validar correo en tiempo real
document.getElementById('emailInput')?.addEventListener('input', (e) => {
    if (!validateEmail(e.target.value)) {
        showPopup("Por favor, ingresa un correo válido.", true);
    }
});

// Función para cerrar sesión
async function logout() {
    try {
        await fetch('/logout', { method: 'POST' });
        window.location.href = '/login'; // Redirigir al login después de cerrar sesión
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    }
}

// Función para validar que solo se ingresen letras y números (y algunos caracteres especiales permitidos en contraseñas)
function validateInput(inputValue, type) {
    let regex;

    // Validación según el tipo de campo
    if (type === "username") {
        regex = /^[a-zA-Z0-9]+$/;
    } else if (type === "password") {
        regex = /^[a-zA-Z0-9@#$&*]+$/;

        if (inputValue.length < 8) {
            showPopup("La contraseña debe tener al menos 8 caracteres.", true);
            return false;
        }
    } else if (type === "email") {
        regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    }

    return regex.test(inputValue);
}

// Función para enviar el código de verificación
async function sendVerificationCode(email) {
    try {
        const response = await fetch('/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const result = await response.json();
        showPopup(result.message, !response.ok);
    } catch (error) {
        console.error(error);
        showPopup("Error al enviar el correo de verificación.", true);
    }
}

// Función para manejar la verificación del código
async function verifyCode(inputCode) {
    try {
        const response = await fetch('/verify-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enteredCode: inputCode })
        });
        const result = await response.json();

        if (response.ok) {
            showPopup("¡Bienvenidos al portal de Centro Médico!", false);
            await waitForPopupToDisappear();
            window.location.href = '/';
        } else {
            showPopup(result.message, true);
        }
    } catch (error) {
        console.error(error);
        showPopup("Error al verificar el código.", true);
    }
}

// Función para esperar que el pop-up se cierre
function waitForPopupToDisappear() {
    return new Promise(resolve => setTimeout(resolve, 3000));
}

// Función para enviar formularios con manejo de errores
async function handleFormSubmit(event, formId) {
    event.preventDefault();
    const form = document.getElementById(formId);
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validar campos vacíos
    if (!data.username || !data.password || (formId === 'createUserForm' && !data.email)) {
        showPopup("Todos los campos son obligatorios.", true);
        return;
    }

    // Validar caracteres no permitidos
    for (const key in data) {
        if ((key === 'username' || key === 'password' || key === 'email') && !validateInput(data[key], key)) {
            showPopup(`El campo "${key}" contiene caracteres no permitidos.`, true);
            return;
        }
    }

    try {
        const response = await fetch(form.action, {
            method: form.method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await response.json();

        handleServerResponse(result);

        // Mostrar el mensaje correspondiente
        if (formId === 'createUserForm' && result.success) {
            showPopup(result.message, false);
        } else if (formId === 'loginForm' && result.success) {
            showPopup(result.message, false);
            window.location.href = result.redirectTo || "/verify-code";
        } else {
            showPopup(result.message, true);
        }
    } catch (error) {
        console.error(error);
        showPopup("Ocurrió un error al procesar la solicitud.", true);
    }
}

// Redirigir a formulario de reserva con el servicio seleccionado
function reservarHora(servicio) {
    window.location.href = `/reservar?servicio=${encodeURIComponent(servicio)}`;
}

// Cargar los doctores en el formulario según el servicio
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const servicio = urlParams.get('servicio');
    console.log("Servicio desde la URL:", servicio); // Añadir para verificar
    
    if (servicio) {
        const doctoresPorServicio = {
            "Medicina General": ["Dr. Juan Pérez", "Dr. Ana Gómez", "Dr. Luis Torres"],
            "Dentista": ["Dra. Carla Ramírez", "Dr. Mario Ríos", "Dra. Silvia Márquez"],
            "Exámenes": ["Dr. Pablo García", "Dra. Clara Ruiz", "Dr. Ernesto López"],
            "Traumatólogo": ["Dr. Javier Muñoz", "Dr. Patricia Díaz", "Dra. Elena Sánchez"],
            "Matrona": ["Dra. Sofía Martínez", "Dra. Julia Castillo", "Dra. Sandra Ortiz"],
            "Oftalmólogo": ["Dr. Tomás Herrera", "Dra. Marta Ibáñez", "Dra. Carmen Núñez"],
            "Neurólogo": ["Dr. Rafael Montes", "Dra. Isabel Vega", "Dr. Álvaro Flores"]
        };

        const doctorSelect = document.getElementById('doctor');
        
        if (doctoresPorServicio[servicio]) {
            // Rellenar las opciones de doctores
            doctoresPorServicio[servicio].forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor;
                option.textContent = doctor;
                doctorSelect.appendChild(option);
            });
        } else {
            // Si el servicio no es válido, mostrar un mensaje
            const doctorSelect = document.getElementById('doctor');
            const option = document.createElement('option');
            option.textContent = 'Servicio no disponible';
            doctorSelect.appendChild(option);
        }
    } else {
        // Si no hay servicio en la URL, mostrar un mensaje
        const doctorSelect = document.getElementById('doctor');
        const option = document.createElement('option');
        option.textContent = 'Seleccione un servicio primero';
        doctorSelect.appendChild(option);
    }
};

// Event listeners para formularios y verificación del código
document.getElementById('createUserForm')?.addEventListener('submit', (e) => handleFormSubmit(e, 'createUserForm'));
document.getElementById('loginForm')?.addEventListener('submit', (e) => handleFormSubmit(e, 'loginForm'));
document.getElementById('verifyCodeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const codeInput = document.getElementById('verificationCodeInput').value;
    await verifyCode(codeInput);
});

// Ocultar el pop-up al hacer clic fuera del cuadro de mensaje
document.getElementById('popupBackground')?.addEventListener('click', (e) => {
    if (e.target.id === 'popupBackground') {
        document.getElementById('popupBackground').style.display = 'none';
    }
});