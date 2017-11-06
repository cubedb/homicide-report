// @flow
import React from 'react'
import reactDOM from 'react-dom'
import qs from 'qs'

import { timeFormat, utcParse, utcFormat, schemeCategory20c, scaleOrdinal } from 'd3'

import { TimeGraph, TagGroup, BarGraphGroup } from 'react-cubedb'

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
    comparingData: ?Object,
    columns: number
  }

  colors = scaleOrdinal(schemeCategory20c)

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
      comparing: false,
      columns: 2
    }
  }

  componentDidMount = () => {
    this.update()
    window.addEventListener('resize', () => {
      this.updateColumnNumber()
    })
  }

  componentWillUnmout = () => {
    this.removeEventListener('resize')
  }

  load = (range) => {
      const filter = Object.assign({}, this.state.filter)

      if(range && range.length) {
        const f = utcFormat(DATE_FORMAT)
        const [p0,p1] = range
        filter.p = [f(p0), f(p1-60)]
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

  updateColumnNumber = () => {
    const columns = window.innerWidth < 640 ? 1 : 2
    this.setState({
      columns
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
          this.updateColumnNumber()
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

    this.color = scaleOrdinal(schemeCategory20c)
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
  getColor = (name) => {
    if(name === null || !this.state.group) {
      return '#93c54b'
    } else {
      switch(name.toString().toLowerCase()) {
        case 'unknown':
          return '#333'
        case 'other':
          return '#999'
        case 'female':
          return '#C761C1'
        case 'male':
          return '#729CD1'
        case 'no':
          return '#C73531'
        case 'yes':
          return '#37AD27'
        default:
          return this.colors(name)
      }
    }
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
    const comparingData = comparing ? this.state.comparingData : null

    this.setState({
      range,
      comparing,
      comparingRange,
      comparingData
    }, this.update)
  }

  onCompare = (comparing, range) => {
    const comparingRange = comparing ? range : false
    const comparingData = comparing ? this.state.comparingData : null

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
            <TimeGraph
              data={timeData}
              height={360}
              aggregation='month'
              timeDisplay={timeFormat('%b %Y')}
              onChange={this.onChangeDates}
              mouseIteractions={true}
              onClickCompare={this.onCompare}
              group={this.state.group}
              type='area'
              comparing={this.state.comparing}
              getColor={this.getColor}
              filter={this.state.filter.p}
              margin={{
                left: 30,
                bottom: 20,
                right: 10
              }}
            />
          <TagGroup
              onChange={this.onChange}
              getColor={this.getColor}
              tags={this.state.filter}
            />
          <BarGraphGroup
            name={'Amount'}
            columns={this.state.columns}
            data={countData}
            comparingTo={this.state.comparingData}
            onChange={this.onChange}
            group={this.state.group}
            selectedItems={this.state.filter}
            getColor={this.getColor}
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
  document.getElementById('vizContainer')
)
