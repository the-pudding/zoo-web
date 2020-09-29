import loadData from './load-data'
import loadImage from './utils/load-image-promise'
import 'intersection-observer'
import scrollama from 'scrollama'
import findUnique from './utils/unique';
import videoSVG from './videoSVG'
import modal from './modal'

const $section = d3.selectAll('[data-js="arrangement"]')
const $islands = $section.selectAll('[data-js="arrangement__islands"]')
const $mobileAnimals = d3.selectAll('[data-js="navigation"]')

let linkData = null
let mappedData = null
let nestedData = null


const HOLE_OFFSET = 100
const BREAKPOINT = 848
let MOBILE = false
let MOBILE_SETUP = false
let DESKTOP_SETUP = false
const EXHIBIT_WIDTH = 550
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

function highlightList(element){
     const all = $section.selectAll('.g-anno')
     
     all.classed('in-focus', false)

     const animal = d3.select(element).attr('data-animal')

     $section.selectAll(`[data-list="${animal}"]`).classed('in-focus', true)
     
     
}

function setupScroll(){
    scroller 
        .setup({
            step: '.cam__display'
        })
        .onStepEnter(response => {
            const {element, index, direction} = response
            swapSource(element)
            $section.selectAll('.cam__display').classed('in-focus', false)
            d3.select(element).classed('in-focus', true)
            highlightList(element)
            if (MOBILE) {
                $mobileAnimals.selectAll('ul').classed('is-hidden', true)
                const animal = d3.select(element).attr('data-animal')
                const $ul = $mobileAnimals.selectAll(`[data-animal="${animal}"]`)
                $ul.classed('is-hidden', false)
    

                $ul.node().scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                })
            }
        })
        .onStepExit(response => {
            const {element, index, direction} = response
            swapSource(element)
            d3.select(element).classed('in-focus', false)
        })
}

function cleanData(dat){
    return new Promise((resolve) => {
        mappedData =  dat[0].map((d) => ({
            ...d,
            index: +d.index,
            positionY: +d.positionY,
            camera: d.camera.split(', ')
        }))

        nestedData = d3.nest()
        .key(d => d.tile)
        .entries(mappedData)

        linkData = dat[1]
    
        resolve ({mappedData, nestedData, links: dat[1]})
    })

}

function launchModal(){
    const $sel = d3.select(this)
    const animal = $sel.attr('data-animal')

    console.log({animal})

    const group  = $section.selectAll(`[data-list="${animal}"]`)
    const facility = group.selectAll('.animal--facility.selected').node().innerText.trim()

    modal.setup(mappedData, linkData, animal, facility)
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

    $islands.selectAll('.tile, .annotation--desktop')
        .style('height', d => {
            const newHeight = `${findNewHeight(d[0].imHeight)}px`
            return newHeight
        })

    MOBILE = window.innerWidth < BREAKPOINT
    setupNav()
}

function setupFacilities(group){
    group.selectAll('ul')
    .selectAll('.animal--facility')
    .data(d => {
        const animal = d.animal 
        const facilities = linkData.filter(e => e.animal === animal).map(e => ({
            ...e,
            tile: d.tile,
            positionX: d.positionX
        }))
        return facilities
    })
    .join(enter => {
        const $li = enter.append('li')
            .attr('class', 'animal--facility')
            .html(d => `<span class='facility--name'>${d.facility}</span> <span class='video--icon'>${videoSVG}</span>`)
            .attr('data-id', d => d.id)
            .attr('data-animal', d => d.animal)
            .attr('data-tile', d => d.tile)
            .classed('selected', d => {
                const thisCam = $section.select(`[data-exhibit="${d.tile}"]`)
                    .selectAll('.cam__display')
                    .filter((e, i, n) => {
                        return d3.select(n[i]).attr('data-animal') === d.animal
                    })
                const displayed = thisCam.attr('data-id')

                return d.id === displayed
            })
            .on('click', switchFacility)

            $li.select('.video--icon').classed('is-hidden', d => {
                const thisCam = $section.select(`[data-exhibit="${d.tile}"]`)
                    .selectAll('.cam__display')
                    .filter((e, i, n) => {
                        return d3.select(n[i]).attr('data-animal') === d.animal
                    })
                const displayed = thisCam.attr('data-id')

                return d.id !== displayed
            })
    })
}

function setupNav(){
    let $g = null

    // if on mobile and mobile nav isn't already setup
    if (MOBILE === true && MOBILE_SETUP === false){ 
        MOBILE_SETUP = true
        $g = $mobileAnimals.select('.animal').selectAll('.g-anno')
            .data(mappedData)
            .join(enter => {
            const $container = enter.append('div').attr('class', 'g-anno')
                .attr('data-list', d => d.animal)
                .style('align-self', d => d.positionX === 'L' ? 'flex-start' : 'flex-end')

            $container.append('h3').attr('class', 'animal--name')
                .text(d => d.animal)
                .attr('data-animal', d => d.animal)
                .style('text-align', d => d.positionX === 'L' ? 'left' : 'right')
                .on('click', 'launchModal')

            $container.append('ul').attr('class', 'animal--list')
                .attr('data-animal', d => d.animal)

            return $container
            })

        setupFacilities($g)

    } else if (MOBILE === false && DESKTOP_SETUP ===  false){
        DESKTOP_SETUP = true

        // add annotations for desktop
        const $annoD = $islands.selectAll('.g-island')
            .selectAll('.annotation--desktop')
            .data(d => [d.values])
            .join(enter => enter.append('div').attr('class', 'annotation--desktop'))
            .style('grid-template-rows', d => determineGridRows(d))

        $g = $annoD.selectAll('.g-anno')
            .data(d => d)
            .join(enter => {
                const g = enter.append('div').attr('class', 'g-anno').attr('data-list', d => d.animal)

                g.append('h3').attr('class', 'animal--name')
                    .text(d => d.animal)
                    .attr('data-animal', d => d.animal)
                    .on('click', launchModal)
                
                g.append('ul').attr('class', 'animal--list').attr('data-animal', d => d.animal)

                return g
            })
            .style('grid-area', (d, i) => `${(i + 1) * 2} / 1 / span 1 / span 1 `)

        setupFacilities($g)
    }

}

function switchFacility(){
    const sel = d3.select(this)
    const cam = sel.attr('data-id')
    const animal = sel.attr('data-animal')
    const exhibit = sel.attr('data-tile')

    const $exhib = $section.select(`[data-exhibit="${exhibit}"]`)

    let $li = null

    // set low opacity for non-selected
    if (MOBILE){
        $li = $mobileAnimals.selectAll('ul').filter((d, i, n) => {
            return d3.select(n[i]).attr('data-animal') === animal
        }).selectAll('li')
    } else {
       $li = $exhib.selectAll('ul').filter((d, i, n) => {
        return d3.select(n[i]).attr('data-animal') === animal
    }).selectAll('li') 
    }
    
    $li.classed('selected', false)
    
    $li.selectAll('.video--icon').classed('is-hidden', true)

    sel.classed('selected', true)

    sel.select('.video--icon').classed('is-hidden', false)

    // find which display to switch
    const match = $exhib.selectAll('.cam__display').filter((d, i, n) => {
        return d3.select(n[i]).attr('data-animal') === animal
    })

    const type = match.attr('data-type')


    if (type === 'png'){
        match.attr('src', `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/stills/${cam}.png`)
        .attr('data-id', cam)
      }
    
      else {
        match.attr('src', `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/output/${cam}.gif`)
        .attr('data-id', cam)
      }

}

function determineGridRows(d){
    const top = TOP_GAP[d.length]
    const middle = MIDDLE_GAP[d.length]
    const tile = d[0].tile
    const final = `${top} repeat(${d.length - 1}, minmax(0, 1fr) ${middle}) minmax(0, 1fr) ${top}`
    //gridRows.push({tile: `${tile}`, gridRow: final })
    return final
}

function loadMaps(){
    const data = nestedData

    // create group
    const $group = $islands.selectAll('.g-island')
        .data(data)
        .join(enter => 
            enter.append('div')
                .attr('class', 'g-island')
                .attr('data-exhibit', d => `${d.key}`)
    )

    let gridRows = []

    // add exhibit tiles
    const $tile = $group.selectAll('.tile')
        .data(d => [d.values])
        .join(enter => {      
            // setup grid
            // anywhere between 2 and 5 rows

            const $container = enter.append('div')
                .attr('class', d => `tile tile__${d[0].shape}`)
                .style('grid-template-rows', d => determineGridRows(d))

            // append map artwork
            $container.append('img')
                .attr('class', 'exhibit')
                .attr('src', d => `assets/images/${d[0].tile}-0.png`)
                .style('grid-area', (d, i, n) => {
                    return `1 / 1 / ${d.length + 1} / 3`
                })

            $container.append('img')
            .attr('class', 'exhibit-top')
                .attr('src', d => `assets/images/${d[0].tile}-2.png`)
                .style('grid-area', (d, i, n) => {
                    return `1 / 1 / ${d.length + 1} / 3`
                })

            return $container
        })

        // add videos
    $tile.selectAll('.cam__display')
        .data(d => d)
        .join(enter => {
                // append placeholder images
                enter.append('img')
                    .attr('class', 'cam__display')
                    .attr('data-id', d => d.camera[0])
                    .attr('data-type', 'png')
                    .attr('data-animal', d => d.animal)
                    .attr('src',  d => `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/stills/${d.camera[0]}.png`)
                    .style('grid-area', (d, i) => findGridArea(d, i))
                    .on('click', launchModal)
                    //.style('z-index', -10)
                    //.on('click', swapSource)
            })

        resize()
        setupScroll()
}

function preloadImages(){
    const data = nestedData
    return new Promise(resolve => {
        const allImages = []

        for (let i = 0; i < data.length; ++i){
            const imgPromise = loadImage(`assets/images/${data[i].key}-0.png`)

            imgPromise.then(img => {
                img.onload(() => {
                    if (i === data.length) resolve()
    
                })

            })
            allImages.push(imgPromise)
        }

     Promise.all(allImages).then(resolve).catch(e => console.log(`Error in loading images`))
    }).catch(e => console.error(e))
}


function init(){
    loadData(['assets/data/arrangement.csv', 'assets/data/links.csv']).then(response => {
        return cleanData(response)
    })
    .then(() => preloadImages())
    .then(() => loadMaps())
}

export default { init, resize };
