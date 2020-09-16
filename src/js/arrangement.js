import loadData from './load-data'
import loadImage from './utils/load-image-promise'

const $section = d3.selectAll('[data-js="arrangement"]')

const HOLE_OFFSET = 100
const BREAKPOINT = 900
const EXHIBIT_WIDTH = 1228
const TOP_GAP = {
    2: '17.6%',
    5: '7.7%'
}
const MIDDLE_GAP = {
    2: '17.6%',
    5: '7.7%'
}


function cleanData(dat){
    const mapped =  dat.map((d) => ({
        ...d,
        index: +d.index,
        positionY: +d.positionY,
        camera: d.camera.split(', ')
    }))

    const nested = d3.nest()
        .key(d => d.tile)
        .entries(mapped)

        return nested
}

function swapSource(){
    const $sel = d3.select(this)
    const id = $sel.attr('data-id')
    const type = $sel.attr('data-type')
    console.log('clicked')
  
    if (type === 'png'){
      $sel.attr('src', `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/output/${id}.gif`)
      $sel.attr('data-type', 'gif')
    }
  
    else {
      $sel.attr('src', `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/stills/${id}.png`)
      $sel.attr('data-type', 'png')
    }
  
  }

function findGridArea(cam, i){
    console.log({i})
    // if on the right, column 2, otherwise 1
   const row =  cam.positionY * 2
    const column = cam.positionX === 'R' ? 2 : 1 
    console.log({cam, pos: `${cam.positionY} / ${column} / span 1 / span 1 `})
    return `${row} / ${column} / span 1 / span 1 `
}

function findNewHeight(origHeight){
    const width = window.innerWidth > EXHIBIT_WIDTH ? EXHIBIT_WIDTH : window.innerWidth
    console.log({origHeight, width})
    return origHeight * width / EXHIBIT_WIDTH
}

function resize(){
    console.log('resize running')
    $section.selectAll('.tile')
        .style('height', d => `${findNewHeight(d.values[0].imHeight)}px`)
}

function loadMaps(data){
    console.log('loadMaps running')

    const $tile = $section.selectAll('.tile')
        .data(data)
        .join(enter => {      
            // setup grid
            // anywhere between 2 and 5 rows

            const $container = enter.append('div')
                .attr('class', d => `tile tile__${d.values[0].shape}`)
                .style('grid-template-rows', d => {
                const top = TOP_GAP[d.values.length]
                const middle = MIDDLE_GAP[d.values.length]
                return `${top} repeat(${d.values.length - 1}, 1fr ${middle}) 1fr ${top}`
            })

            // append map artwork
            $container.append('img')
                .attr('class', 'exhibit')
                .attr('src', d => `assets/images/${d.key}.png`)
                .style('grid-area', (d, i, n) => {
                    return `1 / 1 / ${d.values.length + 1} / 3`
                })

            return $container
        })


        $tile.selectAll('.cam__display')
            .data(d => d.values)
            .join(enter => {
                // append placeholder images
                enter.append('img')
                    .attr('class', 'cam__display')
                    .attr('data-id', d => d.camera[0])
                    .attr('data-type', 'png')
                    .attr('src',  d => `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/stills/${d.camera[0]}.png`)
                    .style('grid-area', (d, i) => findGridArea(d, i))
                    //.style('z-index', -10)
                    .on('click', swapSource)
            })


        resize()
}

function preloadImages(data){
    console.log('preloadImages running')
    return new Promise(resolve => {
        const allImages = []

        for (let i = 0; i < data.length; ++i){
            const imgPromise = loadImage(`assets/images/${data[i].key}.png`)

            imgPromise.then(img => {
                img.onload(() => {
                    if (i === data.length) resolve()
                    console.log({i})
                })
                //img.on('load', d => console.log(`${d} has loaded`))
            })
            allImages.push(imgPromise)
        }


console.log({allImages})
     Promise.all(allImages).then(resolve).catch(e => console.log(`Error in loading images`))
    }).catch(e => console.error(e))
}


function init(){
    loadData('assets/data/arrangement.csv').then(response => {
        const data = cleanData(response)
        preloadImages(data)
        return data
    })
    .then((data) => loadMaps(data))
}

export default { init, resize };
