const { app } = require('@azure/functions');

const { listMessages } = require('./utils/azureOpenAI');

app.http('conversation', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const threadId = request.query.get('threadId') || '';
        context.log(`threadId: ${threadId}`);

        try {
            const messages = await listMessages(threadId);
            return { 
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messages.data
                }, null, 2)
            };            
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
