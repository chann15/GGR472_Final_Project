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


  // Add the fullscreen control to the bottom-right corner of the map
map.addControl(new mapboxgl.FullscreenControl(), 'right');
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


  let num_points_in = [];
  
  // Loop through the listing data and check if points are inside the isochrone polygon using Turf.js
  for (let i = 0; i < num_points; i++) {
    // Check if the point is inside the isochrone polygon using Turf.js
    if (turf.booleanPointInPolygon(listing_data.features[i], map.getSource('iso')._data.features[0])) {
      num_points_in.push(listing_data.features[i]); // Add points inside the polygon to the array
    }
  }

  console.log(num_points_in.length); // Log the number of points inside the isochrone

// Create a GeoJSON object to store points inside the isochrone
  const listings_in = {
    type: "FeatureCollection",
    features: num_points_in
  };

  // Add or update the 'listings_in' layer on the map
  if (map.getLayer('listings_in')) {
    // Update the source data if the layer already exists
    map.getSource('listings_in').setData(listings_in);
  } else {
    // Add the 'listings_in' layer if it doesn't exist
    map.addLayer({
      id: 'listings_in',
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#f06d51' // Corrected circle color with quotes
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
        'fill-color': '#347ca9',
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



// emily will edit this.... lines 246-259
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
map.on('mouseenter', 'listings_in', () => {
  map.getCanvas().style.cursor = 'pointer';
});

// Reset cursor when leaving the 'listings_in' layer
map.on('mouseleave', 'listings_in', () => {
  map.getCanvas().style.cursor = '';
});

// Layers and sources for your features
let ttcStopsLayer = 'ttc-stops-layer';
let generatedUnitsLayer = 'generated-units-layer';
let isochromeLayer = 'isochrome-layer';

// Function to update the legend dynamically
function updateLegend() {
  let legendContainer = document.getElementById('map-legend');
  let legendItems = document.getElementById('legend-items');

  // Clear the current legend
  legendItems.innerHTML = '';

// Check if the TTC stops layer is visible
if (map.getLayer(ttcStopsLayer)) {
  let li = document.createElement('li');
  li.innerHTML = `<span class="legend-point" style="width: 10px; height: 10px; border-radius: 50%; background-color: black; margin-right: 10px;"></span> TTC Stops`;
  legendItems.appendChild(li);
}

// Check if the generated units layer is visible
if (map.getLayer(generatedUnitsLayer)) {
  let li = document.createElement('li');
  li.innerHTML = `<span class="legend-point" style="width: 10px; height: 10px; border-radius: 50%; background-color: #f06d51; margin-right: 10px;"></span> Generated Units`;
  legendItems.appendChild(li);
}


  // Check if the isochrome layer is visible
  if (map.getLayer(isochromeLayer)) {
    let li = document.createElement('li');
    li.innerHTML = `<span class="legend-color" style="background-color: #516ea0;"></span> Isochrome`;
    legendItems.appendChild(li);
  }

  // Show the legend if there are items
  if (legendItems.children.length > 0) {
    legendContainer.style.display = 'block';
  } else {
    legendContainer.style.display = 'none';
  }
}

// Example of adding layers to the map (this part depends on your map setup)
map.on('load', function() {
  // Add TTC Stops Layer (black dot)
  map.addLayer({
    id: ttcStopsLayer,
    type: 'symbol',
    source: {
      type: 'geojson',
      data: 'path/to/ttc_stops.geojson'
    },
    layout: {
      'icon-image': 'circle-15', // Replace with your icon/image for TTC stops
      'icon-color': 'black'
    }
  });

  // Add Generated Units Layer (orange dot)
  map.addLayer({
    id: generatedUnitsLayer,
    type: 'symbol',
    source: {
      type: 'geojson',
      data: 'path/to/generated_units.geojson'
    },
    layout: {
      'icon-image': 'circle-15', // Replace with your icon/image for units
      'icon-color': '#f06d51'
    }
  });

  // Add Isochrome Layer (polygon)
  map.addLayer({
    id: isochromeLayer,
    type: 'fill',
    source: {
      type: 'geojson',
      data: 'path/to/isochrome.geojson'
    },
    paint: {
      'fill-color': '#45afcb',
      'fill-opacity': 0.4
    }
  });
// Add TTC Lines Layer (line)
map.addLayer({
  id: 'ttcLinesLayer',  // Unique ID for the TTC lines layer
  type: 'line',
  source: {
    type: 'geojson',
    data: 'path/to/ttc_lines.geojson'  // Replace with your actual TTC Lines GeoJSON path
  },
  paint: {
    'line-color': 'hsla(332, 74%, 58%, 0.71)', // Set the line color with the HSLA code
    'line-width': 2  // Adjust line width as necessary
  }
});
  // Update the legend when the map is loaded
  updateLegend();
});

// You may want to also update the legend if layers are toggled on or off dynamically
map.on('layeradd', function() {
  updateLegend();
});

map.on('layerremove', function() {
  updateLegend();
});

map.on('load', function() {
  // Add the TTC logo as an image to the map
  map.loadImage('https://github.com/chann15/GGR472_Final_Project/raw/main/logos/ttc.png', function(error, image) {
    if (error) throw error;

    // Add image to map
    map.addImage('ttc-logo', image);

    // Add the TTC stops layer with the logo as an icon
    map.addLayer({
      'id': 'ttc-stops',
      'type': 'symbol',
      'source': {
        'type': 'geojson',
        'data': ttcStopsGeoJSON // Replace with the actual GeoJSON data for TTC stops
      },
      'layout': {
        'icon-image': 'ttc-logo',
        'icon-size': 0.1,  // Adjust the size of the logo as needed
        'icon-allow-overlap': true
      }
    });

    // Update legend after the map is loaded
    updateLegend();
  });
});
