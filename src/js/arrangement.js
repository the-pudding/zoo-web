import loadData from './load-data'
import loadImage from './utils/load-image-promise'
import 'intersection-observer'
import scrollama from 'scrollama'
import findUnique from './utils/unique';
import videoSVG from './videoSVG'
import modal from './modal'
import globe from './globe'
import { reject } from 'promise-polyfill';

const $body = d3.select('body')
const $section = $body.selectAll('[data-js="arrangement"]')
const $islands = $section.selectAll('[data-js="arrangement__islands"]')
const $mobileNav = d3.selectAll('[data-js="navigation"]')
const $mobileAnimals = $mobileNav.select('.animal')
const $update = d3.select('.update')
const heights = []

let linkData = null
let mappedData = null
let nestedData = null

let idToFacilityMap = null

let TOTAL_ISLANDS = 16


const HOLE_OFFSET = 100
const BREAKPOINT = 848
let MOBILE = false
let MOBILE_SETUP = false
let DESKTOP_SETUP = false
const EXHIBIT_WIDTH = 1228
const MAX_ISLAND_WIDTH = 1200
const TOP_GAP = {
    1: '21.2%',
    2: '16.7%',
    3: '11.7%',
    4: '9.02%',
    5: '7.33%'
}
const MIDDLE_GAP = {
    1: '48.4%',
    2: '18.65%',
    3: '13.1%',
    4: '10.1%',
    5: '8.2%'
}

const scroller = scrollama()
const habitatScroller = scrollama()

function swapSource(el){
    const $sel = d3.select(el)//d3.select(this)
    const id = $sel.attr('data-id')
    const type = $sel.attr('data-type')
  
    if (type === 'png'){
      $sel.attr('src', `https://pudding.cool/2020/11/zoo-data/output/${id}.gif`)
      $sel.attr('data-type', 'gif')
    }
  
    else {
      $sel.attr('src', `https://pudding.cool/2020/11/zoo-data/stills/${id}.png`)
      $sel.attr('data-type', 'png')
    }


  
  }

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function highlightList(element){
     const all = $section.selectAll('.g-anno')
     
     all.classed('in-focus', false)

     const animal = d3.select(element).attr('data-animal')

     const $anno = $section.selectAll(`[data-list="${animal}"]`).classed('in-focus', true)

     const $list = $anno.selectAll('li')

    //  if ($list.size() > 1){
    //     for (const li in $list){
    //         console.log({li})
    //         sleep(500).then(() => console.log({slept: li}))
    //     }
    //  }

     
}

function setupHabitatScroll(){
    habitatScroller 
        .setup({
            step: '.g-island',
            offset: 0.8,
            debug: false
        })
        .onStepEnter(response => {
            const {element, index, direction} = response
            const $el = d3.select(element)
            

            if (index === TOTAL_ISLANDS){
                $section.selectAll('.clouds__base, .globe').classed('is-hidden', false)
            }
        })
        .onStepExit(response => {
            const {element, index, direction} = response 
            if (index === TOTAL_ISLANDS && direction === 'down') {
                $section.selectAll('.clouds__base, .globe').classed('is-hidden', true)
                // $globe.classed('is-hidden', true)
            }
        })
}

function setupScroll(){
    scroller 
        .setup({
            step: '.cam__display',
            debug: false
        })
        .onStepEnter(response => {
            const {element, index, direction} = response

            const first = index === 0 && direction === 'down'
    
            // stop anything else playing 
            if (first === false){
                const playing = $islands.select('[data-type="gif"]')
                if (playing){
                    swapSource(playing.node())
                    playing.classed('in-focus', false)
                }
            }

            swapSource(element)
            $section.selectAll('.cam__display').classed('in-focus', false)
            const $el = d3.select(element)
            $el.classed('in-focus', true)
            highlightList(element)

            // update globe 
            const elData = $el.data()[0]
            const {lat, long} = elData
            globe.update(+lat, +long)

            if (MOBILE) {
                $mobileAnimals.selectAll('.g-anno').classed('is-hidden', true)
                const animal = d3.select(element).attr('data-animal')
                const $ul = $mobileAnimals.selectAll('.g-anno')
                    .filter((d, i, n) => {
                        return d3.select(n[i]).attr('data-list') === animal
                    })
                
                //.selectAll(`[data-animal="${animal}"]`)
                $ul.classed('is-hidden', false)
    
                $ul.node().scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                })
            }
        })
        .onStepExit(response => {
            const {element, index, direction} = response 

            if (index === 1 && direction === 'up'){
                // if beluga and scrolling up, re-highlight the polar bear
                const $el = d3.select(element)
                $el.classed('in-focus', false)
                swapSource(element)

                const pb = d3.selectAll('.cam__display').filter((d, i, n) => {
                    return d3.select(n[i]).attr('data-animal') === 'polar bear'
                })

                swapSource(pb.node())
                pb.classed('in-focus', true)
                highlightList(pb.node())
                
            }
        })
}

function findFirst(arr, facMap){
    const split = arr.split(', ')
    const facilities = split.map(d => ({
        id: d,
        facility: facMap.get(d)
    }))
        .sort((a, b) => d3.ascending(a.facility, b.facility))

    const first = facilities[0].id
    return first

}

function cleanData(dat){
    return new Promise((resolve) => {
        linkData = dat[1]
         idToFacilityMap = new Map(linkData.map(d => [d.id, d.facility]))

        mappedData =  dat[0].map((d) => ({
            ...d,
            index: +d.index,
            positionY: +d.positionY,
            camera: d.camera.split(', '),
            first: findFirst(d.camera, idToFacilityMap)
        }))

        nestedData = d3.nest()
        .key(d => d.tile)
        .entries(mappedData)

        // const uniqueHeights = findUnique(mappedData.map(d => d.imHeight))
        // uniqueHeights.forEach(h => {
        //     heights[h] = findNewHeight(h)
        // })
    
        resolve ({mappedData, nestedData, links: dat[1]})
    })

}


function launchModal($sel){
    console.log('launchModal ran')
    //const $sel = d3.select(this)
    const animal = $sel.attr('data-animal')
    const id = $sel.attr('data-id')

    const group  = $section.selectAll(`[data-list="${animal}"]`)
    const facility = group.select('.animal--facility.selected').attr('data-facility')
    // const label = d3.select(parent).select('label')//.innerText//.innerText.trim()
    // const facility = label.innerText
    // console.log({facility, parent, label})
    $body.classed('modal__open', true)

    modal.setup(mappedData, linkData, animal, facility, id)
}



function findGridArea(cam, i){
    // if on the right, column 2, otherwise 1
    const index = cam.index
    
    const row =  cam.positionY * 2
    const column = cam.positionX === 'R' ? 2 : 1 

    if (index % 2 === 0) return `${row} / ${column + 1} / span 1 / span 1`
    else if (index === 1) return `${row} / ${column + 1} / span 1 / span 1`
    else return `${row} / ${column} / span 1 / span 1 `
}


function resize(){
    console.log('resize ran')
    MOBILE = window.innerWidth < BREAKPOINT

    const $exhibits = $islands.selectAll('.exhibit')
    $exhibits.nodes().forEach(ex => {
        const tile = d3.select(ex).attr('data-tile')
        const h = ex.offsetHeight
        heights[tile] = h 
    })
    
    $islands.selectAll('.tile, .annotation--desktop')
        .style('height', d => `${heights[d[0].tile]}px`)


    setupNav()
}

function setupFacilities(group){
    group.selectAll('fieldset')
    .selectAll('.animal--facility')
    .data(d => {
        const animal = d.animal 
        const facilities = linkData.filter(e => e.animal === animal).map(e => ({
            ...e,
            tile: d.tile,
            positionX: d.positionX
        })).sort((a, b) => d3.ascending(a.facility, b.facility))
        return facilities
    })
    .join(enter => {
        const $wrapper = enter.append('div')
            .attr('class', 'wrapper')


            // .html(d => `<span class='facility--name'>${d.facility}</span> `)

        const $radio = $wrapper.append('input')
            .attr('type', 'radio')
            .attr('value', d => d.id)
            .attr('class', 'animal--facility')
            .attr('id', (d) => `facility--${d.id}`)
            .attr('data-facility', (d) => d.facility)
            .attr('data-id', d => d.id)
            .attr('data-animal', d => d.animal)
            .attr('data-tile', d => d.tile)
            .attr('tabindex', (d, i) => i === 0 ? 0 : -1)
            .property('checked', d => {
                const thisCam = $section.select(`[data-exhibit="${d.tile}"]`)
                    .selectAll('.cam__display')
                    .filter((e, i, n) => {
                        return d3.select(n[i]).attr('data-animal') === d.animal
                    })

                const displayed = thisCam.attr('data-id')

                return d.id === displayed
            })
            .classed('selected', d => {
                const thisCam = $section.select(`[data-exhibit="${d.tile}"]`)
                    .selectAll('.cam__display')
                    .filter((e, i, n) => {
                        return d3.select(n[i]).attr('data-animal') === d.animal
                    })

                const displayed = thisCam.attr('data-id')

                return d.id === displayed ? 'checked' : ''
            })
            .on('click', switchFacility)

            $radio.select('.video--icon').classed('is-hidden', d => {
                const thisCam = $section.select(`[data-exhibit="${d.tile}"]`)
                    .selectAll('.cam__display')
                    .filter((e, i, n) => {
                        return d3.select(n[i]).attr('data-animal') === d.animal
                    })
                const displayed = thisCam.attr('data-id')

                return d.id !== displayed
            })

                const $label = $wrapper.append('label')
            .attr('for', (d) => `facility--${d.id}`)
            .text(d => d.facility)
    })
}

function setupNav(){
    let $g = null

    // if on mobile and mobile nav isn't already setup
    if (MOBILE === true && MOBILE_SETUP === false){ 
        MOBILE_SETUP = true
        $g = $mobileAnimals.selectAll('.g-anno')
            .data(mappedData)
            .join(enter => {
            const $container = enter.append('div').attr('class', 'g-anno')
                .attr('data-list', d => d.animal)
                // .style('transform', d => {
                //     const val = d.positionX === 'L' ? 0 : '60%'
                //     return `translateX(${val})`
                // })
                // .style('left', d => d.positionX === 'L' ? 0 : '40%')
                .style('align-self', d => d.positionX === 'L' ? 'flex-start' : 'flex-end')

            $container.append('h3').attr('class', 'animal--name')
                .text(d => d.animal)
                .attr('data-animal', d => d.animal)
                .attr('data-id', d => d.id)
                .style('text-align', d => d.positionX === 'L' ? 'left' : 'right')
                .on('click', (d, i, n) => launchModal(d3.select(n[i])))

            const $fs = $container.append('fieldset').attr('class', 'animal--list')
                .attr('data-animal', d => d.animal)
                .attr('tabindex', 0)

                $fs.append('legend').text(d => `Facilities with a ${d.animal} live stream`).attr('class', 'sr-only')

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
            .style('height', (d) => `${heights[d[0].tile]}px`)

        $g = $annoD.selectAll('.g-anno')
            .data(d => d)
            .join(enter => {
                const g = enter.append('div').attr('class', 'g-anno').attr('data-list', d => d.animal)

                g.append('h3').attr('class', 'animal--name')
                    .text(d => {
                        if (d.display) return d.display 
                        else return d.animal
                    })
                    .attr('data-animal', d => d.animal)
                    .attr('data-id', d => d.camera[0])
                    .on('click', (d, i, n) => launchModal(d3.select(n[i])))
                
                const $fs = g.append('fieldset').attr('class', 'animal--list').attr('data-animal', d => d.animal).attr('tabindex', 0)
                $fs.append('legend').text(d => `Facilities with a ${d.animal} live stream`).attr('class', 'sr-only')

                return g
            })
            .style('grid-area', (d, i) => {
                return `${(d.positionY) * 2} / 1 / span 1 / span 1 `})

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
        $li = $mobileAnimals.selectAll('fieldset').filter((d, i, n) => {
            return d3.select(n[i]).attr('data-animal') === animal
        }).selectAll('input')
    } else {
       $li = $exhib.selectAll('fieldset').filter((d, i, n) => {
        return d3.select(n[i]).attr('data-animal') === animal
    }).selectAll('input') 
    }
    
    $li.property('checked', false)
    
    $li.selectAll('.video--icon').classed('is-hidden', true)

    sel.property('checked', true)
    sel.select('.video--icon').classed('is-hidden', false)

    // find which display to switch
    const match = $exhib.selectAll('.cam__display').filter((d, i, n) => {
        return d3.select(n[i]).attr('data-animal') === animal
    })

    const type = match.attr('data-type')


    if (type === 'png'){
        match.attr('src', `https://pudding.cool/2020/11/zoo-data/stills/${cam}.png`)
        .attr('data-id', cam)
        .attr('alt', d => {
            console.log({test: d})
            return `Still image of ${animal} at ${idToFacilityMap.get(cam)}`})
      }
    
      else {
        match.attr('src', `https://pudding.cool/2020/11/zoo-data/output/${cam}.gif`)
        .attr('data-id', cam)
        .attr('alt', d => {
            console.log({test: d})
            return `Video clip of ${animal} at ${idToFacilityMap.get(cam)}`})
      }

}

function determineGridRows(d){

    const last = +d[0].shape.split('')[1]
    const top = TOP_GAP[last]
    const middle = MIDDLE_GAP[last]
    let final = null 
    if (last === 1) final = `${top} 1fr ${middle}`
    else final = `${top} repeat(${last - 1}, minmax(0, 1fr) ${middle}) minmax(0, 1fr) ${top}`
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
                .style('order', (d, i) => i === 0 ? 0 : i + 1)
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
                .style('grid-template-rows', (d, i) => determineGridRows(d))

            // append map artwork
            $container.append('img')
                .attr('class', 'exhibit')
                .attr('src', d => `assets/images/${d[0].tile}-0.PNG`)
                .attr('data-tile', d => d[0].tile)
                .attr('aria-hidden', true)
                .style('grid-area', (d, i, n) => {
                    const exhibitIndex = d[0].index 
                    if (exhibitIndex % 2 === 0 && !MOBILE) return `1 / 2 / ${d.length + 1} / 4`
                    else if (exhibitIndex === 1 && !MOBILE) return `1 / 2 / ${d.length + 1} / 4`
                    else return `1 / 1 / ${d.length + 1} / 3`
                })


            const $exhibits = $container.selectAll('.exhibit')
            $exhibits.nodes().forEach(ex => {
                const tile = d3.select(ex).attr('data-tile')
                const h = ex.offsetHeight
                heights[tile] = h 
            })

            $container.append('img')
            .attr('class', 'exhibit-top')
                .attr('src', d => `assets/images/${d[0].tile}-2.PNG`)
                .attr('aria-hidden', true)
                .style('grid-area', (d, i, n) => {
                    const exhibitIndex = d[0].index 
                    if (exhibitIndex % 2 === 0 && !MOBILE) return `1 / 2 / ${d.length + 1} / 4`
                    else if (exhibitIndex === 1 && !MOBILE) return `1 / 2 / ${d.length + 1} / 4`
                    else return `1 / 1 / ${d.length + 1} / 3`
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
                    .attr('data-id', d => d.first)
                    .attr('data-type', 'png')
                    .attr('data-animal', d => d.animal)
                    .attr('tabindex', 0)
                    .attr('alt', d => {
                        return `Video clip of ${d.animal} at ${idToFacilityMap.get(d.first)}`})
                    .style('justify-self', d => d.positionX === 'R' ? 'start' : 'end')
                    .style('margin-right', d => d.positionX === 'R' ? 0 : `-4%`)
                    .style('margin-left', d => {
                        const right = d.positionX === 'R' ? `-4%` : 0
                        const polarBear = d.tile === 'polar' ? `-40%` : right
                        return polarBear
                    })
                    .attr('src',  d => `https://pudding.cool/2020/11/zoo-data/stills/${d.first}.png`)
                    .style('grid-area', (d, i) => findGridArea(d, i))
                    .on('click', (d, i, n) => launchModal(d3.select(n[i])))
                    .on('keydown', (d, i, n) => {
                        const pressed = d3.event.code;
                        if (pressed === 'Enter') {
                            launchModal(d3.select(n[i]))
                        }
                    })
                    //.style('z-index', -10)
                    //.on('click', swapSource)
            })


}

function preloadImages(){
    const data = nestedData
    return new Promise(resolve => {
        const allImages = []

        for (let i = 0; i < data.length; ++i){
            const imgPromise = loadImage(`assets/images/${data[i].key}-0.PNG`)

            imgPromise.then(img => {
                img.onload(() => {
                    if (i === data.length) resolve()
    
                })

            })
            allImages.push(imgPromise)
        }

     Promise.all(allImages).then(resolve).catch(e => console.log(`Error in loading images`))
    }).catch(e => console.error(`Error with preload ${e}`))
}


function setupTimestamps(){
    d3.json(`https://pudding.cool/2020/11/zoo-data/timestamps.json`)
        .then(result => {
            const timestampData = result.map(d => ({
                ...d,
                id: +d.id,
                timestamp: +d.timestamp
            }))
                .sort((a, b) => d3.descending(a.timestamp, b.timestamp))
                .shift()
            
            const currentTime = Date.now() 

            const elapsed = d3.timeMinute.count(timestampData.timestamp, currentTime)


            $update.text(() => {
                if (elapsed < 60) return `~${elapsed} minutes ago`
             else return `~${d3.timeHour.count(timestampData.timestamp, currentTime)} hours ago`
            })
        
        })
            .catch(new Error("Couldn't load timestamp data"));

      

}

function loadAssets(){
    return new Promise((resolve, reject) => {
        try {
           loadMaps()
            setupTimestamps()

            globe.init(mappedData) 
            resolve()
        } catch (error){
            reject(error)
        }
})
}

function setupScrolls(){
    return new Promise((resolve, reject) => {
        try {
            setupScroll()
            setupHabitatScroll()
            resize()
            resolve()
        } catch (error){
            reject(error)
        }
          
    })
  
}

function init(){
    loadData(['assets/data/arrangement.csv', 'assets/data/links.csv']).then(response => {
        return cleanData(response)
    })
    .then(() => preloadImages())
    .then(() => loadAssets())
    .then(() => setupScrolls())
}

export default { init, resize };
