import React, { Component } from 'react';
import Graph from './Graph';
import { withApollo, graphql, compose } from 'react-apollo'
import gql from 'graphql-tag'
import { Query } from 'react-apollo';
import './App.css';

class App extends Component {
  componentDidMount() {
    this.props.subscribeToNewNodes();
}
  render() {
    console.log(this.props);
    const { loading, error }  = this.props.graph;
    if(loading) {
      return (
        <div>
            Loading...
        </div>
      )
    }
    let nodes = this.props.graph.Graph.nodes.map(x => ({id:x.id, title:x.title, x:x.x, y:x.y, type:x.type }));
    let edges = this.props.graph.Graph.edges.map(x => ({source:x.source, target:x.target, type:x.type}));
    let graph = {nodes, edges};
    return (
      <div className="App">
        <Graph graph={graph} />
      </div>
    );
  }
}


const GET_GRAPH = gql`
query {
  Graph {
    edges {
      source
      target
      type
    },
    nodes {
      id,
      x,
      y,
      type,
      title,
    }
  }
}`

const nodeAddedSubscription = gql`
  subscription {
    nodeAdded {
      id,
      x,
      y,
      type,
      title
    }
}`

const withData = graphql(GET_GRAPH, {
    name: 'graph',
    props: props => {
        return {
           ...props,
            subscribeToNewNodes: params => {
                return props.graph.subscribeToMore({
                  document: nodeAddedSubscription,
                    updateQuery: (prev, {subscriptionData}) => {
                        if (!subscriptionData.data) {
                            return prev;
                        }

                        const newNode = subscriptionData.data.nodeAdded;
                        const nodes = prev.Graph.nodes.concat(newNode);
                        const newNodes = Object.assign({}, prev, {
                             Graph: {
                                 nodes: nodes,
                                 edges: prev.Graph.edges
                             }
                         });
                        console.log(newNodes);
                        return newNodes;
                    }
                });
            },
            subscribeToNewEdges: params => {

            }
        };
    },
});

export default withData(App);