// Set the Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhbm5pNDIiLCJhIjoiY201cjdmdmJxMDdodTJycHc2a3ExMnVqaiJ9.qKDYRE5K3C9f05Cj_JNbWA'; // Add default public map token from your Mapbox account


// Create a new map with Mapbox
const map = new mapboxgl.Map({
  container: 'my-map', // container id
  style: 'mapbox://styles/lilydeng/cm7p7o49v019301qsd8cp0uqa', // stylesheet
  center: [-79.39514670504386, 43.661694006349904],
  zoom: 13 // starting zoom
});

// Declare params and listing_data variables
const params = document.getElementById('params');
let listing_data;

// Fetch GeoJSON data from a URL (this contains housing listing data)
fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/refs/heads/main/Data/Whole_dataset_reformated.geojson')
  .then(response => response.json())
  .then(response => {
    console.log(response); //Check response in console
    listing_data = response; // Store geojson as variable using URL from fetch response

  });

/*--------------------------------------------------------------------
MAP CONTROLS
--------------------------------------------------------------------*/
map.on('load', function () {

  // Add the fullscreen control to the bottom-right corner of the map
  map.addControl(new mapboxgl.FullscreenControl(), 'right');
});
// Add zoom and rotation controls to the bottom-right corner of the map
map.addControl(new mapboxgl.NavigationControl(), 'right');

// Instantiate the geocoder plguin for location search
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  countries: "ca", // Limit the geocoding to Canadian locations
  zoom: 14
});

// Append geocoder search box to the designated div in the html
document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

geocoder.on('result', function(e) {
  // Get the coordinates from the search result
  const coordinates = e.result.geometry.coordinates;
    let longitude = coordinates[0]
    let latitude = coordinates[1]
  
    lon = longitude;
    lat = latitude;
  
    // Move the marker to the clicked coordinates and add it to the map
    marker.setLngLat([longitude, latitude]).addTo(map);
  
    // Fetch isochrone data based on the clicked coordinates
    getIso();
  
    // Clear any existing data in the 'listings_in' source
    if (map.getLayer('listings_in')) {
      // Clear the data by setting it to an empty GeoJSON object
      map.getSource('listings_in').setData({
        type: 'FeatureCollection',
        features: []
      });
    }
  });

//once the points get clicked the isochrone map gets moved to that point
map.on('click', 'TTC_Stops', (e) => {
  // Copy coordinates array and get the coordinates of the clicked feature (TTC stop)
  const coordinates = e.features[0].geometry.coordinates.slice();
  let longitude = coordinates[0]
  let latitude = coordinates[1]

  lon = longitude;
  lat = latitude;

  // Move the marker to the clicked coordinates and add it to the map
  marker.setLngLat([longitude, latitude]).addTo(map);

  // Fetch isochrone data based on the clicked coordinates
  getIso();

  // Clear any existing data in the 'listings_in' source
  if (map.getLayer('listings_in')) {
    // Clear the data by setting it to an empty GeoJSON object
    map.getSource('listings_in').setData({
      type: 'FeatureCollection',
      features: []
    });
  }

});
// Change cursor style when hovering over a TTC stop
map.on('mouseenter', 'TTC_Stops', () => {
  map.getCanvas().style.cursor = 'pointer';
});

// This changes the mouse icon
map.on('mouseleave', 'TTC_Stops', () => {
  map.getCanvas().style.cursor = '';
});


// Isochrone logic starts here

// Create variables to use in getIso()
const urlBase = 'https://api.mapbox.com/isochrone/v1/mapbox/';
let lon = -79.39514670504386;
let lat = 43.661694006349904;
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
// Add event listener to update parameters when user selects a new profile or duration
params.addEventListener('change', (event) => {
  if (event.target.name === 'profile') {
    profile = event.target.value;
  } else if (event.target.name === 'duration') {
    minutes = event.target.value;
  }
  getIso(); // Re-fetch isochrone data based on updated values
});



// Create a function that sets up the Isochrone API query then makes a fetch call
async function getIso() {
  const query = await fetch(
    `${urlBase}${profile}/${lon},${lat}?contours_minutes=${minutes}&polygons=true&access_token=${mapboxgl.accessToken}`,
    { method: 'GET' }
  );
  const data = await query.json(); // Parse the response as JSON
  // Set the 'iso' source's data to what's returned by the API query

  console.log(data); // Log the data for debugging

  // Update the 'iso' source with the fetched data
  map.getSource('iso').setData(data);
}
// Add event listener to update isochrone when parameters change
params.addEventListener('change', (event) => {
  if (event.target.name === 'profile') {
    profile = event.target.value;
  } else if (event.target.name === 'duration') {
    minutes = event.target.value;
  }
  getIso(); // Re-fetch isochrone data based on updated parameters
});
//iso stuff

// Event listener for updating coordinates (generating listing points) when the button is clicked by user

document.getElementById("generate_listings").addEventListener("click", function () {
  const num_points = listing_data.features.length; // Get the total number of points
  let filteredPoints = [];

  // Loop through the listing data and check if points are inside active buffers
  for (let i = 0; i < num_points; i++) {
    const point = listing_data.features[i];

    // Check if the point is inside the isochrone polygon
    const inIsochrone = turf.booleanPointInPolygon(point, map.getSource('iso')._data.features[0]);

    // Check if the point is inside any of the grocery buffer features (if enabled)
    const inGroceryBuffer = groceryCheckbox.checked
      ? map.getSource('grocery-buffered-data')._data.features.some(buffer =>
          turf.booleanPointInPolygon(point, buffer)
        )
      : true; // If unchecked, ignore this buffer

    // Check if the point is inside any of the parks buffer features (if enabled)
    const inParksBuffer = parksCheckbox.checked
      ? map.getSource('parks-buffered-data')._data.features.some(buffer =>
          turf.booleanPointInPolygon(point, buffer)
        )
      : true; // If unchecked, ignore this buffer

    // Check if the point is inside any of the TTC buffer features (if enabled)
    const inTTCBuffer = ttcCheckbox.checked
      ? map.getSource('ttc-buffered-data')._data.features.some(buffer =>
          turf.booleanPointInPolygon(point, buffer)
        )
      : true; // If unchecked, ignore this buffer



    // Add point if it is inside all active buffers
    if (inIsochrone && inGroceryBuffer && inParksBuffer && inTTCBuffer) {
      filteredPoints.push(point);
      console.log('Point included:', point);
    } else {
      console.log('Point excluded:', point);
    }
  }

  console.log('Filtered points:', filteredPoints.length);

  // Create a GeoJSON object to store filtered points
  const listings_in = {
    type: "FeatureCollection",
    features: filteredPoints
  };

  // Add or update the 'listings_in' layer on the map
  if (map.getLayer('listings_in')) {
    map.getSource('listings_in').setData(listings_in);
  } else {
    map.addLayer({
      id: 'listings_in',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#f06d51'
      },
      source: {
        type: 'geojson',
        data: listings_in
      }
    });
  }
});

// Add the TTC Stops layer with data from the GeoJSON file
map.on('load', () => {

  map.addLayer({
    id: 'TTC_Stops',
    type: 'circle',
    paint: {
      'circle-radius': 5,
      'circle-color': '#36454F' // Corrected circle color with quotes
    },
    source: {
      type: 'geojson',
      data: 'https://raw.githubusercontent.com/chann15/GGR472_Final_Project/refs/heads/main/Data/TTC%20POINTS.geojson'
    }
  });

// Add an empty 'iso' source for the isochrone data
  map.addSource('iso', {
    type: 'geojson',
    data: {
      'type': 'FeatureCollection',
      'features': []
    }
  });

  // Add the isochrone layer to the map
  map.addLayer(
    {
      'id': 'isoLayer',
      'type': 'fill',
      'source': 'iso',
      'layout': {},
      'paint': {
        'fill-color': '#45afcb',
        'fill-opacity': 0.35
      }
    },
    'poi-label'
  );
  // Initialize the marker at the query coordinates
  marker.setLngLat(lngLat).addTo(map);

  // Make the API call
  getIso();

});

// move fetch out, and legend code out of java to html, add checkboxes etc to the html - this is being grumpy
let groceryResponse;
let parksResponse;
let ttcResponse;

fetch('https://raw.githubusercontent.com/emilyamoffat/test/main/overpass_grocery.geojson')
  .then(response => response.json())
  .then(response => {
    console.log(response); //Check response in console
    groceryResponse = response; // Store geojson as variable using URL from fetch response

  });

fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/ab671d350e44e397a5663ec1fb1cdf4d700a5fa9/Data/Parks%20and%20Recreation_TOR.geojson')
  .then(response => response.json())
  .then(response => {
    console.log(response); //Check response in console
    parksResponse = response; // Store geojson as variable using URL from fetch response

  });

fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/main/Data/TTC%20POINTS.geojson')
  .then(response => response.json())
  .then(response => {
    console.log(response); //Check response in console
    ttcResponse = response; // Store geojson as variable using URL from fetch response

  });


map.on('load', async () => {

  // // Load grocery data
  // const groceryResponse = await fetch('https://raw.githubusercontent.com/emilyamoffat/test/main/overpass_grocery.geojson');
  // const groceryData = await groceryResponse.json();

  // // Load Parks and Recreation data
  // const parksResponse = await fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/ab671d350e44e397a5663ec1fb1cdf4d700a5fa9/Data/Parks%20and%20Recreation_TOR.geojson');
  // const parksData = await parksResponse.json();

  // // Load TTC points data
  // const ttcResponse = await fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/main/Data/TTC%20POINTS.geojson');
  // const ttcData = await ttcResponse.json();

  // Add sources for buffers
  map.addSource('grocery-buffered-data', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addSource('parks-buffered-data', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  map.addSource('ttc-buffered-data', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

  // Function to update buffers dynamically
  const updateBuffer = (data, bufferSize, sourceId) => {
    const bufferedFeatures = data.features.map(feature => turf.buffer(feature, bufferSize, { units: 'kilometers' }));
    const bufferedGeoJSON = turf.featureCollection(bufferedFeatures);
    map.getSource(sourceId).setData(bufferedGeoJSON);
    console.log(`${sourceId} updated with buffer size:`, bufferSize);
  };

  // Initialize buffers with default sizes
  updateBuffer(groceryData, 0.5, 'grocery-buffered-data');
  updateBuffer(parksData, 1.0, 'parks-buffered-data');
  updateBuffer(ttcData, 0.5, 'ttc-buffered-data');

  // Add sliders and checkboxes for each category
  const legend = document.getElementById('legend');

  // Grocery
  const groceryLegendItem = document.createElement('div');
  groceryLegendItem.innerHTML = '<span style="background-color: #6495ed;"></span> Grocery';
  legend.appendChild(groceryLegendItem);

  const groceryCheckbox = document.createElement('input');
  groceryCheckbox.type = 'checkbox';
  groceryCheckbox.checked = true;
  groceryLegendItem.prepend(groceryCheckbox);

  const grocerySlider = document.createElement('input');
  grocerySlider.type = 'range';
  grocerySlider.min = '0.5'; 
  grocerySlider.max = '2.5'; 
  grocerySlider.step = '0.5'; 
  grocerySlider.value = '0.5'; 
  grocerySlider.oninput = (e) => {
    const bufferSize = parseFloat(e.target.value);
    updateBuffer(groceryData, bufferSize, 'grocery-buffered-data');
  };
  groceryLegendItem.appendChild(grocerySlider);

  // Parks
  const parksLegendItem = document.createElement('div');
  parksLegendItem.innerHTML = '<span style="background-color: #32cd32;"></span> Parks';
  legend.appendChild(parksLegendItem);

  const parksCheckbox = document.createElement('input');
  parksCheckbox.type = 'checkbox';
  parksCheckbox.checked = true;
  parksLegendItem.prepend(parksCheckbox);

  const parksSlider = document.createElement('input');
  parksSlider.type = 'range';
  parksSlider.min = '0.5'; 
  parksSlider.max = '2.5'; 
  parksSlider.step = '0.5'; 
  parksSlider.value = '1.0'; 
  parksSlider.oninput = (e) => {
    const bufferSize = parseFloat(e.target.value);
    updateBuffer(parksData, bufferSize, 'parks-buffered-data');
  };
  parksLegendItem.appendChild(parksSlider);

  // TTC
  const ttcLegendItem = document.createElement('div');
  ttcLegendItem.innerHTML = '<span style="background-color: #ff0000;"></span> TTC';
  legend.appendChild(ttcLegendItem);

  const ttcCheckbox = document.createElement('input');
  ttcCheckbox.type = 'checkbox';
  ttcCheckbox.checked = true;
  ttcLegendItem.prepend(ttcCheckbox);

  const ttcSlider = document.createElement('input');
  ttcSlider.type = 'range';
  ttcSlider.min = '0.5'; 
  ttcSlider.max = '2.5'; 
  ttcSlider.step = '0.5'; 
  ttcSlider.value = '0.5'; 
  ttcSlider.oninput = (e) => {
    const bufferSize = parseFloat(e.target.value);
    updateBuffer(ttcData, bufferSize, 'ttc-buffered-data');
  };
  ttcLegendItem.appendChild(ttcSlider);

  // Event listener for filtering listings
  document.getElementById("generate_listings").addEventListener("click", function () {
    const num_points = listing_data.features.length; // Get the total number of points
    let filteredPoints = [];

    // Loop through the listing data and check if points are inside active buffers
    for (let i = 0; i < num_points; i++) {
      const point = listing_data.features[i];

      const inIsochrone = turf.booleanPointInPolygon(point, map.getSource('iso')._data.features[0]);
      const inGroceryBuffer = groceryCheckbox.checked
        ? map.getSource('grocery-buffered-data')._data.features.some(buffer =>
            turf.booleanPointInPolygon(point, buffer)
          )
        : true;
      const inParksBuffer = parksCheckbox.checked
        ? map.getSource('parks-buffered-data')._data.features.some(buffer =>
            turf.booleanPointInPolygon(point, buffer)
          )
        : true;
      const inTTCBuffer = ttcCheckbox.checked
        ? map.getSource('ttc-buffered-data')._data.features.some(buffer =>
            turf.booleanPointInPolygon(point, buffer)
          )
        : true;

      // Debugging: Log the results for each point
      console.log('Point:', point);
      console.log('In Isochrone:', inIsochrone);
      console.log('In Grocery Buffer:', inGroceryBuffer);
      console.log('In Parks Buffer:', inParksBuffer);
      console.log('In TTC Buffer:', inTTCBuffer);

      if (inIsochrone && inGroceryBuffer && inParksBuffer && inTTCBuffer) {
        filteredPoints.push(point);
        console.log('Point included:', point);
      } else {
        console.log('Point excluded:', point);
      }
    }

    console.log('Filtered points:', filteredPoints.length);

    // Create a GeoJSON object to store filtered points
    const listings_in = {
      type: "FeatureCollection",
      features: filteredPoints
    };

    // Add or update the 'listings_in' layer on the map
    if (map.getLayer('listings_in')) {
      map.getSource('listings_in').setData(listings_in);
    } else {
      map.addLayer({
        id: 'listings_in',
        type: 'circle',
        paint: {
          'circle-radius': 6,
          'circle-color': '#f06d51'
        },
        source: {
          type: 'geojson',
          data: listings_in
        }
      });
    }
  });
});

// Add buffer layers to the map for visualization
const addBufferLayers = () => {
  // Grocery Buffer Layer
  if (!map.getLayer('grocery-buffer-layer')) {
    map.addLayer({
      id: 'grocery-buffer-layer',
      type: 'fill',
      source: 'grocery-buffered-data',
      paint: {
        'fill-color': '#6495ed', // Blue for grocery
        'fill-opacity': 0.3
      }
    });
  }

  // Parks Buffer Layer
  if (!map.getLayer('parks-buffer-layer')) {
    map.addLayer({
      id: 'parks-buffer-layer',
      type: 'fill',
      source: 'parks-buffered-data',
      paint: {
        'fill-color': '#32cd32', // Green for parks
        'fill-opacity': 0.3
      }
    });
  }

  // TTC Buffer Layer
  if (!map.getLayer('ttc-buffer-layer')) {
    map.addLayer({
      id: 'ttc-buffer-layer',
      type: 'fill',
      source: 'ttc-buffered-data',
      paint: {
        'fill-color': '#ff0000', // Red for TTC
        'fill-opacity': 0.3
      }
    });
  }
};

// Call the function to add buffer layers
addBufferLayers();

// emily will edit this later.... lines 246-259
//This allows the users to click the actual data point, as well as dispalys the existing data. 
map.on('click', 'listings_in', (e) => {
  const coordinates = e.features[0].geometry.coordinates.slice();
  const description_first_part = e.features[0].properties.address;
  const description_units = JSON.parse(e.features[0].properties.units);
  let result = '';
// Build the description string for the popup
if (description_units.length > 1) {
  for (let i = 0; i < description_units.length; i++) {
      result += `<br> Price: ${description_units[i].price} <br> Beds: ${description_units[i].beds}<br>`;
  }
} else {
  result += `<br> Price: ${description_units[0].price} <br> Beds: ${description_units[0].beds} <br>`;
}

  const description = description_first_part + "<br>" + result;


  if (['mercator', 'equirectangular'].includes(map.getProjection().name)) {
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }
  }

  // Open a popup with the description at the clicked coordinates
  new mapboxgl.Popup()
    .setLngLat(coordinates)
    .setHTML(description)
    .addTo(map);
});

// Change cursor style when hovering over a listing in the 'listings_in' layer
map.on('mouseenter', 'filteredPoints', () => {
  map.getCanvas().style.cursor = 'pointer';
});

// Reset cursor when leaving the 'listings_in' layer
map.on('mouseleave', 'listings_in', () => {
  map.getCanvas().style.cursor = '';
});

