const apiKey = "1ff0fb0d864f4a809a8164a33a85c28a";
const endpoint = "https://nlba-experimentation-eus.openai.azure.com/openai/deployments/text-gen/chat/completions?api-version=2024-02-15-preview";

document.getElementById('sendBtn').addEventListener('click', sendMessage);

function getLocalStorage() {
    return JSON.parse(localStorage.getItem('chatHistory')) || [];
}

function setLocalStorage(messages) {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
}

function updateChatbox(message, isUser = false) {
    const chatbox = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.color = isUser ? 'blue' : 'green';
    chatbox.appendChild(messageElement);
}

function retrieveChatHistory() {
    const chatHistory = getLocalStorage();
    chatHistory.forEach(msg => {
        updateChatbox(msg.content, msg.role === 'user');
    });
}

async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    if (!userInput.trim()) return;

    // Prepare the messages array for the request
    let messages = getLocalStorage();
    messages.push({ role: "user", content: userInput });

    // Display user message in the chatbox and temporarily update local storage
    updateChatbox(userInput, true);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': `${apiKey}`
        },
        body: JSON.stringify({
            messages: messages
        })
    });
    const data = await response.json();
    const botReply = data.choices[0].message.content;

    // Update the chat with the bot's reply and finalize local storage
    updateChatbox(botReply);
    messages.push({ role: "assistant", content: botReply }); // Include the bot's reply in messages
    setLocalStorage(messages); // Update local storage with the full conversation

    document.getElementById('userInput').value = ''; // Clear input field
}

window.onload = function() {
    retrieveChatHistory();
};
