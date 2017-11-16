// @flow

import React from 'react'
import { stringify, parse } from 'qs'
import { utcParse, utcFormat } from 'd3'

import Report from './report'

const DATE_FORMAT = '%Y-%m'
const DATA_SOURCE = 'https://cubedb.org/v1/homicides_month/last/400'


export default class ReportContainer extends React.Component {

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
    if(global.location.search) {
      this.updateFromQuery(global.location.search)
    } else {
      this.update()
    }
  }

  paramsToString = (params: Object) => {
    return stringify(params, {encode: true, indices: false, skipNulls: true})
  }

  stringToParams = (string: string) => {
    return parse(string)
  }

  load = (range) => {
    const filter = Object.assign({}, this.state.filter)

    if(range && range.length) {
      const f = utcFormat(DATE_FORMAT)
      const [p0,p1] = range
      filter.p = [f(p0), f(p1-60)]
    }

    const url = `${DATA_SOURCE}/${this.state.group ? `group_by/${this.state.group}`:''}?${this.paramsToString(filter)}`

    return fetch(url, {
      method: 'GET',
    }).then(response => {
      return response.json()
    }).then((response) => {
      if(response.response && response.response.p) {
        const p = response.response.p
        const timeData = {}
        Object.keys(p).forEach((k) => {
          timeData[utcParse(DATE_FORMAT)(k).getTime()] = p[k]
        })
        response.response = Object.assign({}, response.response, {
          p: timeData
        })
      }
      return response.response
    }).catch(this.updateError)
  }

  updateError = e => {
    this.setState({
      error: e.message
    })
  }

  updateQuery = () => {
    const hasRange = this.state.range && this.state.range.length
    const params = Object.assign({}, this.state.filter, {
      group: this.state.group,
      from: hasRange ? Math.min(...this.state.range) : null,
      to: hasRange ? Math.max(...this.state.range) : null,
      window: this.state.comparingRange ? Math.min(...this.state.comparingRange): null,
      comparing: this.state.comparing ? true : null
    })

    const newPath = `${global.location.origin}?${this.paramsToString(params)}`

    global.history.pushState({
      path: newPath
    }, global.document.title, newPath)

    this.update()
  }

  updateFromQuery = (stringParams: string) => {
    const {group, from, to, window, comparing, ...filter} = this.stringToParams(stringParams.replace(/^\?/, ''))

    Object.keys(filter).map(f => {
      if(!Array.isArray(filter[f])) {
        filter[f] = [filter[f]]
      }
    })

    const range = from && to ? [from, to] : null
    const comparingRange = window && from ? [window, to] : null

    const newState = {
      comparing: !!comparing,
      group: group || null,
      filter: Object.assign({}, filter),
      range,
      comparingRange
    }

    this.setState(newState, this.update)
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
    }, this.updateQuery)
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
    }, this.updateQuery)

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
    }, this.updateQuery)
  }

  onCompare = (comparing, range) => {
    const comparingRange = comparing ? range : false
    const comparingData = comparing ? this.state.comparingData : null

    this.setState({
      comparing,
      comparingRange,
      comparingData
    }, this.updateQuery)
  }

  render() {
    if (this.state.loading && !this.state.data) {
      return <div>Loading</div>
    } else if (this.state.data) {
      const {p: timeData, ... countData } = this.state.data

      return (<Report
        onCompare={this.onCompare}
        onChangeDates={this.onChangeDates}
        timeSeries={timeData}
        counterSeries={countData}
        comparingSeries={this.state.comparingData}
        onChange={this.onChange}
        onClickCompare={this.onCompare}
        group={this.state.group}
        comparing={this.state.comparing}
        getColor={this.getColor}
        filter={this.state.filter}
        range={this.state.range}
      /> )
    } else {
      return <div> nothing to render </div>
    }
  }
}
