// @flow
import React from 'react'
import { timeFormat } from 'd3'

import getColor from '../../utils/getColor'

import { TimeGraph, TagGroup, BarGraphGroup } from 'react-cubedb'

type Series = {
  [string]: { // date string or dimension
    [string]: number // counter
  }
}

type Props = {
  onCompare: Function,
  onChangeDates: Function,
  onChange: Function,
  filter: ?{
    [string]: Array<string>
  },
  timeSeries: Series,
  counterSeries: Series,
  comparingSeries: Series,
  group: ?string,
  comparing: bool,
  range: Array<string>
}

type State = {
  columns: number
}


export default class Report extends React.Component {

  props: Props
  state: State

  constructor(props) {
    super(props)

    this.state = {
      columns: 1
    }
  }

  componentDidMount = () => {
    window.addEventListener('resize', () => {
      this.updateColumnNumber()
    })
    this.updateColumnNumber()
  }

  componentWillUnmout = () => {
    this.removeEventListener('resize')
  }

  updateColumnNumber = () => {
    const columns = window.innerWidth < 640 ? 1 : 2

    this.setState({
      columns
    })

    return columns
  }

  getColor = (name, dimension) => {
    return getColor(name, dimension, this.props.group)
  }

  render() {
    const margin = {
      left: 30,
      bottom: 20,
      right: 10
    }

    return (<div>
      <TimeGraph
        height={360}
        aggregation='month'
        margin={margin}
        getColor={this.getColor}
        timeDisplay={timeFormat('%b %Y')}
        type='area'
        mouseIteractions={true}
        data={this.props.timeSeries}
        onChange={this.props.onChangeDates}
        onClickCompare={this.props.onCompare}
        group={this.props.group}
        comparing={this.props.comparing}
        filter={this.props.range}
      />
      <TagGroup
        onChange={this.props.onChange}
        tags={this.props.filter}
      />
      <BarGraphGroup
        name={'Counts'}
        getColor={this.getColor}
        columns={this.state.columns}
        data={this.props.counterSeries}
        comparingTo={this.props.comparingSeries}
        onChange={this.props.onChange}
        group={this.props.group}
        selectedItems={this.props.filter}
      />
    </div>)
  }
}
