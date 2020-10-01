import loadData from './load-data'

const $globes = d3.selectAll('.globe')
const $svg = $globes.selectAll('svg')

let projection = d3.geoOrthographic();
const path = d3.geoPath(projection)//.projection(projection);
const TILT = 20;
const OUTLINE = {type: 'Sphere'};
const DURATION = 1000
let $map = null
let geo = null

let markerData = null

let p1 = [0, 0];
let p2 = [0, 0];
let r1 = [0, 0, 0];
let r2 = [0, 0, 0];

// rotate map functions

function interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    (a2 -= a1), (b2 -= b1), (c2 -= c1), (d2 -= d1);
    const x = new Array(4);
    return (t) => {
      const l = Math.hypot(
          (x[0] = a1 + a2 * t),
          (x[1] = b1 + b2 * t),
          (x[2] = c1 + c2 * t),
          (x[3] = d1 + d2 * t)
      );
      (x[0] /= l), (x[1] /= l), (x[2] /= l), (x[3] /= l);
      return x;
    };
  }

  function interpolate([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    let dot = a1 * a2 + b1 * b2 + c1 * c2 + d1 * d2;
    if (dot < 0) (a2 = -a2), (b2 = -b2), (c2 = -c2), (d2 = -d2), (dot = -dot);
    if (dot > 0.9995) {
      return interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]);
    }
    const theta0 = Math.acos(Math.max(-1, Math.min(1, dot)));
    const x = new Array(4);
    const l = Math.hypot(
        (a2 -= a1 * dot),
        (b2 -= b1 * dot),
        (c2 -= c1 * dot),
        (d2 -= d1 * dot)
    );
    (a2 /= l), (b2 /= l), (c2 /= l), (d2 /= l);
    return (t) => {
      const theta = theta0 * t;
      const s = Math.sin(theta);
      const c = Math.cos(theta);
      x[0] = a1 * c + a2 * s;
      x[1] = b1 * c + b2 * s;
      x[2] = c1 * c + c2 * s;
      x[3] = d1 * c + d2 * s;
      return x;
    };
  }

  function fromAngles([l, p, g]) {
    l *= Math.PI / 360;
    p *= Math.PI / 360;
    g *= Math.PI / 360;
    const sl = Math.sin(l);
    const cl = Math.cos(l);
    const sp = Math.sin(p);
    const cp = Math.cos(p);
    const sg = Math.sin(g);
    const cg = Math.cos(g);
    return [
      cl * cp * cg + sl * sp * sg,
      sl * cp * cg - cl * sp * sg,
      cl * sp * cg + sl * cp * sg,
      cl * cp * sg - sl * sp * cg,
    ];
  }

  function toAngles([a, b, c, d]) {
    return [
      (Math.atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * 180) /
        Math.PI,
      (Math.asin(Math.max(-1, Math.min(1, 2 * (a * c - d * b)))) * 180) /
        Math.PI,
      (Math.atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * 180) /
        Math.PI,
    ];
  }

  function interpolateAngles(a, b) {
    const i = interpolate(fromAngles(a), fromAngles(b));
    return (t) => toAngles(i(t));
  }

function update(lat, long){
    const matched = geo.features.filter( e => e.properties.iso_a2 === 'US')[0]
    console.log({matched})

    p1 = p2
    p2 = projection([lat, long])
    r1 = r2;
    r2 = [-p2[0], TILT - p2[1], 0];
    const iv = interpolateAngles(r1, r2);

    console.log({p1, p2, r1, r2, iv, matched})
    const countryPaths = $map.selectAll('.path-country');

    d3.transition()
      .duration(DURATION)
      .tween('render', () => (t) => {
        projection.rotate(iv(t));
       countryPaths.attr('d', path)

       $svg.selectAll('.marker')
       .attr('cx', d => projection([d.long, d.lat])[0])
      .attr('cy', d => projection([d.long, d.lat])[1])
      .attr('fill', d => {
        const coordinate = [d.long, d.lat]
        const gDistance = d3.geoDistance(coordinate, projection.invert([70, 70]))
        return gDistance > 1.57 ? 'none' : 'steelblue'
      })
      })

}

function drawMarkers(markers){
  const circles = $svg.selectAll('.marker')
    .data(markers)
    .join(enter => enter.append('circle')
      .attr('class', 'marker')  
      .attr('r', 15)
    )
}

function resize(){}

function setupMap(geojson){

    // setup map group
    $map = $svg.append('g').attr('class', 'g-map');
    $map.append('path').attr('class', 'path-sphere');
    $map.append('g').attr('class', 'g-countries');

    const width = 150
    const height = 150

    // draw map
    projection
        .fitExtent([[10, 10], [width - 10, height - 10]], geojson)
        .center([0, 0])
        .rotate([0, -30]);

    // size globe border
    $map
        .select('.path-sphere')
        .attr('d', path(OUTLINE))
        .style('fill', 'white')
        .style('stroke-width', '1px')
        .lower();

    const countryPaths = $map.select('.g-countries').selectAll('.path-country')
        .data(geojson.features)
        .join(enter => enter.append('path').attr('class', d => `path-country country-${d.properties.iso_a2}`))

      countryPaths.attr('d', path)

    geo = geojson;
}


function init(markers){
  markerData = markers
    loadData('custom.geojson')
        .then(result => setupMap(result))
        .then(() => drawMarkers(markers))
}



export default {init, update, resize}