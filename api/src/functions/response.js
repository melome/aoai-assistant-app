const { app } = require('@azure/functions');

const  { 
    createThreadAndRun, 
    addMessageToThread,
    createRun,
    listMessages, 
    getRun, 
    submitToolOutputsToRun 
} = require('./utils/azureOpenAI');

const {
    getFavoriteCity,
    getCityNickname,
    getWeatherAtLocation
} = require('./utils/weatherFunctions');


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

const generateResponse = async (q) => {
    const assistant_id = 'asst_fRiGSuHQxjFh3Ooy5BtAoqgb';

    // Create Thread and Run
    let runResponse = await createThreadAndRun(assistant_id, q);

    // Get Thread ID and Run ID
    const threadId = runResponse.thread_id;
    const runId = runResponse.id;

    // Poll Run Status
    do {
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Get Run Status
        runResponse = await getRun(threadId, runId);
        console.log("Run Status: ", runResponse.status);


        // Check if run requires action
        if (runResponse.status === "requires_action" && runResponse.required_action?.type === "submit_tool_outputs") {
            console.log("Submitting tool outputs...");
            const toolOutputs = [];
            // Get Resolved Tool Output
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
        // Check if run is queued or in progress
    } while (runResponse.status === "queued" || runResponse.status === "in_progress")

    // List Messages
    const runMessages = await listMessages(threadId);

    // Log Messages
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

    // Return Messages
    return runMessages.data;
}


const existingThreadResponse = async (threadId, q) => {
    const assistant_id = 'asst_fRiGSuHQxjFh3Ooy5BtAoqgb';

    // Create Thread and Run
    let threadResponse = await addMessageToThread(threadId, q);
    let runResponse = await createRun(assistant_id, threadId);

    // Get Thread ID and Run ID
    const runId = runResponse.id;

    // Poll Run Status
    do {
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Get Run Status
        runResponse = await getRun(threadId, runId);
        console.log("Run Status: ", runResponse.status);


        // Check if run requires action
        if (runResponse.status === "requires_action" && runResponse.required_action?.type === "submit_tool_outputs") {
            console.log("Submitting tool outputs...");
            const toolOutputs = [];
            // Get Resolved Tool Output
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
        // Check if run is queued or in progress
    } while (runResponse.status === "queued" || runResponse.status === "in_progress")

    // List Messages
    const runMessages = await listMessages(threadId);

    // Log Messages
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

    // Return Messages
    return runMessages.data;
}


app.http('messages', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
        
        const { query } = JSON.parse(await request.text());
        const threadId = request.query.get('threadId') || '';

        context.log(`threadId: ${threadId}`);
        context.log(`query: ${query}`);


        // Check body for query
        if (!query) {
            return { 
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: 'query is required' }, null, 2)
            };
        }

        try {
            if (threadId) {
                const response = await existingThreadResponse(threadId, query);
                return { 
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: response
                    }, null, 2)
                };
            } else {
                const response = await generateResponse(query);
                return { 
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: response
                    }, null, 2)
                };
            }
        } catch (error) {
            context.log(`Error: ${error}`);
            return { 
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ error: error.message }, null, 2)
            };            
        }
    }
});
