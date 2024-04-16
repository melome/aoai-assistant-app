import { AssistantsClient, AzureKeyCredential } from "@azure/openai-assistants";
import 'dotenv/config';

const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
const apiKey = process.env["AZURE_OPENAI_API_KEY"];
const model = "gpt-4";

const assistantsClient = new AssistantsClient(endpoint, new AzureKeyCredential(apiKey));

const main = async () => {
    const assistant = await assistantsClient.createAssistant({
        model: model,
        name: "JS Math Tutor",
        instructions: "You are a personal math tutor. Write and run code to answer math questions.",
        tools: [{ type: "code_interpreter" }]
    });

    console.log("assistantId:", assistant.id);

    const assistantThread = await assistantsClient.createThread();

    console.log("assistantThreadId:", assistantThread.id);

    const question = "I need to solve the equation '3x + 11 = 14'. Can you help me?";
    const messageResponse = await assistantsClient.createMessage(assistantThread.id, "user", question);

    console.log("messageId:", messageResponse.id);

    let runResponse = await assistantsClient.createRun(assistantThread.id, {
        assistantId: assistant.id
    });

    console.log("runId:", runResponse.id);

    do {
        await new Promise((resolve) => setTimeout(resolve, 800));
        runResponse = await assistantsClient.getRun(assistantThread.id, runResponse.id);
        console.log("runStatus:", runResponse.status)
        // console.log("runResponse:", JSON.stringify(runResponse, null, 2));
    } while (runResponse.status === "queued" || runResponse.status === "in_progress")

    const runMessages = await assistantsClient.listMessages(assistantThread.id);

    // console.log("runMessages:", JSON.stringify(runMessages, null, 2));
    for (const runMessageDatum of runMessages.data) {
        for (const item of runMessageDatum.content) {
            if (item.type === "text") {
                console.log(item.text.value);
            } else if (item.type === "image_file") {
                console.log(item.imageFile.fileId);
            }
        }
    }
}

main().catch((err) => {
    console.error("The sample encountered an error:", err);
});

export default { main };