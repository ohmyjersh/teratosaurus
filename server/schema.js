import { makeExecutableSchema } from 'graphql-tools';

import { resolvers } from './resolvers';

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

const schema = makeExecutableSchema({ typeDefs, resolvers });
export { schema };