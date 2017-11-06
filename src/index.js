// @flow
import React from 'react'
import reactDOM from 'react-dom'
import qs from 'qs'

import { timeFormat, utcParse, utcFormat, schemeCategory20c, scaleOrdinal } from 'd3'

import { TimeGraph, TagGroup, BarGraphGroup } from 'react-cubedb'

const colors = scaleOrdinal(schemeCategory20c)
const DATE_FORMAT = '%Y-%m'
const DATA_SOURCE = 'http://188.226.178.165:9998/v1/homicides_month/last/400'

class CubeGraph extends React.Component {

  state: {
    loading: boolean,
    filter: { [string]: Array<string> },
    group: string,
    range: Array<number>,
    comparingRange: Array<number>,
    comparing: boolean,
    data: ?Object,
    comparingData: ?Object
  }

  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      data: null,
      comparingData: null,
      group: null,
      range: null,
      comparingRange: null,
      filter: {},
      comparing: false
    }
  }

  componentDidMount = () => {
    this.update()
  }


  load = (range) => {
      const filter = Object.assign({}, this.state.filter)

      if(range && range.length) {
        const f = utcFormat(DATE_FORMAT)
        const [p0,p1] = range
        filter.p = [f(p0), f(p1)]
      }

      const url = `${DATA_SOURCE}/${this.state.group ? `group_by/${this.state.group}`:''}?${qs.stringify(filter, {encode: true, indices: false})}`

      return fetch(url, {
        method: 'GET',
      }).then(response => {
        return response.json()
      }).then((response) => {
        return response.response
      }).catch(this.updateError)
  }

  updateError = e => {
    this.setState({
      error: e.message
    })
  }

  update = () => {
    this.setState({
      loading: true
    }, () => {
      this.load(this.state.range)
        .then(response => {
          this.setState({
            loading: false,
            data: response
          })
          return response
        })
        .then((response) => {
          if(this.state.comparingRange) {
            this.load(this.state.comparingRange)
              .then(response => {
                this.setState({
                  loading: false,
                  comparingData: response
                })
                return response
              })
              .catch(this.updateError)
          }
          return response
        })
        .catch(this.updateError)
    })
  }

  updateGroup = (newGroup) => {
    let group = null
    if(this.state.group !== newGroup) {
      group = newGroup
    }
    this.setState({
      group
    }, this.update)
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
    }, this.update)

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

  onChangeDates = (range) => {
    const comparing = range.length ? this.state.comparing : false
    const comparingRange = comparing ? this.state.comparingRange : false
    const comparingData = comparing ? this.state.comparingData : false

    this.setState({
      range,
      comparing,
      comparingRange,
      comparingData
    }, this.update)
  }

  onCompare = (comparing, range) => {
    const comparingRange = comparing ? range : false
    const comparingData = comparing ? this.state.comparingData : false
    
    this.setState({
      comparing,
      comparingRange,
      comparingData
    }, this.update)
  }

  render() {
    if(this.state.data) {
      const {p, ... countData } = this.state.data

      const timeData = {}

      Object.keys(p).forEach((k) => {
        timeData[utcParse(DATE_FORMAT)(k).getTime()] = p[k]
      })

      return (
        <div>
          <h1>Homicide Report</h1>
          <TimeGraph
            data={timeData}
            aggregation='month'
            timeDisplay={timeFormat('%b %Y')}
            onChange={this.onChangeDates}
            mouseIteractions={true}
            onClickCompare={this.onCompare}
            group={this.state.group}
            type='area'
            comparing={this.state.comparing}
            getColor={colors}
          />
          <TagGroup
              onChange={this.onChange}
              getColor={colors}
              tags={this.state.filter}
            />
          <BarGraphGroup
            name={'Amount'}
            columns={2}
            data={countData}
            comparingTo={this.state.comparingData}
            onChange={this.onChange}
            group={this.state.group}
            selectedItems={this.state.filter}
            getColor={colors}
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
