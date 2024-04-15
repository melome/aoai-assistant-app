const apiKey = "1ff0fb0d864f4a809a8164a33a85c28a";
const endpoint = "https://nlba-experimentation-eus.openai.azure.com/openai/deployments/text-gen/chat/completions?api-version=2024-02-15-preview";

document.getElementById('sendBtn').addEventListener('click', sendMessage);

function getLocalStorage() {
    const threadId = JSON.parse(localStorage.getItem('threadId')) || '';
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

    return {
        threadId,
        chatHistory
    };
}

function setLocalStorage( threadId, messages) {
    localStorage.setItem('chatHistory', JSON.stringify(messages));
    localStorage.setItem('threadId', JSON.stringify(threadId));
}

function updateChatbox(message, isUser = false) {
    const chatbox = document.getElementById('messages');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    messageElement.style.color = isUser ? 'blue' : 'green';
    chatbox.appendChild(messageElement);
}

function retrieveChatHistory() {
    const chatHistory = getLocalStorage().chatHistory;
    chatHistory.forEach(msg => {
        updateChatbox(msg.content, msg.role === 'user');
    });
}

const generateResponse = async (query, threadId) => {

    let url = 'http://localhost:7071/api/messages'
    if (threadId) {
        url += `?threadId=${threadId}`;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            query: query
        })
    });

    try {
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("An error occurred:", error.response ? error.response.data : error.message);
        return null;     
    }
}


async function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    if (!userInput.trim()) return;

    // Prepare the messages array for the request
    let messages = getLocalStorage().chatHistory || [];
    messages.push({ role: "user", content: userInput });

    console.log(messages)

    // Display user message in the chatbox and temporarily update local storage
    updateChatbox(userInput, true);

    let threadId = getLocalStorage().threadId || '';
    let response = null;

    if (threadId) {
        response = await generateResponse(userInput, threadId);
        threadId = response.messages[0].thread_id;
    } else {
        response = await generateResponse(userInput);
        threadId = response.messages[0].thread_id;
    }

    console.log(getLocalStorage().threadId)
    console.log(threadId);

    let botReply = '';

    const messageResponseContent = response.messages[0].content;
    for (const item of messageResponseContent) {
        if (item.type === "text") {
            botReply = item.text?.value;            
        } else if (item.type === "image_file") {
            botReply = item.imageFile?.fileId;
        }
    }

    // Update the chat with the bot's reply and finalize local storage
    updateChatbox(botReply);
    // Include the bot's reply in messages
    messages.push({ role: "assistant", content: botReply }); 
    // Update local storage with the full conversation
    setLocalStorage(threadId, messages); 

    document.getElementById('userInput').value = ''; // Clear input field
}

window.onload = function() {
    retrieveChatHistory();
};
