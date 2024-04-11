import axios from 'axios';
import 'dotenv/config';

const chatCompletion = async () => {
  console.log("== Chat Completions Axios ==");
  const endpoint = process.env["AZURE_OPENAI_ENDPOINT"];
  const azureApiKey = process.env["AZURE_OPENAI_API_KEY"];

  if (!endpoint || !azureApiKey) {
    console.error("Endpoint or API key is not defined. Check your environment variables.");
    return;
  }

  const messages = [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Does Azure OpenAI support customer managed keys?" },
    { role: "assistant", content: "Yes, customer managed keys are supported by Azure OpenAI" },
    { role: "user", content: "Do other Azure AI services support this too" },
  ];

  let data = JSON.stringify({
    "messages": messages,
    "max_tokens": 800,
    "temperature": 0.7,
    "frequency_penalty": 0,
    "presence_penalty": 0,
    "top_p": 0.95,
    "stop": null
  });

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: `${endpoint}/openai/deployments/text-gen/chat/completions?api-version=2024-02-15-preview`,
    headers: {
      'Content-Type': 'application/json',
      'api-key': azureApiKey
    },
    data: data
  };

  try {
    const { data } = await axios(config);
    // console.log(data);
    for (const choice of data.choices) {
      console.log(choice.message);
    }
  } catch (error) {
    console.error("An error occurred:", error.response ? error.response.data : error.message);
  }
}

// Call the function and catch any unhandled promise rejection
chatCompletion().catch(console.error);