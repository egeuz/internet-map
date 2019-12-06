/**** ELEMENTS ****/
const input = document.querySelector("#input-container input")
const submit = document.querySelector("#input-container button")
const errorBox = document.querySelector("#error-box") 
const errorText = document.querySelector("#error-text")
const errorClose = document.querySelector("#error-close")

/**** MAP SETUP ****/
mapboxgl.accessToken = 'pk.eyJ1IjoiZWdlLXV6IiwiYSI6ImNrM3B5MHYwcDA4ODgzY3BlY2w1dmxibnAifQ.72RzO73y6pFhydrEpPQ4UQ';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/ege-uz/ck3tp15x42hz61cpazcqcoo9g',
  center: [0, 25],
  zoom: 2
})

const geojson = {
  type: 'FeatureCollection',
  features: []
}

/**** RUNTIME ****/
document.addEventListener("DOMContentLoaded", () => {
  loadMapData() //load existing map content
  submit.addEventListener("click", handleSubmit)
  document.addEventListener("keyup", handleSubmit)
  errorClose.addEventListener("click", closeErrorModal)
  document.addEventListener("click", closeErrorModal)
})

/**** EVENT METHODS ****/
async function loadMapData() {
  const locations = await axios.get('/all-queries')
  geojson.features = locations.data.map(location => createMapMarker(location))
  renderMapPoints()
}

async function handleSubmit(event) {
  if (validateSubmit(event) && input.value) {
    const url = sanitizeURL(input.value)
    const location = await axios.post('/new-query', { url })
    map.flyTo({
      center: [location.data.longitude, location.data.latitude],
      zoom: 15
    })
    geojson.features.push(createMapMarker(location.data))
    renderMapPoints()
  } else if (event.key !== 'Backspace' && !input.value) {
    errorBox.classList.add("visible")
    errorText.innerHTML = "<strong>ERROR:</strong> Please specify a valid URL!"
  }
} 

function createMapMarker(data) {

  const { url, visitCount, city, state, country, latitude, longitude } = data

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [longitude, latitude]
    },
    properties: {
      name: url.slice(0, -4),
      url,
      visitCount,
      city,
      state: state !== city ? state : '',
      country
    }
  }
}

function renderMapPoints() {
  geojson.features.forEach(feature => {

    const {name, url, visitCount, city, state, country} = feature.properties

    let element = document.createElement('div')
    element.className = `marker ${name}`
    let popupContent = 
    `<div class="marker-content">
      <p class="title">${url}</p>
      <p class="location">${city}, ${state ? state + ", " : ""} ${country}</p>
      <p class="visit-count">Visited ${visitCount} times</p>
    </div>`

    new mapboxgl.Marker(element)
      .setLngLat(feature.geometry.coordinates)
      .setPopup(new mapboxgl.Popup({ offset: 25 })
        .setHTML(popupContent))
      .addTo(map)
  })
}

/**** ERROR HANDLING ****/
function closeErrorModal(event) {
  event.preventDefault()
  if(errorBox.classList.contains("visible")) errorBox.classList.remove("visible")
}

const sanitizeURL = url =>
  url.indexOf('/') > -1 ?
    url.slice(8, url.slice(8).indexOf('/') + 8) :
    url

const validateSubmit = e =>
  e.type === 'click' || (e.type === 'keyup' && e.key === 'Enter')
