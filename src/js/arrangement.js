import loadData from './load-data'
import loadImage from './utils/load-image-promise'
import 'intersection-observer'
import scrollama from 'scrollama'
import findUnique from './utils/unique';

const $section = d3.selectAll('[data-js="arrangement"]')
const $nav = d3.selectAll('[data-js="navigation"]')
const $locations = $nav.select('.location')
const $animals = $nav.select('.animal')

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

const scroller = scrollama()

function swapSource(el){
    const $sel = d3.select(el)//d3.select(this)
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

function setupScroll(){
    scroller 
        .setup({
            step: '.cam__display'
        })
        .onStepEnter(response => {
            const {element, index, direction} = response
            swapSource(element)
        })
        .onStepExit(response => {
            const {element, index, direction} = response
            swapSource(element)
        })
}

function cleanData(dat){
    return new Promise((resolve) => {
            const mapped =  dat.map((d) => ({
        ...d,
        index: +d.index,
        positionY: +d.positionY,
        camera: d.camera.split(', ')
    }))

    const nested = d3.nest()
    .key(d => d.tile)
    .entries(mapped)
 
    resolve ({mapped, nested})
    })

}



function findGridArea(cam, i){
    // if on the right, column 2, otherwise 1
   const row =  cam.positionY * 2
    const column = cam.positionX === 'R' ? 2 : 1 
    return `${row} / ${column} / span 1 / span 1 `
}

function findNewHeight(origHeight){
    const width = window.innerWidth > EXHIBIT_WIDTH ? EXHIBIT_WIDTH : window.innerWidth
    return origHeight * width / EXHIBIT_WIDTH
}

function resize(){

    $section.selectAll('.tile')
        .style('height', d => {
            const newHeight = `${findNewHeight(d.values[0].imHeight)}px`
            return newHeight
        })
}

function loadMaps(data){

    console.log({data})

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
                return `${top} repeat(${d.values.length - 1}, minmax(0, 1fr) ${middle}) minmax(0, 1fr) ${top}`
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
        setupScroll()
}

function preloadImages(data){
    return new Promise(resolve => {
        const allImages = []

        for (let i = 0; i < data.length; ++i){
            const imgPromise = loadImage(`assets/images/${data[i].key}.png`)

            imgPromise.then(img => {
                img.onload(() => {
                    if (i === data.length) resolve()
    
                })
                //img.on('load', d => console.log(`${d} has loaded`))
            })
            allImages.push(imgPromise)
        }

     Promise.all(allImages).then(resolve).catch(e => console.log(`Error in loading images`))
    }).catch(e => console.error(e))
}

function setupNav(raw){
    const locData = d3.nest()
    .key(d => d.location)
    .entries(raw)

    $locations.selectAll('.title').data(locData)
        .join(enter => enter.append('p')
            .attr('class', 'title')
            .text(d => d.key)
        
        )

    const animals = findUnique(raw.map(d => d.animal))

    $animals.selectAll('.name').data(animals)
        .join(enter => enter.append('p')
            .attr('class', 'name')
            .text(d => d)
        )
}


function init(){
    loadData('assets/data/arrangement.csv').then(response => {
        return cleanData(response)
    })
    .then(({mapped, nested}) => {
        preloadImages(nested)
        return {mapped, nested}
    })
    .then(({mapped, nested}) => {
        console.log({mapped, nested})
        setupNav(mapped)
        loadMaps(nested)
    })
}

export default { init, resize };
