const express = require('express');
const uuidv4 = require('uuid/v4');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const Subscription = require('graphql-subscriptions');
const { makeExecutableSchema } = require('graphql-tools');
const { execute, subscribe } = require('graphql');
const { createServer } = require('http')
const { SubscriptionServer } = require('subscriptions-transport-ws');

const pubsub = new Subscription.PubSub();

const EMPTY_TYPE = "empty"; // Empty node type
const SPECIAL_TYPE = "special";
const SPECIAL_CHILD_SUBTYPE = "specialChild";
const EMPTY_EDGE_TYPE = "emptyEdge";
const SPECIAL_EDGE_TYPE = "specialEdge";


const edges = [
    {
        "source": "1234",
        "target": 4,
        "type": SPECIAL_EDGE_TYPE
      },
      {
        "source": 1,
        "target": 4,
        "type": EMPTY_EDGE_TYPE
      }
  ];

const nodes = [
    {
        "id": 1,
        "title": "Node A",
        "x": 258.3976135253906,
        "y": 331.9783248901367,
        "type": SPECIAL_TYPE
      },
      {
        "id": "1234",
        "title": "Node B",
        "x": 593.9393920898438,
        "y": 260.6060791015625,
        "type": EMPTY_TYPE,
        "subtype": SPECIAL_CHILD_SUBTYPE
      },
      {
        "id": 3,
        "title": "Node C",
        "x": 237.5757598876953,
        "y": 61.81818389892578,
        "type": EMPTY_TYPE
      },
      {
        "id": 4,
        "title": "Node C",
        "x": 600.5757598876953,
        "y": 600.81818389892578,
        "type": EMPTY_TYPE
      }
  ];
const graph = {
    nodes,
    edges
};

// The GraphQL schema in string form
const typeDefs = `
  type Query { Graph: Graph }
  type Mutation { 
     addNode(title: String, x: Float, y: Float, type: String) : Node
     addEdge(source: String, target: String, type: String) : Edge
  }
  type Subscription {
    nodeAdded : Node
    edgeAdded(source: String, target: String, type: String) : Edge
  }
  type Graph { nodes: [Node], edges: [Edge] }
  type Node { id: String, title: String, x: Float, y: Float, type: String }
  type Edge { source: String, target: String, type: String }
`;

// The resolvers
const resolvers = {
  Query: { Graph: () =>  graph },
  Mutation: {
    addNode: (root, args) => {
      const newNode = { id: uuidv4(), title: args.title, x: args.x, y: args.y, type:args.type };
      nodes.push(newNode);
      pubsub.publish('nodeAdded', { nodeAdded: newNode});
      return newNode;
    },
    addEdge:(root, args) => {
      const newEdge = { source: args.source, target: args.target, type: args.type };
      edges.push(newEdge);
      return newEdge;
    }
  },
  Subscription: {
    nodeAdded: {
      resolve: (payload) => {
        console.log('resolve');
        return {
          node: payload,
        };
      },
      subscribe: () => pubsub.asyncIterator('nodeAdded')
    },
    edgeAdded: {

    }
  }
};

// Put together a schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

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
  subscriptionsEndpoint: `ws://localhost:4000/subscriptions`
}));