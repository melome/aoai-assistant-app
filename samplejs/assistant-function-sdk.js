// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Demonstrates how to use the AOAI assistants API with local function calls.
 *
 *
 * @summary assistants code.
 */



// Load the .env file if it exists
import 'dotenv/config';

import { AssistantsClient, AzureKeyCredential } from "@azure/openai-assistants";


const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
const apiKey = process.env["AZURE_OPENAI_API_KEY"];
const model = "gpt-4";




async function main() {
  console.log("== Function Assistant Sample ==");
  const assistantsClient = new AssistantsClient(endpoint, new AzureKeyCredential(apiKey));

  // function tools sample code
  const getFavoriteCity = () => "Atlanta, GA";
  const getUserFavoriteCityTool = {
    type: "function",
    function: {
      name: "getUserFavoriteCity",
      description: "Gets the user's favorite city.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  };

  const getCityNickname = (city) => {
    switch (city) {
      case "Atlanta, GA":
        return "The ATL";
      case "Seattle, WA":
        return "The Emerald City";
      case "Los Angeles, CA":
        return "LA";
      default:
        return "Unknown";
    }
  };

  const getCityNicknameTool = {
    type: "function",
    function: {
      name: "getCityNickname",
      description: "Gets the nickname for a city, e.g. 'LA' for 'Los Angeles, CA'.",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
        },
      },
    },
  };

  const getWeatherAtLocation = (location, temperatureUnit = "f") => {
    switch (location) {
      case "Atlanta, GA":
        return temperatureUnit === "f" ? "84f" : "26c";
      case "Seattle, WA":
        return temperatureUnit === "f" ? "70f" : "21c";
      case "Los Angeles, CA":
        return temperatureUnit === "f" ? "90f" : "28c";
      default:
        return "Unknown";
    }
  };

  const getWeatherAtLocationTool = {
    type: "function",
    function: {
      name: "getWeatherAtLocation",
      description: "Gets the current weather at a provided location.",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The city and state, e.g. San Francisco, CA",
          },
          temperatureUnit: {
            type: "string",
            enum: ["f", "c"],
          },
        },
        required: ["location"],
      },
    },
  };

  const weatherAssistant = await assistantsClient.createAssistant({
    model: model,
    name: "JS SDK Test Assistant - Weather",
    instructions: `You are a weather bot. Use the provided functions to help answer questions.
        Customize your responses to the user's preferences as much as possible and use friendly
        nicknames for cities whenever possible.
    `,
    tools: [getUserFavoriteCityTool, getCityNicknameTool, getWeatherAtLocationTool],
  });

  console.log(`Assistant ID: ${weatherAssistant.id}`);

  const getResolvedToolOutput = (toolCall) => {
    const toolOutput = { toolCallId: toolCall.id, output: "" };
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

  const question = "What's the weather like right now in my favorite city?";


  let runResponse = await assistantsClient.createThreadAndRun({
    assistantId: weatherAssistant.id,
    thread: { messages: [{ role: "user", content: question }] },
    tools: [getUserFavoriteCityTool, getCityNicknameTool, getWeatherAtLocationTool],
  });



  const threadId = runResponse.threadId;

  console.log(`Thread ID: ${threadId}`);
  console.log(`Run ID: ${runResponse.id}`);

  do {
    await new Promise((resolve) => setTimeout(resolve, 800));
    runResponse = await assistantsClient.getRun(threadId, runResponse.id);
    console.log(`Run status: ${runResponse.status}`);

    if (runResponse.status === "requires_action" && runResponse.requiredAction?.type === "submit_tool_outputs") {
      console.log("Submitting tool outputs...");
      const toolOutputs = [];

      if (runResponse.requiredAction?.submitToolOutputs?.toolCalls) {
        for (const toolCall of runResponse.requiredAction?.submitToolOutputs.toolCalls) {
          toolOutputs.push(getResolvedToolOutput(toolCall));
        }
        runResponse = await assistantsClient.submitToolOutputsToRun(
          threadId,
          runResponse.id,
          toolOutputs,
        );
      }
    }
  } while (runResponse.status === "queued" || runResponse.status === "in_progress");

  console.log(`Run status: ${runResponse.status}`);

  // runResponse = await assistantsClient.createRun(threadId, {
  //   assistantId: weatherAssistant.id
  // });

  const runMessages = await assistantsClient.listMessages(threadId);
  
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

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});

export default { main };