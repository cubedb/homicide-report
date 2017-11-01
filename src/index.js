// @flow
import React from 'react'
import reactDOM from 'react-dom'
import qs from 'qs'

import { timeFormat, timeParse } from 'd3'

import { TimeGraph, TagGroup, BarGraphGroup } from 'react-cubedb'


const DATA_SOURCE = 'http://188.226.178.165:9998/v1/homicides_month/last/400'

class CubeGraph extends React.Component {

  state: {
    loading: boolean,
    filter: { [string]: Array<string> },
    group: string,
    data: ?Object
  }
  
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      data: null,
      group: null,
      filter: {}
    }
  }

  componentDidMount = () => {
    this.load()
  }

  load = () => {
    this.setState({
        loading: true
    }, () => {
      const url = `${DATA_SOURCE}/${this.state.group ? `group_by/${this.state.group}`:''}?${qs.stringify(this.state.filter, {encode: true, indices: false})}`

      fetch(url, {
        method: 'GET',
      })
        .then(response => {
          return response.json()
        })
        .then(this.update)
        .catch(e => {
          this.setState({
            error: e.message
          })
        })
    })
  }

  updateGroup = (newGroup) => {
    let group = null
    if(this.state.group !== newGroup) {
      group = newGroup
    }
    this.setState({
      group
    }, this.load)
  }
  updateFilter = (key, value) => {
    const filter = Object.assign({}, this.state.filter)

    if(filter[key] && filter[key].includes(value)) {
      const i = filter[key].indexOf(value)
      filter[key] = [...filter[key].slice(0, i), ...filter[key].slice(i+1)]
    } else {
      filter[key] = [...(filter[key]||[]), value]
    }

    this.setState({
      filter
    }, this.load)

  }


  update = (response) => {
    this.setState({
      loading: false,
      data: response.response
    })
    return data
  }

  getColor = () => {
    return 'rgb(120,120,120)'
  }

  onChange = (o,v) => {
    if(o === 'group') {
      this.updateGroup(v)
    } else {
      this.updateFilter(o, v)
    }
  }

  render() {
    if(this.state.data) {
      const {p, ... countData } = this.state.data

      const timeData = {}
      
      Object.keys(p).forEach((k) => {
        timeData[timeParse('%Y-%m')(k).getTime()/1000] = p[k]
      })

      return (
        <div>
          <h1>Homicide Report</h1>
          {/*<TimeGraph
            data={timeData}
            aggregation='day'
            getColor={this.getColor}
            timeUnitLengthSec={60*60*24*30}
            timeDisplay={timeFormat('%x')}
            onChange={this.onChange}
            mouseIteractions={true}
            type='bar'
          />*/}
          <BarGraphGroup
            name={'Amount'}
            columns={2}
            data={countData}
            onChange={this.onChange}
            group={this.state.group}
            selectedItems={this.state.filter}
          />
        </div>
      )
    } else if (this.state.loading) {
      return <div> loading... </div>
    } else {
      return <div> nothing to render </div>
    }
  }
}

reactDOM.render(
  <CubeGraph />,
  document.getElementById('container')
)
