import React, { Component } from 'react';
import Graph from './Graph';
import { gql } from 'apollo-boost';
import { Query } from 'react-apollo';
import './App.css';

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

class App extends Component {
  render() {
    return (
      <div className="App">
        <Query query={GET_GRAPH}>
          {({ loading, error, data }) => {
            if (loading) return <div>Loading...</div>;
            if (error) return <div>Error :(</div>;
            // dirty hack to get around the frozen objects/arrays will fix later
            let nodes = data.Graph.nodes.map(x => ({id:x.id, title:x.title, x:x.x, y:x.y, type:x.type }));
            let edges = data.Graph.edges.map(x => ({source:x.source, target:x.target, type:x.type}));
            let graph = {nodes, edges};
            return (
              <Graph graph={graph} />
            )
          }}
        </Query>
      </div>
    );
  }
}

export default App;
