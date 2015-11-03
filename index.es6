import Dthree from 'd3';
import React from 'react';

export default class SilverSeriesBar extends React.Component {

  // PROP TYPES
  static get propTypes() {
    return {
      test: React.PropTypes.string,
      config: React.PropTypes.object,
      passBarClick: React.PropTypes.func,

    };
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

  // ======= D3 stuff =======
  // Note that I'm using 'ddd' and 'iii' to get round
  // eslint id-length issue

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
        .attr('y', (ddd) => yScale(ddd.category))
        .attr('x', 0)
        .attr('height', yScale.rangeBand())
        .attr('width', 0)
        .on('click', (ddd, iii) => this.barClick(ddd, iii))
        ;

    barBinding
      .transition().duration(duration)
        .attr('width', (ddd) => xScale(ddd.value))
        .attr('x', 0)
        .attr('y', (ddd) => yScale(ddd.category))
        .attr('height', yScale.rangeBand())
        ;

    barBinding.exit()
      .transition().duration(duration)
      .attr('width', 0)
        .remove();
  }
  // UPDATE BARS ends

  // ===== D3 stuff ends =====

  // RENDER
  render() {
    // Axis group
    return (
      <g className="d3-bar-series-group" ref="barSeriesGroup"/>
    );
  }
}
