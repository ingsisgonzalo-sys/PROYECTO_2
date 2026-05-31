// Simulación de usuarios de prueba
const defaultContacts = [
    { id: 1, name: 'Juan García', status: 'online', avatar: 'J' },
    { id: 2, name: 'María López', status: 'online', avatar: 'M' },
    { id: 3, name: 'Carlos Rodríguez', status: 'offline', avatar: 'C' },
    { id: 4, name: 'Ana Martínez', status: 'online', avatar: 'A' },
    { id: 5, name: 'Pedro Sánchez', status: 'away', avatar: 'P' },
];

// Estado de la aplicación
let app = {
    currentUser: 'Tú',
    currentContactId: null,
    contacts: [],
    chats: {}, // { contactId: [messages] }
    filteredContacts: []
};

// Inicializar la aplicación
function init() {
    loadFromLocalStorage();
    renderContacts();
    setupEventListeners();
    
    // Seleccionar primer contacto por defecto
    if (app.contacts.length > 0) {
        selectContact(app.contacts[0].id);
    }
}

// Cargar datos del localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem('chatAppData');
    if (saved) {
        const data = JSON.parse(saved);
        app.contacts = data.contacts || defaultContacts;
        app.chats = data.chats || {};
    } else {
        app.contacts = [...defaultContacts];
        app.chats = {};
        defaultContacts.forEach(contact => {
            app.chats[contact.id] = [];
        });
        saveToLocalStorage();
    }
}

// Guardar datos en localStorage
function saveToLocalStorage() {
    localStorage.setItem('chatAppData', JSON.stringify({
        contacts: app.contacts,
        chats: app.chats
    }));
}

// Setup de event listeners
function setupEventListeners() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('btnSend');
    const newChatBtn = document.getElementById('btnNewChat');
    const createChatBtn = document.getElementById('btnCreateChat');
    const closeModalBtn = document.querySelector('.close-btn');
    const searchInput = document.getElementById('searchInput');
    const modal = document.getElementById('newChatModal');
    const newContactInput = document.getElementById('newContactInput');
    
    // Enviar mensaje
    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Nuevo chat
    newChatBtn.addEventListener('click', () => {
        modal.classList.remove('hidden');
        newContactInput.focus();
    });
    
    closeModalBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
    
    createChatBtn.addEventListener('click', createNewChat);
    newContactInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            createNewChat();
        }
    });
    
    // Búsqueda
    searchInput.addEventListener('input', filterContacts);
    
    // Cerrar modal al hacer click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

// Renderizar contactos
function renderContacts() {
    const contactsList = document.getElementById('contactsList');
    const contacts = app.filteredContacts.length > 0 ? app.filteredContacts : app.contacts;
    
    if (contacts.length === 0) {
        contactsList.innerHTML = '<div style="text-align: center; padding: 40px 20px; color: #999;">No hay contactos</div>';
        return;
    }
    
    contactsList.innerHTML = contacts.map(contact => {
        const isActive = contact.id === app.currentContactId;
        const lastMessage = app.chats[contact.id]?.[app.chats[contact.id].length - 1];
        const preview = lastMessage ? lastMessage.text : 'Sin mensajes';
        
        return `
            <div class="contact-item ${isActive ? 'active' : ''}" onclick="selectContact(${contact.id})">
                <div class="contact-avatar" style="background: linear-gradient(135deg, ${getAvatarColor(contact.id)}, ${getAvatarColor(contact.id + 100)});">
                    ${contact.avatar}
                </div>
                <div class="contact-info">
                    <div class="contact-name">${contact.name}</div>
                    <div class="contact-preview">${preview}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Obtener color de avatar (usando el ID como seed)
function getAvatarColor(id) {
    const colors = ['#25d366', '#075e54', '#128c7e', '#0084d6', '#667bc6', '#d946ef'];
    return colors[id % colors.length];
}

// Filtrar contactos
function filterContacts(e) {
    const searchTerm = e.target.value.toLowerCase();
    app.filteredContacts = app.contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm)
    );
    renderContacts();
}

// Seleccionar contacto
function selectContact(contactId) {
    app.currentContactId = contactId;
    const contact = app.contacts.find(c => c.id === contactId);
    
    if (contact) {
        document.getElementById('contactName').textContent = contact.name;
        document.getElementById('contactStatus').textContent = getStatusText(contact.status);
    }
    
    renderMessages();
    renderContacts();
    
    // Scroll al último mensaje
    setTimeout(() => {
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// Obtener texto de estado
function getStatusText(status) {
    const statusMap = {
        'online': 'en línea',
        'offline': 'desconectado',
        'away': 'ausente'
    };
    return statusMap[status] || status;
}

// Renderizar mensajes
function renderMessages() {
    const container = document.getElementById('messagesContainer');
    
    if (!app.currentContactId) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p>Selecciona un contacto para empezar a chatear</p>
            </div>
        `;
        return;
    }
    
    const messages = app.chats[app.currentContactId] || [];
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p>No hay mensajes. ¡Inicia la conversación!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = messages.map((msg, index) => {
        const isSent = msg.sender === app.currentUser;
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const showTime = !prevMsg || (msg.timestamp - prevMsg.timestamp > 60000); // Mostrar tiempo si pasó más de 1 minuto
        
        return `
            <div class="message-group ${isSent ? 'sent' : 'received'}">
                <div>
                    <div class="message-bubble">${escapeHtml(msg.text)}</div>
                    <div class="message-time">
                        <span>${formatTime(msg.timestamp)}</span>
                        ${isSent ? '<span class="message-status">✓✓</span>' : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Enviar mensaje
function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text || !app.currentContactId) return;
    
    // Crear mensaje
    const message = {
        sender: app.currentUser,
        text: text,
        timestamp: Date.now(),
        status: 'sent'
    };
    
    // Agregar a la lista de chats
    if (!app.chats[app.currentContactId]) {
        app.chats[app.currentContactId] = [];
    }
    app.chats[app.currentContactId].push(message);
    
    // Guardar en localStorage
    saveToLocalStorage();
    
    // Limpiar input
    input.value = '';
    input.style.height = 'auto';
    
    // Renderizar
    renderMessages();
    renderContacts();
    
    // Simular respuesta del otro usuario después de 1-3 segundos
    setTimeout(() => {
        simulateReply();
    }, 1000 + Math.random() * 2000);
    
    // Scroll al último mensaje
    setTimeout(() => {
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// Simular respuesta automática
function simulateReply() {
    if (!app.currentContactId) return;
    
    const replies = [
        '¡Hola! ¿Cómo estás?',
        'Entendido',
        'Claro, sin problema',
        'Jajaja muy bueno',
        '👍',
        'Nos vemos luego',
        'De acuerdo',
        'Perfecto',
        'Gracias por el mensaje',
        '¿Cómo estuvo tu día?',
        'Te paso el documento',
        'En 5 minutos estoy ahí'
    ];
    
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    
    const message = {
        sender: app.contacts.find(c => c.id === app.currentContactId)?.name,
        text: randomReply,
        timestamp: Date.now(),
        status: 'received'
    };
    
    app.chats[app.currentContactId].push(message);
    saveToLocalStorage();
    
    if (app.currentContactId) {
        renderMessages();
        renderContacts();
        
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }
}

// Crear nuevo chat
function createNewChat() {
    const input = document.getElementById('newContactInput');
    const name = input.value.trim();
    
    if (!name) {
        alert('Por favor ingresa un nombre');
        return;
    }
    
    // Verificar si el contacto ya existe
    if (app.contacts.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        alert('Este contacto ya existe');
        return;
    }
    
    // Crear nuevo contacto
    const newId = Math.max(...app.contacts.map(c => c.id), 0) + 1;
    const avatar = name.charAt(0).toUpperCase();
    
    const newContact = {
        id: newId,
        name: name,
        status: 'online',
        avatar: avatar
    };
    
    app.contacts.push(newContact);
    app.chats[newId] = [];
    
    saveToLocalStorage();
    
    // Cerrar modal y limpiar
    document.getElementById('newChatModal').classList.add('hidden');
    input.value = '';
    
    // Renderizar y seleccionar el nuevo contacto
    renderContacts();
    selectContact(newId);
}

// Utilidades
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Ajustar altura del textarea automáticamente
document.getElementById('messageInput')?.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
});

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
