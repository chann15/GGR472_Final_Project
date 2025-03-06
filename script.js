mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhbm5pNDIiLCJhIjoiY201cjdmdmJxMDdodTJycHc2a3ExMnVqaiJ9.qKDYRE5K3C9f05Cj_JNbWA'; // Add default public map token from your Mapbox account

const map = new mapboxgl.Map({
    container: 'my-map', // container id
    style: 'mapbox://styles/mapbox/streets-v12', // stylesheet
    center: [-79.3832, 43.6532],
    zoom: 11.5 // starting zoom
  });

  // Target the params form in the HTML
  const params = document.getElementById('params');

  // Create variables to use in getIso()
  const urlBase = 'https://api.mapbox.com/isochrone/v1/mapbox/';
  const lon = -79.3832;
  const lat = 43.6532;
  let profile = 'cycling';
  let minutes = 10;

  // Set up a marker that you can use to show the query's coordinates
  const marker = new mapboxgl.Marker({
    'color': '#314ccd'
  });

  // Create a LngLat object to use in the marker initialization
  // https://docs.mapbox.com/mapbox-gl-js/api/#lnglat
  const lngLat = {
    lon: lon,
    lat: lat
  };

  // Create a function that sets up the Isochrone API query then makes a fetch call
  async function getIso() {
    const query = await fetch(
      `${urlBase}${profile}/${lon},${lat}?contours_minutes=${minutes}&polygons=true&access_token=${mapboxgl.accessToken}`,
      { method: 'GET' }
    );
    const data = await query.json();
    // Set the 'iso' source's data to what's returned by the API query
    map.getSource('iso').setData(data);
  }

  // When a user changes the value of profile or duration by clicking a button, change the parameter's value and make the API query again
  params.addEventListener('change', (event) => {
    if (event.target.name === 'profile') {
      profile = event.target.value;
    } else if (event.target.name === 'duration') {
      minutes = event.target.value;
    }
    getIso();
  });

 
let listing_data;

fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/refs/heads/main/Data/Whole_dataset_reformated.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response); //Check response in console
        listing_data = response; // Store geojson as variable using URL from fetch response
    });




    map.on('load', () => {
        //console.log(listing_data.features[0]);
        console.log(turf.booleanContains(listing_data.features[0], iso_data));
    });


const listing_data_library = {
    "type": "FeatureCollection",
    "features": 'listing_data',
    };
const iso_data = {
    "type": "FeatureCollection",
    "features": 'iso',
};