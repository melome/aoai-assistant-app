const dotenv = require('dotenv');
const axios = require('axios');

// Azure OPEN AI Credentials
const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
const azureApiKey = process.env["AZURE_OPENAI_API_KEY"];

// Azure OPEN AI Config
const model = "gpt-35-turbo";
const apiVersion = "2024-02-15-preview";

// Azure OPEN AI Assistant
//const assistantId = "asst_fRiGSuHQxjFh3Ooy5BtAoqgb"

// Azure OPEN AI Axios
const createThreadAndRun = async (assistantId, userMessage) => {
    let data = JSON.stringify({
        "assistant_id": assistantId,
        "thread": {
            "messages": [
                {
                    "role": "user",
                    "content": userMessage
                }
            ]
        }
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${endpoint}/openai/threads/runs?api-version=${apiVersion}`,
        headers: {
            'Content-Type': 'application/json',
            'api-key': azureApiKey
        },
        data: data
    };

    try {
        const { data } = await axios(config);
        console.log("Thread ID: ", data.thread_id);
        console.log("Run ID: ", data.id);
        console.log("Run Status: ", data.status);
        return data;
    }
    catch (error) {
        console.error("An error occurred:", error.response ? error.response.data : error.message);
        return null;
    }
}

const createThread = async (userMessage) => {
    let data = JSON.stringify({
        "messages": [
          {
            "role": "user",
            "content": userMessage
          }
        ]
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${endpoint}/openai/threads?api-version=${apiVersion}`,
        headers: { 
          'Content-Type': 'application/json', 
          'api-key': azureApiKey
        },
        data : data
      };

    try {
        const { data } = await axios(config);
        return data;
    } catch (error) {
        console.error("An error occurred:", error.response ? error.response.data : error.message);
    }
}

const addMessageToThread = async (threadId, userMessage) => {
    let data = JSON.stringify({
        "role": "user",
        "content": userMessage
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${endpoint}/openai/threads/${threadId}/messages?api-version=${apiVersion}`,
        headers: { 
          'Content-Type': 'application/json', 
          'api-key': azureApiKey
        },
        data : data
      };

    try {
        const { data } = await axios(config);
        return data;
    } catch (error) {
        console.error("An error occurred:", error.response ? error.response.data : error.message);
    }
}

const createRun = async (assistantId, threadId) => {
    let data = JSON.stringify({
        "assistant_id": assistantId,
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${endpoint}/openai/threads/${threadId}/runs?api-version=${apiVersion}`,
        headers: { 
          'Content-Type': 'application/json', 
          'api-key': azureApiKey
        },
        data : data
      };

    try {
        const { data } = await axios(config);
        return data;
    } catch (error) {
        console.error("An error occurred:", error.response ? error.response.data : error.message);
    }
}


const listMessages = async (threadId) => {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${endpoint}/openai/threads/${threadId}/messages?api-version=${apiVersion}`,
        headers: {
            'api-key': azureApiKey
        }
    };

    try {
        const { data } = await axios(config);
        return data;
    }
    catch (error) {
        console.error("An error occurred:", error.response ? error.response.data : error.message);
    }
}

const getRun = async (threadId, runId) => {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${endpoint}/openai/threads/${threadId}/runs/${runId}?api-version=${apiVersion}`,
        headers: {
            'api-key': azureApiKey
        }
    };

    try {
        const { data } = await axios(config);
        return data;
    } catch (error) {
        console.error("An error occurred:", error.response ? error.response.data : error.message);
    }
}

const submitToolOutputsToRun = async (threadId, runId, toolOutputs) => {

    for (const toolOutput of toolOutputs) {
        console.log("Tool Output: ", toolOutput.output);
    }

    let data = JSON.stringify({
        "tool_outputs": toolOutputs
      });
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${endpoint}/openai/threads/${threadId}/runs/${runId}/submit_tool_outputs?api-version=${apiVersion}`,
        headers: { 
          'api-key': azureApiKey, 
          'Content-Type': 'application/json'
        },
        data : data
      };

    try {
        const { data } = await axios(config);
        return data;
    } catch (error) {
        console.error("An error occurred:", error.response ? error.response.data : error.message);
    }
}

module.exports ={ 
    createThreadAndRun, 
    addMessageToThread,
    createRun,
    listMessages, 
    getRun, 
    submitToolOutputsToRun 
};