mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhbm5pNDIiLCJhIjoiY201cjdmdmJxMDdodTJycHc2a3ExMnVqaiJ9.qKDYRE5K3C9f05Cj_JNbWA'; // Add default public map token from your Mapbox account



const map = new mapboxgl.Map({
    container: 'my-map', // container id
    style: 'mapbox://styles/mapbox/streets-v12', // stylesheet
    center: [-79.39514670504386, 43.661694006349904],
    zoom: 13 // starting zoom
  });


const params = document.getElementById('params');

let listing_data;

fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/refs/heads/main/Data/Whole_dataset_reformated.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response); //Check response in console
        listing_data = response; // Store geojson as variable using URL from fetch response

    });

//in order for the data to load you need to have it in an event handler 



//iso stuff


      // Create variables to use in getIso()
      const urlBase = 'https://api.mapbox.com/isochrone/v1/mapbox/';
      const lon = -79.39514670504386;
      const lat = 43.661694006349904;
      let profile = 'walking';
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

        console.log(data);


        map.getSource('iso').setData(data);
      }
      params.addEventListener('change', (event) => {
        if (event.target.name === 'profile') {
          profile = event.target.value;
        } else if (event.target.name === 'duration') {
          minutes = event.target.value;
        }
        getIso();
      });
      

//iso stuff





document.getElementById("update-coordinates").addEventListener("click", function() {


    const num_points = listing_data.features.length; // Get the total number of points


    let num_points_in = [];
    for (let i = 0; i < num_points; i++) {
      // Check if the point is inside the isochrone polygon using Turf.js
      if (turf.booleanPointInPolygon(listing_data.features[i], map.getSource('iso')._data.features[0])) {
        num_points_in.push(listing_data.features[i]); // Add point if inside
      }
    }

    console.log(num_points_in.length);

    const listings_in = {
        type: "FeatureCollection",
        features: num_points_in
    };


    if (map.getLayer('listings_in')) {
        // Update the source data if the layer already exists
        map.getSource('listings_in').setData(listings_in);
    } else {
        // Add the 'listings_in' layer if it doesn't exist
        map.addLayer({
            id: 'listings_in',
            type: 'circle',
            paint: {
                'circle-radius': 8,
                'circle-color': '#FF0000' // Corrected circle color with quotes
            },
            source: {
                type: 'geojson',
                data: listings_in
            }
        });
    }
});




map.on('load', () => {
    
    
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
      // Initialize the marker at the query coordinates
      marker.setLngLat(lngLat).addTo(map);

      // Make the API call
      getIso();
  
});  

