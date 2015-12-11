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
    this.updateZeroLine();
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    this.updateBars();
    this.updateZeroLine();
  }

  // ======= Event handler ======

  // BAR CLICK
  // Handles bar click event. Params are data (cat and value)
  // and index in overall data
  barClick(data, index) {
    const clickObj = { data, index };
    this.props.passBarClick(clickObj);
  }

  // GET COLOURS
  // Called from updateBars to map colours by series
  getColours(headers, colourSet) {
    // Lose first element (col 1 header)
    const gcHeaders = headers.slice(1);
    // Colours from config file
    // const colourSet = [ '#004D64', '#6995A8', '#009FD8', '#ACADB0' ];
    const colourScale = Dthree.scale.ordinal()
      .domain(gcHeaders)
      .range(colourSet);
    return colourScale;
  }
  // GET COLOURS ends

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
    const headers = config.headers;
    const catHead = headers[0];
    const colourSet = config.colourSet;
    const colours = this.getColours(headers, colourSet);
    // Map data:
    const mappedData = colours.domain().map(
      (name) => {
        return {
          name,
          series: data.map(
            (ddd) => {
              return { category: ddd[catHead], value: Number(ddd[name]), header: name };
            }),
        };
      });

    // Bind data
    const barBinding = barGroup.selectAll('rect')
      // .data(data);
      // ***    STILL THINGS TO DO HERE WITH MULTIPLE SERIES...    ***
      // *** Currently using first series only, no matter how many ***
      .data(mappedData[0].series);
    // Not used:
    // const height = config.bounds.height;
    // ENTER
    // const yDomain = yData.data.map(d => d.category)
    // Width is zero by default when new rects are created
    barBinding
      .enter().append('rect')
        .attr({
          'class': 'd3-bar-rect',
          'y': (ddd) => yScale(ddd.category),
          'height': yScale.rangeBand(),
          'x': 0,
          'width': 0,
        })
        .style('fill', (ddd) => colours(ddd.header))
        .on('click', (ddd, iii) => this.barClick(ddd, iii))
        ;

    // Update.
    // NOTE: this can handle +/– values, but (for now) insists upon a 'default'
    // anchorage to zero (ie, it can't handle broken scales...)
    barBinding
      .transition().duration(duration)
        .attr({
          'x': (ddd) => xScale(Math.min(0, ddd.value)),
          'width': (ddd) => Math.abs(xScale(ddd.value) - xScale(0)),
          'y': (ddd) => yScale(ddd.category),
          'height': yScale.rangeBand(),
        });

    barBinding.exit()
      .transition().duration(duration)
      .attr('width', 0)
        .remove();
  }
  // UPDATE BARS ends


  // UPDATE ZERO LINE
  // Handles any zero line
  updateZeroLine() {
    const config = this.props.config;
    // Context and duration
    // (NOTE: In the long term, we'd need more than one group...)
    const barGroup = Dthree.select('.d3-bar-series-group');
    const duration = config.duration;
    // Passed scale:
    const xScale = config.xScale;
    // How will the zero line appear?
    // I don't think we need to check max. If min<0, red zero line...
    let zeroClass = 'd3-bar-zero-black';
    if (xScale.domain()[0] < 0) {
      zeroClass = 'd3-bar-zero-red';
    }
    // Bind data (needs *some* value)
    const zeroBinding = barGroup.selectAll('line')
      .data([ 0 ]);
    const height = config.bounds.height;
    //
    // ENTER
    zeroBinding.enter()
      .append('line');
    // NOTE. This can handle +/– values, but insists upon a 'default'
    // anchorage to zero (ie, it can't handle broken scales... yet)
    // (Although if scale breaks, the zero line will vanish somewhere off-chart...)
    zeroBinding
      .transition().duration(duration)
      .attr({
        'class': zeroClass,
        'x1': xScale(0),
        'y1': 0,
        'x2': xScale(0),
        'y2': height,
      });

    zeroBinding.exit()
        .remove();
  }
  // UPDATE ZERO LINE ends

  // RENDER
  render() {
    // Axis group
    return (
      <g className="d3-bar-series-group" ref="barSeriesGroup"/>
    );
  }
}
