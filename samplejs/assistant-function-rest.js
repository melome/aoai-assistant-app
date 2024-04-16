import axios from 'axios';
import 'dotenv/config';
import {
    getFavoriteCity,
    getCityNickname,
    getWeatherAtLocation,
} from './functions.js';



// Azure OPEN AI Credentials
const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
const azureApiKey = process.env["AZURE_OPENAI_API_KEY"];
const apiVersion = "2024-02-15-preview";

// Azure OPEN AI Model
const model = "gpt-35-turbo";
// Azure OPEN AI Assistant
const assistantId = "asst_fRiGSuHQxjFh3Ooy5BtAoqgb"

// Azure OPEN AI Axios
const createThreadAndRun = async (question) => {
    let data = JSON.stringify({
        "assistant_id": assistantId,
        "thread": {
            "messages": [
                {
                    "role": "user",
                    "content": question
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

const getResolvedToolOutput = (toolCall) => {

    console.log("Tool Call Type: ", toolCall.type);
    console.log("Tool Call Function: ", toolCall["function"].name);
    console.log("Tool Call Arguments: ", toolCall["function"].arguments);

    const toolOutput = { tool_call_id: toolCall.id, output: "" };
    if (toolCall["function"]) {
        const functionCall = toolCall["function"];
        const functionName = functionCall.name;
        const functionArgs = JSON.parse(functionCall["arguments"] ?? {});
        switch (functionName) {
            case "getUserFavoriteCity":
                toolOutput.output = getFavoriteCity();
                break;
            case "getCityNickname":
                toolOutput.output = getCityNickname(functionArgs["city"]);
                break;
            case "getWeatherAtLocation":
                toolOutput.output = getWeatherAtLocation(
                    functionArgs.location,
                    functionArgs.temperatureUnit,
                );
                break;
            default:
                toolOutput.output = `Unknown function: ${functionName}`;
                break;
        }
    }

    return toolOutput;
};

const main = async () => {
    console.log("== Azure OPEN AI Axios ==");

    const question = "What's the weather like right now in my favorite city?";

    // Create Thread and Run
    let runResponse = await createThreadAndRun(question);

   
    // Get Thread ID and Run ID
    const threadId = runResponse.thread_id;
    const runId = runResponse.id;


    do {
        await new Promise((resolve) => setTimeout(resolve, 800));
        
        // Get Run Status
        runResponse = await getRun(threadId, runId);
        console.log("Run Status: ", runResponse.status);

        
        if (runResponse.status === "requires_action" && runResponse.required_action?.type === "submit_tool_outputs") {
            console.log("Submitting tool outputs...");
            const toolOutputs = [];

            if (runResponse.required_action?.submit_tool_outputs?.tool_calls) {
                for (const toolCall of runResponse.required_action?.submit_tool_outputs.tool_calls) {
                    toolOutputs.push(getResolvedToolOutput(toolCall));
                }
                runResponse = await submitToolOutputsToRun(
                    threadId,
                    runResponse.id,
                    toolOutputs,
                );
            }
        }

    } while (runResponse.status === "queued" || runResponse.status === "in_progress")

    const runMessages = await listMessages(threadId);

    for (let i = runMessages.data.length - 1; i >= 0; i--) {
        const runMessageDatum = runMessages.data[i]
        for (const item of runMessageDatum.content) {
            if (item.type === "text") {
                console.log(`${runMessageDatum.role}: ${item.text?.value}`);
            } else if (item.type === "image_file") {
                console.log(`Assistant message file id: ${item.imageFile?.fileId}`);
            }
        }
    }

}

main().catch(console.error);

export default { main };