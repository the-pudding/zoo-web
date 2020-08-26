/* global d3 */
import loadData from './load-data'

const $section = d3.select('.grid')

let data = []



function resize() {}

function swapSource(){
  const $sel = d3.select(this)
  const id = $sel.attr('data-id')
  const type = $sel.attr('data-type')

  if (type === 'png'){
    $sel.attr('src', `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/output/${id}.gif`)
    $sel.attr('data-type', 'gif')
  }

  else {
    $sel.attr('src', `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/stills/${id}.png`)
    $sel.attr('data-type', 'png')
  }

}

function setup(){
  const $group = $section.selectAll('.cam')
    .data(data)
    .join((enter) => {
      const div = enter.append('div').attr('class', (d) => `cam cam--${d.id}`)

      const image = div.append('img')
      .attr('class', 'cam__display')
      .attr('data-id', d => d.id).attr('data-type', 'png')
      .attr('src',  d => `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/stills/${d.id}.png`)
      div.append('p').text(d => `ID: ${d.id}`)
      div.append('p').text(d => d.animal)
      div.append('p').text(d => d.facility)

      image.on('click', swapSource)
    })
}

function init() {
  loadData('https://raw.githubusercontent.com/the-pudding/zoo-data/master/zoos.csv').then(res => {
    data = res
    setup()
  })
  
}

export default { init, resize };
