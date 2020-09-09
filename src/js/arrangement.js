import loadData from './load-data'

const $section = d3.selectAll('[data-js="arrangement"]')

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
    $section.selectAll('.map').data(data)
        .join(enter => {
            const $container = enter.append('div').attr('class', 'map')

            $container.append('img').attr('src', d => `assets/images/${d.key}.png`)
        })
}

function init(){
    loadData('assets/data/arrangement.csv').then(response => {
        const data = cleanData(response)
        console.log(data)
        loadMaps(data)
    })
}

export default init