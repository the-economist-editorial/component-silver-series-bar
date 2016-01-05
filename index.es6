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
    // To guarantee that we only update on 2nd render:
    if (!this.props.config.firstRender) {
      this.updateBars();
      this.updateZeroLine();
    }
  }

  // COMPONENT DID UPDATE
  componentDidUpdate() {
    // To guarantee that we only update on 2nd render:
    if (!this.props.config.firstRender) {
      this.updateBars();
      this.updateZeroLine();
    }
  }

  // ======= Event handler ======

  // BAR CLICK
  // Handles bar click event. Params are data (cat and value)
  // and index in overall data.
  // NOTE: This event currently gets passed back up to
  // BarChart, where I do a console.log. Long-term, I might
  // use this to set 'emphasis' on the bar...
  barClick(data, index) {
    const clickObj = { data, index };
    this.props.passBarClick(clickObj);
  }
  // BAR CLICK ends

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

  // UPDATE BARS
  updateBars() {
    const config = this.props.config;
    // Context (parent group created in render) and duration
    const barGroup = Dthree.select('.d3-bar-series-group');
    // NOTE: duration is still up in the air...
    const duration = config.duration;
    // Passed scales:
    const xScale = config.xScale;
    const yScale = config.yScale;
    // Stack layout
    const stack = Dthree.layout.stack();
    // Data
    const data = config.data;
    const headers = config.headers;
    // Colours
    const colourSet = config.colourSet;
    const colours = this.getColours(headers, colourSet);
    // As far as I can see, the data is in the right format:
    // an array of objects with header:value properties
    // Stack and map data:
    const mappedData = stack(colours.domain().map((header) => {
      return data.map((ddd) => {
        return { y: Number(ddd[header]), category: ddd.category, fill: colours(header), header };
      });
    }));
    // mappedData is an array of arrays, each of which represents a series
    // Each series sub-array consists of <pointCount> objects
    // defining one data point and with properties...
    //    category: the category string
    //    y0: the cumulative baseline value (0 for 1st)
    //    y: the 'internal' value of THIS point
    // At this point, these are actual unscaled vals

    // Bind outer (series) data
    const groupBinding = barGroup.selectAll('.series-group')
      .data(mappedData);
    // Enter, appending class
    groupBinding.enter()
      .append('g')
      .attr('class', (ddd, iii) => `series-group series-${iii}`)
      ;
    // No update
    // Exit
    groupBinding.exit()
      .selectAll('.d3-bar-rect')
      .transition().duration(duration)
      .attr('width', 0)
      ;
    // Exit
    groupBinding.exit()
      .transition().delay(duration)
      .remove()
      ;

    // Bind inner (points) data
    const rectBinding = groupBinding.selectAll('.d3-bar-rect')
      .data((ddd) => ddd);
    // Enter appands rect on zero, at zero width
    rectBinding.enter()
      .append('rect')
        .attr({
          'class': 'd3-bar-rect',
          'y': (ddd) => {
            return yScale(ddd.category);
          },
          'height': yScale.rangeBand(),
          'x': 0,
          'width': 0,
        })
        // .style('fill', (ddd) => {
        //   return ddd.fill;
        // })
        // Set click event on rect
        .on('click', (ddd, iii) => this.barClick(ddd, iii))
        // Crude tooltip (populated in update)
        // NOTE: can't use '=>' because D3 needs to select 'this'
        /* eslint-disable func-names, no-invalid-this */
        .each(function () {
          Dthree.select(this).append('svg:title')
            .attr('class', 'd3-tooltip')
            ;
        })
      ;

    // Update.
    // NOTE: this can handle +/– values, but (for now) insists upon a 'default'
    // anchorage to zero (ie, it can't handle broken scales...)
    rectBinding
      .transition().duration(duration)
        .attr({
          // Left ('x') position
          'x': (ddd) => {
            // By default, assume actual value is positive
            let xPos = Number(ddd.y0);
            if (ddd.y < 0) {
              // If val is negative, get inherited baseline
              // and subtract width
              // NOTE: I think this all assumes that a point has
              // all+ or all– values. I'll have to revisit for mixed
              // +/– values where we pile up independently each side of zero...
              xPos = Number(ddd.y0) + Number(ddd.y);
            }
            return xScale(xPos);
          },
          // Width: force to positive value, subtracting
          // scaled zero...
          'width': (ddd) => {
            const wid = Math.abs(Number(ddd.y));
            return xScale(wid) - xScale(0);
          },
          // Y position
          'y': (ddd) => yScale(ddd.category),
          // Bar height
          'height': yScale.rangeBand(),
        })
        .style('fill', (ddd) => {
          return ddd.fill;
        })
        // Populate tooltip (set up by 'enter')
        .each(function (ddd) {
          const myBar = Dthree.select(this);
          myBar.select('title').text(`Header: ${ddd.header}; category: ${ddd.category}; value: ${ddd.y}`);
        })
    ;

    // NOTE: EXIT isn't right yet...
    rectBinding.exit()
      .transition().duration(duration)
      .attr('width', 0);
    rectBinding.exit()
      .transition().delay(duration * 2)
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

  // RENDER all-series parent group:
  render() {
    return (
      <g className="d3-bar-series-group" ref="barSeriesGroup"/>
    );
  }
}
