import loadData from './load-data'

const $section = d3.selectAll('[data-js="arrangement"]')

const HOLE_OFFSET = 100
const BREAKPOINT = 900


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

function findGridArea(cam){
    // if on the right, column 2, otherwise 1
   
    const column = cam.positionX === 'R' ? 2 : 1 
    console.log({cam, pos: `${cam.positionY} / ${column} / span 1 / span 1 `})
    return `${cam.positionY} / ${column} / span 1 / span 1 `
}

function loadMaps(data){
    const $tile = $section.selectAll('.tile').data(data)
        .join(enter => {      
            // setup grid
            // anywhere between 2 and 5 rows

            const $container = enter.append('div')
                .attr('class', 'tile')
                .style('grid-template-rows', d => {
                const fullLayout = `repeat(${d.values.length}, 1fr)`
                console.log({fullLayout})
                return fullLayout
            })


            // append map artwork
            $container.append('img').attr('src', d => `assets/images/${d.key}.png`).attr('class', 'exhibit').style('grid-area', d => {
                const layout = `1 / 1 / span 2 / span ${d.values.length}`
                console.log({layout})
                return layout
            })

            // const $camCont = $container.append('div').attr('class', 'cam__container')
      

            return $container
        })

        $tile.selectAll('.cam__display').data(d => {
            console.log({val: d.values})
            return d.values}).join(enter => {
            
            // append placeholder images
            enter.append('img')
            .attr('class', 'cam__display')
            .attr('data-id', d => d.id).attr('data-type', 'png')
            .attr('src',  d => `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/stills/${d.camera[0]}.png`)
            .style('grid-area', d => findGridArea(d))
            .style('z-index', -10)
        })

        // if (window.innerWidth >= BREAKPOINT) {
        //     $section.selectAll('.tile:nth-child(even)').style('transform', `translate(0, ${HOLE_OFFSET}px)`)
        //    // $section.selectAll('.tile:nth-child(odd)').style('margin-top', `${-HOLE_OFFSET }px`)
        // } else {
        //     $section.selectAll('.tile').style('transform', 'translate(0, 0)')
        // }
}


function init(){
    loadData('assets/data/arrangement.csv').then(response => {
        const data = cleanData(response)
        console.log(data)
        loadMaps(data)
    })
}

export default init