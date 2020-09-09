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

function loadMaps(data){
    $section.selectAll('.tile').data(data)
        .join(enter => {
            const $container = enter.append('div').attr('class', 'tile')

            $container.append('img').attr('src', d => `assets/images/${d.key}.png`)
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