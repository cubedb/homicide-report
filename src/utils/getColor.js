import { schemeCategory20c, scaleOrdinal } from 'd3'

const colorsScales: { [string]: Object } = {}

export default function getColor (name: string, dimension: string ='null', group: string = null) {
  if(name === null) {
    return '#3182bd'
  } else {
    switch((name||'').toString().toLowerCase()) {
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
        if(!colorsScales[dimension]) {
          colorsScales[dimension] = scaleOrdinal(schemeCategory20c)
        }
        return colorsScales[dimension](name)
    }
  }
}
