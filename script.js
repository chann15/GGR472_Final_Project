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


// set up buffers below in the background, not displayed as layers on map
map.on('load', async () => {
  // Load grocery data
  const response = await fetch('https://raw.githubusercontent.com/emilyamoffat/test/main/overpass_grocery.geojson');
  const groceryData = await response.json();

  // Create buffers using Turf.js
  const bufferedFeatures = groceryData.features.map(feature => {
      return turf.buffer(feature, 0.5, { units: 'kilometers' }); // 0.5 km buffer
  });

  // Combine all buffers into one GeoJSON feature collection
  const bufferedGeoJSON = turf.featureCollection(bufferedFeatures);

  // Add buffered source
  map.addSource('buffered-data', {
      type: 'geojson',
      data: bufferedGeoJSON
  });

  // Debugging: Confirm data in console
  console.log('Grocery buffered data:', bufferedGeoJSON);

  // Load Parks and Recreation data
  const parksResponse = await fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/ab671d350e44e397a5663ec1fb1cdf4d700a5fa9/Data/Parks%20and%20Recreation_TOR.geojson');
  const parksData = await parksResponse.json();

  // Define colors for each type
  const typeColors = {
      'Nature/ Park': '#32cd32'
  };

  // Define buffer sizes for each type
  const typeBufferSizes = {
      'Nature/ Park': 1.0
  };

  // Split Parks data into types
  const types = [...new Set(parksData.features.map(feature => feature.properties.TYPE))];

  types.forEach(type => {
      const typeFeatures = parksData.features.filter(feature => feature.properties.TYPE === type);
      const typeGeoJSON = {
          type: 'FeatureCollection',
          features: typeFeatures
      };

      // Create buffers for Parks data using Turf.js
      const bufferedPOIFeatures = typeFeatures.map(feature => {
          return turf.buffer(feature, typeBufferSizes[type] || 0.5, { units: 'kilometers' }); // Buffer size based on type
      });

      // Combine all buffers into one GeoJSON feature collection
      const bufferedPOIGeoJSON = turf.featureCollection(bufferedPOIFeatures);

      // Add buffered source for Parks data
      map.addSource(`${type.toLowerCase().replace(/ /g, '-')}-buffered-data`, {
          type: 'geojson',
          data: bufferedPOIGeoJSON
      });

      // Debugging: Confirm data in console
      console.log(`${type} buffered data:`, bufferedPOIGeoJSON);
  });

  // Load TTC points data
  const ttcResponse = await fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/main/Data/TTC%20POINTS.geojson');
  const ttcData = await ttcResponse.json();

  // Create buffers for TTC points using Turf.js
  const bufferedTTCFeatures = ttcData.features.map(feature => {
      return turf.buffer(feature, 0.5, { units: 'kilometers' }); // 0.5 km buffer
  });

  // Combine all buffers into one GeoJSON feature collection
  const bufferedTTCGeoJSON = turf.featureCollection(bufferedTTCFeatures);

  // Add buffered source for TTC points
  map.addSource('ttc-buffered-data', {
      type: 'geojson',
      data: bufferedTTCGeoJSON
  });

  // Debugging: Confirm data in console
  console.log('TTC buffered data:', bufferedTTCGeoJSON);

  // Add legend and sliders
  const legend = document.getElementById('legend');

  // Add grocery legend and slider
  const groceryLegendItem = document.createElement('div');
  groceryLegendItem.innerHTML = '<span style="background-color: #6495ed;"></span> Grocery';
  legend.appendChild(groceryLegendItem);

  const groceryCheckbox = document.createElement('input');
  groceryCheckbox.type = 'checkbox';
  groceryCheckbox.checked = true;
  groceryCheckbox.onchange = (e) => {
      map.setLayoutProperty('grocery-point', 'visibility', e.target.checked ? 'visible' : 'none');
      map.setLayoutProperty('buffered-layer', 'visibility', e.target.checked ? 'visible' : 'none');
  };
  groceryLegendItem.prepend(groceryCheckbox);

  const grocerySliderLabel = document.createElement('label');
  grocerySliderLabel.innerHTML = 'Buffer Size: 0.25 - 1.25 km';
  groceryLegendItem.appendChild(grocerySliderLabel);

  const grocerySlider = document.createElement('input');
  grocerySlider.type = 'range';
  grocerySlider.min = '0.25';
  grocerySlider.max = '1.25';
  grocerySlider.step = '0.25';
  grocerySlider.value = '0.5';
  grocerySlider.oninput = (e) => {
      const bufferSize = parseFloat(e.target.value);
      const bufferedFeatures = groceryData.features.map(feature => {
          return turf.buffer(feature, bufferSize, { units: 'kilometers' });
      });
      const bufferedGeoJSON = turf.featureCollection(bufferedFeatures);
      map.getSource('buffered-data').setData(bufferedGeoJSON);
  };
  groceryLegendItem.appendChild(grocerySlider);

  // Add Parks legends and sliders
  types.forEach(type => {
      const color = typeColors[type] || '#ff6347';

      // Add legend item
      const legendItem = document.createElement('div');
      legendItem.innerHTML = `<span style="background-color: ${color};"></span> ${type}`;
      legend.appendChild(legendItem);

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = true;
      checkbox.onchange = (e) => {
          map.setLayoutProperty(`${type.toLowerCase().replace(/ /g, '-')}-point`, 'visibility', e.target.checked ? 'visible' : 'none');
          map.setLayoutProperty(`${type.toLowerCase().replace(/ /g, '-')}-buffered-layer`, 'visibility', e.target.checked ? 'visible' : 'none');
      };
      legendItem.prepend(checkbox);

      const sliderLabel = document.createElement('label');
      sliderLabel.innerHTML = 'Buffer Size: 0.25 - 1.25 km';
      legendItem.appendChild(sliderLabel);

      // Add slider
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '0.25';
      slider.max = '1.25';
      slider.step = '0.25';
      slider.value = typeBufferSizes[type] || '0.5';
      slider.oninput = (e) => {
          const bufferSize = parseFloat(e.target.value);
          const typeFeatures = parksData.features.filter(feature => feature.properties.TYPE === type);
          const bufferedPOIFeatures = typeFeatures.map(feature => {
              return turf.buffer(feature, bufferSize, { units: 'kilometers' });
          });
          const bufferedPOIGeoJSON = turf.featureCollection(bufferedPOIFeatures);
          map.getSource(`${type.toLowerCase().replace(/ /g, '-')}-buffered-data`).setData(bufferedPOIGeoJSON);
      };
      legendItem.appendChild(slider);
  });

  // Add TTC legend and slider
  const ttcLegendItem = document.createElement('div');
  ttcLegendItem.innerHTML = '<span style="background-color: #ff0000;"></span> TTC Points';
  legend.appendChild(ttcLegendItem);

  const ttcCheckbox = document.createElement('input');
  ttcCheckbox.type = 'checkbox';
  ttcCheckbox.checked = true;
  ttcCheckbox.onchange = (e) => {
      map.setLayoutProperty('ttc-point', 'visibility', e.target.checked ? 'visible' : 'none');
      map.setLayoutProperty('ttc-buffered-layer', 'visibility', e.target.checked ? 'visible' : 'none');
  };
  ttcLegendItem.prepend(ttcCheckbox);

  const ttcSliderLabel = document.createElement('label');
  ttcSliderLabel.innerHTML = 'Buffer Size: 0.25 - 1.25 km';
  ttcLegendItem.appendChild(ttcSliderLabel);

  const ttcSlider = document.createElement('input');
  ttcSlider.type = 'range';
  ttcSlider.min = '0.25';
  ttcSlider.max = '1.25';
  ttcSlider.step = '0.25';
  ttcSlider.value = '0.5';
  ttcSlider.oninput = (e) => {
      const bufferSize = parseFloat(e.target.value);
      const bufferedTTCFeatures = ttcData.features.map(feature => {
          return turf.buffer(feature, bufferSize, { units: 'kilometers' });
      });
      const bufferedTTCGeoJSON = turf.featureCollection(bufferedTTCFeatures);
      map.getSource('ttc-buffered-data').setData(bufferedTTCGeoJSON);
  };
  ttcLegendItem.appendChild(ttcSlider);
});

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
map.on('mouseenter', 'listings_in', () => {
  map.getCanvas().style.cursor = 'pointer';
});

// Reset cursor when leaving the 'listings_in' layer
map.on('mouseleave', 'listings_in', () => {
  map.getCanvas().style.cursor = '';
});

