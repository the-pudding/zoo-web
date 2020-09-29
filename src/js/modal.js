
const $modal = d3.select('[data-js="modal"]')
const $info = $modal.select('.modal__info')
const $videos = $modal.select('.modal__video')


function setup(islandData, linkData, animal, facility){
    $modal.classed('is-hidden', false)

    $info.select('.modal__info-animal').text(animal)
    $info.select('.modal__info-facility').text(facility)

    const theseData = linkData.filter(d => d.animal === animal && d.facility === facility)[0]
   
    $info.select('.modal__info-help')
    $modal.select('.facility').text(facility)
    $modal.select('.donate').attr('href', theseData.donate)
    if (theseData.adopt) {
        $modal.select('.adopt')
            .attr('href', theseData.adopt)
            .classed('is-hidden', false)
    } else $modal.select('.adopt').classed('is-hidden', true)

    const $fact = $modal.select('.modal__info-fact')
    $fact.select('.facility').text(facility)
    $fact.select('.fact__text').text(theseData.fact)
    $fact.select('.fact__link').attr('href', theseData.learn)

    const otherVids = islandData.filter(d => d.animal === animal)[0].camera.filter(d => +d !== +theseData.id)
    
    $videos.select('.large').attr('src', `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/output/${theseData.id}.gif`)
    const $carousel = $videos.select('.modal__video--carousel')
    
    if (otherVids.length > 0){
        // for labelling other vids 
        const crosswalk = linkData.map(d => [+d.id, d.facility])
        const idMap = new Map(crosswalk)

        const $vidCar = $carousel.selectAll('.g-carousel')
            .data(otherVids, d => d)
            .join(enter => {
                const $container = enter.append('div').attr('class', 'g-carousel')

                $container.append('img')
                    .attr('class', 'carousel__display')
                    .attr('data-id', d => d)
                    .on('click', (d, i, n) => {
                        const $sel = d3.select(n[i])
                        const id = $sel.attr('data-id')
                        const newFacility = idMap.get(+id)
                        setup(islandData, linkData, animal, newFacility)
                    })

                $container
                    .append('span')
                    .attr('class', 'carousel__facility')
                
                    return $container
            })

        $vidCar.selectAll('.carousel__facility').text(d => idMap.get(+d))
        $vidCar.selectAll('img').attr('src', d => `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/stills/${+d}.png`)
    }
}

function close(){
    $modal.classed('is-hidden', true)
}


export default {setup, close}