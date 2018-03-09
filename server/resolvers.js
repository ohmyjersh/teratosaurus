import { PubSub } from 'graphql-subscriptions';
import { withFilter } from 'graphql-subscriptions';
import { v4 } from "uuid"
import {schema} from './schema';
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

const pubsub = new PubSub();

export const resolvers = {
    Query: { Graph: () =>  graph },
    Mutation: {
      addNode: (root, args) => {
        const newNode = { id: v4(), title: args.title, x: args.x, y: args.y, type:args.type };
        nodes.push(newNode);
        pubsub.publish('nodeAdded', { nodeAdded: newNode});
        return newNode;
      },
      addEdge:(root, args) => {
        const newEdge = { source: args.source, target: args.target, type: args.type };
        edges.push(newEdge);
        pubsub.publish('edgeAdded', {edgeAdded: newEdge});
        return newEdge;
      }
    },
    Subscription: {
      nodeAdded : {
        //test it ! @url http://dev.apollodata.com/tools/graphql-subscriptions/subscriptions-to-schema.html#subscription-server
        // resolve: (payload) => {
        // 	console.log('payload', payload)
        // 	return payload
        // },
        subscribe: withFilter(() => pubsub.asyncIterator('nodeAdded'), (payload, args) => {
            // @todo unit test needs for differents inputs
            // if (args.filter && _.isString(args.filter) && args.filter !== '' && payload.notified && _.isString(payload.notified.model)) {
            //     return payload.notified.model === args.filter;
            // }
            return true;
        }),
    },
    edgeAdded : {
        //test it ! @url http://dev.apollodata.com/tools/graphql-subscriptions/subscriptions-to-schema.html#subscription-server
        resolve: (payload) => {
        	console.log('payload', payload)
        	return {
        		notify: payload,
        	};
        },
        subscribe: withFilter(() => pubsub.asyncIterator('edgeAdded'), (payload, args) => {
            // @todo unit test needs for differents inputs
            // if (args.filter && _.isString(args.filter) && args.filter !== '' && payload.notified && _.isString(payload.notified.model)) {
            //     return payload.notified.model === args.filter;
            // }
            return true;
        }),
    },
    }
  };
