import Dthree from 'd3';
import React from 'react';

export default class SilverSeriesBars extends React.Component {

  // PROP TYPES
  static get propTypes() {
    return {
      test: React.PropTypes.string,
      config: React.PropTypes.object,
      passBarClick: React.PropTypes.func,

    };
  }

  // DEFAULT PROPS
  static get defaultProps() {
    return {};
  }

  // CONSTRUCTOR
  constructor(props) {
    super(props);
    this.state = {};
  }

  // COMPONENT DID MOUNT
  componentDidMount() {
    this.updateBars();
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    this.updateBars();
  }

  // ======= Event handler ======

  // BAR CLICK
  // Handles bar click event. Params are data (cat and value)
  // and index in overall data
  barClick(data, index) {
    const clickObj = { data, index };
    this.props.passBarClick(clickObj);
  }

  // ======= Dthree stuff =======

  // UPDATE BARS
  updateBars() {
    const config = this.props.config;
    // Context and duration
    // (In the long term, we'd need more than one group...)
    const barGroup = Dthree.select('.d3-bar-series-group');
    const duration = config.duration;

    // Passed scales:
    const xScale = config.xScale;
    const yScale = config.yScale;

    // Data
    const data = config.data;
    // Bind data
    const barBinding = barGroup.selectAll('rect')
      .data(data);
    // Not used:
    // const height = config.bounds.height;
    // ENTER
    // const yDomain = yData.data.map(d => d.category)
    // Width is zero by default when new rects are created
    barBinding
      .enter().append('rect')
      // .transition().duration(duration)
        .attr('class', 'd3-bar-rect')
        .attr('y', (d) => yScale(d.category))
        .attr('x', 0)
        .attr('height', yScale.rangeBand())
        .attr('width', 0)
        .on('click', (d, i) => this.barClick(d, i))
        ;

    barBinding
      .transition().duration(duration)
        .attr('width', (d) => xScale(d.value))
        .attr('x', 0)
        .attr('y', (d) => yScale(d.category))
        .attr('height', yScale.rangeBand())
        ;

    barBinding.exit()
      .transition().duration(duration)
      .attr('width', 0)
        .remove();
  }
  // UPDATE BARS ends

  // ===== Dthree stuff ends =====

  // RENDER
  render() {
    // Axis group
    return (
      <g className="d3-bar-series-group" ref="barSeriesGroup"/>
    );
  }
}
