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

  map.on('load', () => {
    // When the map loads, add the source and layer
    map.addSource('iso', {
      type: 'geojson',
      data: {
        'type': 'FeatureCollection',
        'features': []
      }
    });

    map.addLayer(
      {
        'id': 'isoLayer',
        'type': 'fill',
        'source': 'iso',
        'layout': {},
        'paint': {
          'fill-color': '#5a3fc0',
          'fill-opacity': 0.3
        }
      },
      'poi-label'
    );
});
    map.on('load', () => {
        // This adds the data that outlines the listings
        map.addSource('listing_data', {
            type: 'geojson',
            data: 'https://raw.githubusercontent.com/chann15/GGR472_Lab3/refs/heads/main/Data/output_GPT_Testing.geojson', // Corrected URL
        });
        
        //This changes the aesthetic layout of the data, in paritucalr what size and colour, depending on thje zooming in and grouping level.
        map.addLayer({
            'id': 'listing_data',
            'type': 'circle',
            'source': 'listing_data',
            'paint': {
                'circle-radius': 5,  // Example size
                'circle-color': '#ff0000', // Example color
                'circle-opacity': 1
            }
        });

    // Initialize the marker at the query coordinates
    marker.setLngLat(lngLat).addTo(map);

    // Make the API call
    getIso();
  });