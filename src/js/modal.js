const $body = d3.select('body')
const $modal = d3.select('[data-js="modal"]')
const $info = $modal.select('.modal__info')
const $videos = $modal.select('.modal__video')

function setupA11y(){
    // when modal is open, tabbing remains within modal
    const $focusableInModal = $modal.selectAll('.modal__quit, a, img').nodes()
    const $firstFocus = $focusableInModal[0];
    const $lastFocus = $focusableInModal[$focusableInModal.length - 1]
    
    $firstFocus.focus()

    d3.select($firstFocus).on('keydown', () => {
        const open = !$modal.classed('is-hidden');
    
        if (open) {
          const pressed = d3.event.code;
          const shift = d3.event.shiftKey;
    
          if (pressed === 'Tab' && shift === true) {
            // prevent default behavior
            d3.event.preventDefault();
    
            // focus on the last element
            $lastFocus.focus();
          }
        }
      });

      d3.select($lastFocus).on('keydown', () => {
        const open = !$modal.classed('is-hidden');
        if (open) {
          const pressed = d3.event.code;
          const shift = d3.event.shiftKey;
    
          if (pressed === 'Tab' && shift === false) {
            // prevent default behavior
            d3.event.preventDefault();
    
            // focus on the last element
            $firstFocus.focus();
          }
        }
      });

      $modal.on('keydown', () => {
          const pressed = d3.event.code;
          const open = !$modal.classed('is-hidden');
          if (pressed === 'Escape' && open === true){
              // close menu 
              close()
          }
      })
      
}

function setup(islandData, linkData, animal, facility, id){

    $modal.classed('is-hidden', false)

    const theseData = linkData.filter(d => d.id === id)[0]
    const animalTitle = theseData.specific ? theseData.specific : animal
    $info.select('.modal__info-animal').text(animalTitle)
    $info.select('.modal__info-facility').text(facility)
    $info.select('.modal__info-full').text(`Go to the full live stream`)
        .attr('href', theseData.link)
        .attr('target', '_blank')
    $info.select('.modal__info-help')
    $modal.select('.facility').text(facility)
    $modal.select('.donate').attr('href', theseData.donate)
    if (theseData.adopt) {
        $modal.select('.adopt')
            .attr('href', theseData.adopt)
            .attr('target', '_blank')
            .classed('is-hidden', false)
    } else $modal.select('.adopt').classed('is-hidden', true)

 const $fact = $modal.select('.modal__info-fact')
    if (theseData.fact){
        $fact.classed('is-hidden', false)
        $fact.select('.facility').text(facility)
        $fact.select('.fact__text').text(theseData.fact)
        $fact.select('.fact__link').attr('href', theseData.learn).attr('target', '_blank')
    } else $fact.classed('is-hidden', true)

    const otherVids = islandData.filter(d => d.animal === animal)[0].camera.filter(d => +d !== +theseData.id)
    
    $videos.select('.large')
        .attr('tabindex', 0)
        .attr('src', `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/output/${theseData.id}.gif`)
        .attr('alt', d => {
            return `Image of ${animal} at ${facility}`
        })
    const $carousel = $videos.select('.modal__video--carousel')
    
    if (otherVids.length > 0){
        $carousel.classed('is-hidden', false)
        // for labelling other vids 
        const crosswalk = linkData.map(d => [+d.id, d.facility])
        const idMap = new Map(crosswalk)

        const $vidCar = $carousel.selectAll('.g-carousel')
            .data(otherVids, d => +d)
            .join(enter => {
                const $container = enter.append('div').attr('class', 'g-carousel')

                $container.append('img')
                    .attr('class', 'carousel__display')
                    .attr('tabindex', 0)
                    .attr('alt', d => {
                        return `Image of ${animal} at ${idMap.get(+d)}`
                    })
                    .on('click', (d, i, n) => {
                        d3.event.stopPropagation()
                        const $sel = d3.select(n[i])
                        const id = $sel.attr('data-id')
                        const newFacility = idMap.get(+id)
                        console.log({id})
                        setup(islandData, linkData, animal, newFacility, id)
                    })
                    

                $container
                    .append('span')
                    .attr('class', 'carousel__facility')
                
                    return $container
            })

        $vidCar.selectAll('.carousel__facility').text(d => idMap.get(+d))
        $vidCar.selectAll('img').attr('data-id', d => d).attr('src', d => `https://pudding-data-processing.s3.amazonaws.com/zoo-cams/stills/${+d}.png`)
    } else $carousel.classed('is-hidden', true)

    setupA11y()
}

function close(){
    $modal.classed('is-hidden', true)
    $body.classed('modal__open', false)
}


$modal.on('click', close)
export default {setup, close}