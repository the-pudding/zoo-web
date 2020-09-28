import loadData from './load-data'
import loadImage from './utils/load-image-promise'
import 'intersection-observer'
import scrollama from 'scrollama'
import findUnique from './utils/unique';
import videoSVG from './videoSVG'

const $section = d3.selectAll('[data-js="arrangement"]')
const $islands = $section.selectAll('[data-js="arrangement__islands"]')
const $desktopAnno = d3.selectAll('[data-js="arrangement__annotation--desktop"]')
const $mobileAnno = d3.selectAll('[data-js="arrangement__annotation--mobile]')


const HOLE_OFFSET = 100
const BREAKPOINT = 900
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
        })
        .onStepExit(response => {
            const {element, index, direction} = response
            swapSource(element)
            d3.select(element).classed('in-focus', false)
        })
}

function cleanData(dat){
    return new Promise((resolve) => {
        const mapped =  dat[0].map((d) => ({
            ...d,
            index: +d.index,
            positionY: +d.positionY,
            camera: d.camera.split(', ')
        }))

        const nested = d3.nest()
        .key(d => d.tile)
        .entries(mapped)
    
        resolve ({mapped, nested, links: dat[1]})
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
    console.log({width, win: window.innerWidth})
    return origHeight * width / EXHIBIT_WIDTH
}

function resize(){

    $islands.selectAll('.tile, .annotation--desktop')
        .style('height', d => {
            const newHeight = `${findNewHeight(d[0].imHeight)}px`
            return newHeight
        })
}

function switchFacility(){
    const sel = d3.select(this)
    const cam = sel.attr('data-id')
    const animal = sel.attr('data-animal')
    const exhibit = sel.attr('data-tile')

    const $exhib = $section.select(`[data-exhibit="${exhibit}"]`)

    // set low opacity for non-selected
    const $li = $exhib.selectAll('ul').filter((d, i, n) => {
        return d3.select(n[i]).attr('data-animal') === animal
    }).selectAll('.video--icon').classed('is-hidden', true)

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

function loadMaps(data, links){
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

            console.log({gridRows})

            // append map artwork
            $container.append('img')
                .attr('class', 'exhibit')
                .attr('src', d => `assets/images/${d[0].tile}.png`)
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
                    //.style('z-index', -10)
                    //.on('click', swapSource)
            })

    // add annotations for desktop
    const $annoD = $group.selectAll('.annotation--desktop')
            .data(d => [d.values])
            .join(enter => enter.append('div').attr('class', 'annotation--desktop'))
            .style('grid-template-rows', d => determineGridRows(d))

    const $g = $annoD.selectAll('.g-anno')
            .data(d => d)
            .join(enter => {
                const g = enter.append('div').attr('class', 'g-anno')

                g.append('h3').attr('class', 'animal--name').text(d => d.animal)
                
                g.append('ul').attr('class', 'animal--list').attr('data-animal', d => d.animal)

                return g
            })
            .style('grid-area', (d, i) => `${(i + 1) * 2} / 1 / span 1 / span 1 `)

    // add facility names
    const $list = $g.selectAll('.animal--list')

    $list.selectAll('animal--facility').data(d => {
        const animal = d.animal 
        const facilities = links.filter(e => e.animal === animal).map(e => ({
            ...e,
            tile: d.tile 
        }))
        console.log({d, facilities})//.map(e => {return {animal: d.animal, id: e.id, facility: e.facility}})
        return facilities
    }).join(enter => {
        const $li = enter.append('li')
            .attr('class', 'animal--facility')
            .html(d => `${d.facility} <span class='video--icon'>${videoSVG}</span>`)
            .attr('data-id', d => d.id)
            .attr('data-animal', d => d.animal)
            .attr('data-tile', d => d.tile)
            // .style('opacity', d => {
            //     const thisCam = $section.select(`[data-exhibit="${d.tile}"]`)
            //         .selectAll('.cam__display')
            //         .filter((e, i, n) => {
            //             return d3.select(n[i]).attr('data-animal') === d.animal
            //         })
            //     const displayed = thisCam.attr('data-id')

            //     return d.id === displayed ? 1 : 0.4
            // })
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

       } )

    // $g.selectAll('.animal--name')
    //     .data(d => [d])
    //     .join(enter => {
    //         enter.append('h3')
    //             .attr('class', 'animal--name')
    //             .text(d => d.animal)
                
    //     })


        

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
    loadData(['assets/data/arrangement.csv', 'assets/data/links.csv']).then(response => {
        return cleanData(response)
    })
    .then(({mapped, nested, links}) => {
        preloadImages(nested)
        return {mapped, nested, links}
    })
    .then(({mapped, nested, links}) => {
        console.log({mapped, nested, links})
        //setupNav(mapped)
        loadMaps(nested, links)
    })
}

export default { init, resize };
