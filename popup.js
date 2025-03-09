const chatForm = document.getElementById('chatForm');
const chatHistory = document.getElementById('chatHistory');
const chatInput = document.getElementById('chatInput');
const clearBtn = document.getElementById('clear');

const autoComplete = Object.keys(math);
let historyIndex = -1; // Initialize history index
let userMessages = []; // Array to store user messages
let originalInput = ''; // Variable to store the original input before autocomplete
let autoCompleteIndex = -1; // Index to track the current autocomplete suggestion

chatInput.focus();
loadChatLog(); // Load chat log from localStorage after focusing
scrollToBottom(); // Scroll to the bottom of chat history after loading

chatForm.addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the form from submitting and refreshing the page
    let messageText = chatInput.value.trim();
    if (messageText !== '') {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        messageDiv.textContent = messageText;
        chatHistory.appendChild(messageDiv);
        
        // Save user message to localStorage
        saveMessageToLocalStorage('user', messageText);

        chatInput.value = ''; // Clear the input field
        try {
            let botMessage;
            messageText = parseInput(messageText); // Parse the input before evaluation
            if (autoComplete.includes(messageText)) {
                // If the input is an exact match to an autoComplete value, display help
                botMessage = math.help(messageText);
            } else {
                // Evaluate the expression safely
                botMessage = math.evaluate(messageText);
            }
            const responseDiv = document.createElement('div');
            responseDiv.className = 'message bot';
            responseDiv.textContent = botMessage;
            chatHistory.appendChild(responseDiv);
            
            // Save bot response to localStorage
            saveMessageToLocalStorage('bot', botMessage);
        } catch (error) {
            // Handle any errors that occur during evaluation
            const botMessage = 'Error: Invalid expression' + error;
            const responseDiv = document.createElement('div');
            responseDiv.className = 'message bot';
            responseDiv.textContent = botMessage;
            chatHistory.appendChild(responseDiv);
            
            // Save error message to localStorage
            saveMessageToLocalStorage('bot', botMessage);
        }
        scrollToBottom(); // Scroll to the bottom of chat history after adding messages
    }
    chatInput.focus(); // Refocus the input field
});

chatInput.addEventListener('keydown', function(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const chatLog = JSON.parse(localStorage.getItem('chatLog')) || [];
        userMessages = chatLog.filter(entry => entry.sender === 'user').map(entry => entry.message);

        if (event.key === 'ArrowUp') {
            if (historyIndex < userMessages.length - 1) {
                historyIndex++;
            }
        } else if (event.key === 'ArrowDown') {
            if (historyIndex > 0) {
                historyIndex--;
            } else {
                historyIndex = -1;
            }
        }

        if (historyIndex >= 0 && historyIndex < userMessages.length) {
            chatInput.value = userMessages[userMessages.length - 1 - historyIndex];
        } else {
            chatInput.value = '';
        }
    } else if (event.key === 'Tab') {
        event.preventDefault(); // Prevent default tab behavior
        const currentInput = chatInput.value.trim();
        if (currentInput.length > 0) {
            if (originalInput === '') {
                originalInput = currentInput;
                autoCompleteIndex = -1;
            }
            const matches = autoComplete.filter(item => item.startsWith(originalInput));
            if (matches.length > 0) {
                if (event.shiftKey) {
                    autoCompleteIndex = (autoCompleteIndex - 1 + matches.length) % matches.length;
                } else {
                    autoCompleteIndex = (autoCompleteIndex + 1) % matches.length;
                }
                chatInput.value = matches[autoCompleteIndex];
            }
        }
    } else {
        originalInput = ''; // Clear the original input if any other key is pressed
        autoCompleteIndex = -1; // Reset the autocomplete index
    }
});

clearBtn.addEventListener('click', function() {
    chatHistory.innerHTML = ''; // Clear chat history
    localStorage.removeItem('chatLog'); // Clear chat log from localStorage
    chatInput.focus(); // Refocus the input field
});

let isDragging = false;

chatHistory.addEventListener('mousedown', function() {
    isDragging = false;
});

chatHistory.addEventListener('mousemove', function() {
    isDragging = true;
});

chatHistory.addEventListener('mouseup', function(event) {
    if (!isDragging && event.target.classList.contains('message')) {
        chatInput.value += event.target.innerText; // Set chatInput value to clicked message text
        chatInput.focus();
    }
    isDragging = false;
});

function saveMessageToLocalStorage(sender, message) {
    const chatLog = JSON.parse(localStorage.getItem('chatLog')) || [];
    chatLog.push({ sender, message: message.toString() });
    localStorage.setItem('chatLog', JSON.stringify(chatLog));
}

function loadChatLog() {
    const chatLog = JSON.parse(localStorage.getItem('chatLog')) || [];
    chatLog.forEach(entry => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${entry.sender}`;
        messageDiv.textContent = entry.message;
        chatHistory.appendChild(messageDiv);
    });
}

function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function parseInput(input) {
    // Check if the first character is an operation and prepend the last bot message
    const lastBotMessage = getLastBotMessage();
    if (/^[+\-*/]/.test(input) && lastBotMessage) {
        return lastBotMessage + input;
    }
    const regex = /(\d+)\s*([FC])\s*to\s*([FC])/i;
    const match = input.match(regex);
    if (match) {
        const value = match[1];
        const fromUnit = match[2].toUpperCase() === 'F' ? 'fahrenheit' : 'celsius';
        const toUnit = match[3].toUpperCase() === 'F' ? 'fahrenheit' : 'celsius';
        return `${value} ${fromUnit} to ${toUnit}`;
    }
    return input;
}

function getLastBotMessage() {
    const chatLog = JSON.parse(localStorage.getItem('chatLog')) || [];
    const lastBotEntry = chatLog.reverse().find(entry => entry.sender === 'bot');
    return lastBotEntry ? lastBotEntry.message : '';
}
