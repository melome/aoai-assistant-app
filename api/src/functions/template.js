const { app } = require('@azure/functions');

app.http('helloworld', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const { name } = JSON.parse(await request.text())

        // const name = request.query.get('name') || await request.text() || 'world';

        return { 
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: `Hello, ${name || 'world'}!` }, null, 2)
        };
    }
});
