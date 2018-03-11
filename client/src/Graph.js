import React, { Component } from 'react';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import GraphView from 'react-digraph';
import GraphConfig from './graph-config.js' // Configures node/edge types
import { GraphConstants } from './graphConstants';
const { NODE_KEY, EMPTY_TYPE, SPECIAL_TYPE, SPECIAL_CHILD_SUBTYPE, EMPTY_EDGE_TYPE, SPECIAL_EDGE_TYPE } = GraphConstants;
const styles = {
  graph: {
    height: '100vh',
    width: '100%'
  }
};

class Graph extends Component {

  constructor(props) {
    super(props);
    this.state = {
      graph: props.graph,
      selected: {}
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({graph:nextProps.graph, selected:{}});
  }

  // Helper to find the index of a given node
  getNodeIndex(searchNode) {
    return this.state.graph.nodes.findIndex((node) => {
      return node[NODE_KEY] === searchNode[NODE_KEY]
    })
  }

  // Helper to find the index of a given edge
  getEdgeIndex(searchEdge) {
    return this.state.graph.edges.findIndex((edge) => {
      return edge.source === searchEdge.source &&
        edge.target === searchEdge.target
    })
  }

  // Given a nodeKey, return the corresponding node
  getViewNode = nodeKey => {
    const searchNode = {};
    searchNode[NODE_KEY] = nodeKey;
    const i = this.getNodeIndex(searchNode);
    return this.state.graph.nodes[i]
  }

  /*
   * Handlers/Interaction
   */

  // Called by 'drag' handler, etc..
  // to sync updates from D3 with the graph
  onUpdateNode = viewNode => {
    const graph = this.state.graph;
    const i = this.getNodeIndex(viewNode);

    graph.nodes[i] = viewNode;
    this.setState({ graph: graph });
  }

  // Node 'mouseUp' handler
  onSelectNode = viewNode => {
    // Deselect events will send Null viewNode
    if (!!viewNode) {
      this.setState({ selected: viewNode });
    } else {
      this.setState({ selected: {} });
    }
  }

  // Edge 'mouseUp' handler
  onSelectEdge = viewEdge => {
    this.setState({ selected: viewEdge });
  }

  // Updates the graph with a new node
  onCreateNode = (x, y) => {
    const graph = this.state.graph;

    // This is just an example - any sort of logic
    // could be used here to determine node type
    // There is also support for subtypes. (see 'sample' above)
    // The subtype geometry will underlay the 'type' geometry for a node
    const type = Math.random() < 0.25 ? SPECIAL_TYPE : EMPTY_TYPE;

    const viewNode = {
      title: 'new Nodes',
      type: type,
      x: x,
      y: y
    }

    this.props.addNode({
      variables: viewNode
    })
      .then(res => {
        console.log(res);
      });
    // graph.nodes.push(viewNode);
    // this.setState({ graph: graph });
  }


  // Deletes a node from the graph
  onDeleteNode = viewNode => {
    const graph = this.state.graph;
    const i = this.getNodeIndex(viewNode);
    graph.nodes.splice(i, 1);

    // Delete any connected edges
    const newEdges = graph.edges.filter((edge, i) => {
      return edge.source != viewNode[NODE_KEY] &&
        edge.target != viewNode[NODE_KEY]
    })

    graph.edges = newEdges;

    this.setState({ graph: graph, selected: {} });
  }

  // Creates a new node between two edges
  onCreateEdge = (sourceViewNode, targetViewNode) => {
    const graph = this.state.graph;

    // This is just an example - any sort of logic
    // could be used here to determine edge type
    const type = sourceViewNode.type === SPECIAL_TYPE ? SPECIAL_EDGE_TYPE : EMPTY_EDGE_TYPE;

    const viewEdge = {
      source: sourceViewNode[NODE_KEY],
      target: targetViewNode[NODE_KEY],
      type: type
    }

    // Only add the edge when the source node is not the same as the target
    if (viewEdge.source !== viewEdge.target) {

      this.props.addEdge({
        variables: viewEdge
      })
        .then(res => {
          console.log(res);
        });

      graph.edges.push(viewEdge);
      this.setState({ graph: graph });
    }
  }

  // Called when an edge is reattached to a different target.
  onSwapEdge = (sourceViewNode, targetViewNode, viewEdge) => {
    const graph = this.state.graph;
    const i = this.getEdgeIndex(viewEdge);
    const edge = JSON.parse(JSON.stringify(graph.edges[i]));

    edge.source = sourceViewNode[NODE_KEY];
    edge.target = targetViewNode[NODE_KEY];
    graph.edges[i] = edge;

    this.setState({ graph: graph });
  }

  // Called when an edge is deleted
  onDeleteEdge = viewEdge => {
    const graph = this.state.graph;
    const i = this.getEdgeIndex(viewEdge);
    graph.edges.splice(i, 1);
    this.setState({ graph: graph, selected: {} });
  }

  /*
   * Render
   */

  render() {
    const nodes = this.state.graph.nodes;
    const edges = this.state.graph.edges;
    const selected = this.state.selected;

    const NodeTypes = GraphConfig.NodeTypes;
    const NodeSubtypes = GraphConfig.NodeSubtypes;
    const EdgeTypes = GraphConfig.EdgeTypes;

    return (
      <div id='graph' style={styles.graph}>

        <GraphView
          ref={(el) => this.GraphView = el}
          nodeKey={NODE_KEY}
          emptyType={EMPTY_TYPE}
          nodes={nodes}
          edges={edges}
          selected={selected}
          nodeTypes={NodeTypes}
          nodeSubtypes={NodeSubtypes}
          edgeTypes={EdgeTypes}
          enableFocus={true}
          getViewNode={this.getViewNode}
          onSelectNode={this.onSelectNode}
          onCreateNode={this.onCreateNode}
          onUpdateNode={this.onUpdateNode}
          onDeleteNode={this.onDeleteNode}
          onSelectEdge={this.onSelectEdge}
          onCreateEdge={this.onCreateEdge}
          onSwapEdge={this.onSwapEdge}
          onDeleteEdge={this.onDeleteEdge} />
      </div>
    );
  }
}

const addNode = gql`
  mutation addNode($title: String!, $x: Float, $y: Float, $type: String) {
    addNode(title:$title, x:$x, y:$y, type:$type) {
      id
      x
      y
      title
      type
    }
  }
`;

const addEdge = gql`
  mutation addEdge($source: String!, $target: String, $type: String) {
    addEdge(source: $source, target: $target, type: $type) {
      source
      target
      type
    }
  }
`;


const GraphWithMutations = compose(
  graphql(addNode, {
    name: 'addNode'
  }),
  graphql(addEdge, {
    name: 'addEdge'
  })
)(Graph)

export default GraphWithMutations;

