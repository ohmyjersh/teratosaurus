const express = require('express');
const uuidv4 = require('uuid/v4');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const Subscription = require('graphql-subscriptions');
const { makeExecutableSchema } = require('graphql-tools');
const { execute, subscribe } = require('graphql');
const { createServer } = require('http')
const { SubscriptionServer } = require('subscriptions-transport-ws');
import { schema } from './schema';

// Initialize the app
const app = express();

// Wrap the Express server
const ws = createServer(app);
ws.listen(4006, () => {
  console.log(`GraphQL Server is now running on http://localhost:4006`);
  // Set up the WebSocket for handling GraphQL subscriptions
  new SubscriptionServer({
    execute,
    subscribe,
    schema
  }, {
    server: ws,
    path: '/subscriptions',
  });
});

// The GraphQL endpoint
app.use('/graphql',(req,res,next)=>{
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Headers', 'content-type, authorization, content-length, x-requested-with, accept, origin');
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.header('Allow', 'POST, GET, OPTIONS')
    res.header('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
 }, bodyParser.json(), graphqlExpress({ schema }));

// GraphiQL, a visual editor for queries
app.use('/graphiql', graphiqlExpress({ 
  endpointURL: '/graphql', 
  subscriptionsEndpoint: `ws://localhost:4006/subscriptions`
}));