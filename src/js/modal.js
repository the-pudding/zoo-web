
const $modal = d3.select('[data-js="modal"]')
const $info = $modal.select('.modal__info')
const $videos = $modal.select('.modal__video')


function setup(islandData, linkData, animal, facility){
    $modal.classed('is-hidden', false)

    $info.select('.modal__info-animal').text(animal)
    $info.select('.modal__info-facility').text(facility)

    const theseData = linkData.filter(d => d.animal === animal && d.facility === facility)[0]
    console.log({theseData})
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

    const otherVids = islandData.filter(d => d.animal)[0].camera.filter(d => +d !== +theseData.id)
    
    $videos.select('.large').attr('src', `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/output/${theseData.id}.gif`)
    
}

function close(){
    $modal.classed('is-hidden', true)
}


export default {setup, close}