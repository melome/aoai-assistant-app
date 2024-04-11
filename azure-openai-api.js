import { AssistantsClient, AzureKeyCredential } from "@azure/openai-assistants";
import 'dotenv/config';

const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
const azureApiKey = process.env["AZURE_OPENAI_API_KEY"];

const assistantsClient = new AssistantsClient(endpoint, new AzureKeyCredential(azureApiKey));


const assistantThread = await assistantsClient.createThread();

console.log(assistantThread);