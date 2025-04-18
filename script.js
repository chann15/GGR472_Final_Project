// Set the Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoibGlseWRlbmciLCJhIjoiY201eGIwOG5jMDB6ZDJqcHJrdGtudzVscSJ9.-cRhTqv-44DxjWWHAi9GmQ'; // Add default public map token from your Mapbox account


// Create a new map with Mapbox
const map = new mapboxgl.Map({
  container: 'my-map', // container id
  style: 'mapbox://styles/lilydeng/cm7p7o49v019301qsd8cp0uqa', // stylesheet
  center: [-79.39514670504386, 43.661694006349904],
  zoom: 13 // starting zoom
});

// Declare params and listing_data variables
const params = document.getElementById('params');

/*--------------------------------------------------------------------
VARIABLES/FETCHING DATA
--------------------------------------------------------------------*/


let listing_data;
let groceryResponse;
let parksResponse;
let ttcResponse;


// Fetch GeoJSON data from github for listings, grocery stores, parks, and TTC points
fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/refs/heads/main/Data/Whole_dataset_reformated.geojson')
  .then(response => response.json())
  .then(response => {
    console.log(response); //Check response in console
    listing_data = response; // Store geojson as variable using URL from fetch response

  });


fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/refs/heads/main/Data/GroceryStores.geojson')
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


/*--------------------------------------------------------------------
MAP CONTROLS
--------------------------------------------------------------------*/

map.addControl(new mapboxgl.FullscreenControl(), 'right');

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



/*--------------------------------------------------------------------
ISOCHRONE LOGIC
--------------------------------------------------------------------*/


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

// Add event listener to update isochrone parameters (profile and duration) when user changes input values

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


/*--------------------------------------------------------------------
ISOCHRONE INTERACTION
--------------------------------------------------------------------*/

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
  };

  if (map.getLayer('grocery_points')) {
    // Clear the data by setting it to an empty GeoJSON object
    map.getSource('grocery_points').setData({
      type: 'FeatureCollection',
      features: []
    });
  };

  if (map.getLayer('parks_points')) {
    // Clear the data by setting it to an empty GeoJSON object
    map.getSource('parks_points').setData({
      type: 'FeatureCollection',
      features: []
    });
  };


});



document.getElementById("generate_listings").addEventListener("click", function () {
  const num_points = listing_data.features.length; // Get the total number of points
  let num_points_in = [];
  
  // Loop through the listing data and check if points are inside the isochrone polygon using Turf.js
  for (let i = 0; i < num_points; i++) {
    // Check if the point is inside the isochrone polygon using Turf.js
    if (turf.booleanPointInPolygon(listing_data.features[i], map.getSource('iso')._data.features[0])) {
      num_points_in.push(listing_data.features[i]); // Add points inside the polygon to the array
    }
  };
  // Loop through the grocery, parks, TTC point data and check if points are inside the isochrone polygon using Turf.js

  if (document.getElementById('grocery-checkbox').checked) {
    const num_grocery_points = groceryResponse.features.length; // Get the total number of grocery points
    let grocery_points_in = [];
    // Loop through the grocery data and check if points are inside the isochrone polygon using Turf.js
    for (let i = 0; i < num_grocery_points; i++) {
    // Check if the grocery point is inside the isochrone polygon using Turf.js
    if (turf.booleanIntersects(groceryResponse.features[i], map.getSource('iso')._data.features[0])) {
      grocery_points_in.push(groceryResponse.features[i]); // Add grocery points inside the polygon to the array
    }
    };
    console.log(grocery_points_in);

      // Code to execute if the checkbox is checked
      const GrocerySliderValue = parseFloat(document.getElementById('grocery-slider').value);
      console.log("slider" + GrocerySliderValue);
      grocery_buffers = [];

      for (let i = 0; i < grocery_points_in.length; i++) {
        var Grocery_One_Buffer = turf.buffer(grocery_points_in[i], GrocerySliderValue, { units: "kilometers" });
        grocery_buffers.push(Grocery_One_Buffer);
      }
      console.log(grocery_buffers);
  // Check if the checkbox is checked
  };

  if (document.getElementById('parks-checkbox').checked) {
    const num_parks_points = parksResponse.features.length; // Get the total number of parks points
    let parks_points_in = [];
    // Loop through the parks data and check if points are inside the isochrone polygon using Turf.js
    for (let i = 0; i < num_parks_points; i++) {
    // Check if the parks point is inside the isochrone polygon using Turf.js
    if (turf.booleanIntersects(parksResponse.features[i], map.getSource('iso')._data.features[0])) {
      parks_points_in.push(parksResponse.features[i]); // Add TTC points inside the polygon to the array
    }
    };
    console.log(parks_points_in);

      // Code to execute if the checkbox is checked
      const ParksSliderValue = parseFloat(document.getElementById('parks-slider').value);
      console.log("slider" + ParksSliderValue);
      parks_buffers = [];

      for (let i = 0; i < parks_points_in.length; i++) {
        var Parks_One_Buffer = turf.buffer(parks_points_in[i], ParksSliderValue, { units: "kilometers" });
        parks_buffers.push(Parks_One_Buffer);
      }
      console.log(parks_buffers);
  };

  if (document.getElementById('ttc-checkbox').checked) {
    const num_ttc_points = ttcResponse.features.length; // Get the total number of TTC points
    let ttc_points_in = [];
    // Loop through the TTC data and check if points are inside the isochrone polygon using Turf.js
    for (let i = 0; i < num_ttc_points; i++) {
    // Check if the TTC point is inside the isochrone polygon using Turf.js
    if (turf.booleanIntersects(ttcResponse.features[i], map.getSource('iso')._data.features[0])) {
      ttc_points_in.push(ttcResponse.features[i]); // Add TTC points inside the polygon to the array
    }
    };
    console.log(ttc_points_in);

      // Code to execute if the checkbox is checked
      const ttcSliderValue = parseFloat(document.getElementById('ttc-slider').value);
      console.log("slider" + ttcSliderValue);
      ttc_buffers = [];

      for (let i = 0; i < ttc_points_in.length; i++) {
        var TTC_One_Buffer = turf.buffer(ttc_points_in[i], ttcSliderValue, { units: "kilometers" });
        ttc_buffers.push(TTC_One_Buffer);
      }
      console.log(ttc_buffers);
  };


  // Combine all the buffers into one GeoJSON object, excluding empty buffers
  const all_buffers = {
    type: "FeatureCollection",
    features: []
  };
  // Add non-empty and defined buffers to the combined buffers
  if (typeof grocery_buffers !== "undefined" && grocery_buffers) {
    all_buffers.features = all_buffers.features.concat(grocery_buffers);
  }
  
  if (typeof parks_buffers !== "undefined" && parks_buffers) {
    all_buffers.features = all_buffers.features.concat(parks_buffers);
  }
  
  if (typeof ttc_buffers !== "undefined" && ttc_buffers) {
    all_buffers.features = all_buffers.features.concat(ttc_buffers);
  }
  
  console.log("Combined Buffers:", all_buffers);

//creates a geojson object for the listings in order to be used with turf.js
  const Listings_geojson = {
    type: "FeatureCollection",
    features: num_points_in
  };

  let filteredPoints = [];
if (typeof all_buffers.features === "undefined" || all_buffers.features.length == 0) {
// If there are no buffers, add all the points to the filtered points
filteredPoints = num_points_in;
} else {
  // Loop through the listing data and check if points are inside the buffer polygons using Turf.js
  for (let i = 0; i < Listings_geojson.features.length; i++) {
      // Check if the point is inside the buffer polygons using Turf.js
      for (let j = 0; j < all_buffers.features.length; j++) {
        const buffer = all_buffers.features[j];
          if (turf.booleanPointInPolygon(Listings_geojson.features[i], buffer)) {
              filteredPoints.push(Listings_geojson.features[i]); // Add points inside the buffer polygons to the array
          }
      }
  }
};
  console.log("Filtered Points:", filteredPoints);


  // Create a GeoJSON object to store filtered points
  const listings_in = {
    type: "FeatureCollection",
    features: filteredPoints
  };
  console.log("Filtered_points:",listings_in);



// Create a new array to store unique points
let uniquePoints = [];
let seenCoordinates = new Set();

// Loop through the features in listings_in to remove duplicates
for (let i = 0; i < listings_in.features.length; i++) {
const feature = listings_in.features[i];
const coordinates = JSON.stringify(feature.geometry.coordinates); // Use coordinates as a unique identifier

// Check if the coordinates have already been seen
if (!seenCoordinates.has(coordinates)) {
  seenCoordinates.add(coordinates); // Mark the coordinates as seen
  uniquePoints.push(feature); // Add the unique feature to the array
}
}

// Update the listings_in object with unique points
listings_in.features = uniquePoints;

console.log("Listings without duplicates:", listings_in);

  // Add or update the 'listings_in' layer on the map
  if (map.getLayer('listings_in')) {
    map.getSource('listings_in').setData(listings_in);
  } else {
    map.addLayer({
      id: 'listings_in',
      type: 'circle',
      paint: {
        'circle-radius': 5,
        'circle-color': '#f06d51'
      },
      source: {
        type: 'geojson',
        data: listings_in
      }
    });
  };

});

document.getElementById("Grocery_Stores").addEventListener("click", function () {
  const num_grocery_points = groceryResponse.features.length; // Get the total number of Grovery stores points
  let grocery_points_in = [];
  // Loop through the Grocery store data and check if points are inside the isochrone polygon using Turf.js
  for (let i = 0; i < num_grocery_points; i++) {
  // Check if the TTC point is inside the isochrone polygon using Turf.js
  if (turf.booleanIntersects(groceryResponse.features[i], map.getSource('iso')._data.features[0])) {
    grocery_points_in.push(groceryResponse.features[i]); // Add grocery store points inside the polygon to the array
  }
  };

//create a geojson object for the parks in order to be displayed
  const grocery_points_formated = {
    type: "FeatureCollection",
    features: grocery_points_in
  };
  //display the grocery points on the map
  if (map.getLayer('grocery_points')) {
    map.getSource('grocery_points').setData(grocery_points_formated);
  } else {
    map.addLayer({
      id: 'grocery_points',
      type: 'circle',
      paint: {
        'circle-radius': 5,
        'circle-color': 'rgb(126, 81, 160)'
      },
      source: {
        type: 'geojson',
        data: grocery_points_formated
      }
    });
  }
});


document.getElementById("Parks").addEventListener("click", function () {
  const num_parks_points = parksResponse.features.length; // Get the total number of Park points
  let parks_points_in = [];
  // Loop through the Park data and check if points are inside the isochrone polygon using Turf.js
  for (let i = 0; i < num_parks_points; i++) {
  // Check if the Park point is inside the isochrone polygon using Turf.js
  if (turf.booleanIntersects(parksResponse.features[i], map.getSource('iso')._data.features[0])) {
    parks_points_in.push(parksResponse.features[i]); // Add Park points inside the polygon to the array
  }
  };
//create a geojson object for the parks in order to be displayed
  const park_points_formated = {
    type: "FeatureCollection",
    features: parks_points_in
  };
//display the parks points on the map
  if (map.getLayer('parks_points')) {
    map.getSource('parks_points').setData(park_points_formated);
  } else {
    map.addLayer({
      id: 'parks_points',
      type: 'circle',
      paint: {
        'circle-radius': 5,
        'circle-color': '#008000'
      },
      source: {
        type: 'geojson',
        data: park_points_formated
      }
    });
  }
});

//removes all the points from the map
document.getElementById("Clear").addEventListener("click", function () {
  const clearer = {
    type: "FeatureCollection",
    features: []
  };

  if (map.getLayer('parks_points')) {
    map.getSource('parks_points').setData(clearer);
  }

  if (map.getLayer('grocery_points')) {
    map.getSource('grocery_points').setData(clearer);
  }

  if (map.getLayer('listings_in')) {
    map.getSource('listings_in').setData(clearer);
  }

});


/*--------------------------------------------------------------------
LISTINGS INTERACTION
--------------------------------------------------------------------*/
//This allows the users to click the actual data point, as well as dispalys the existing data. 
map.on('click', 'listings_in', (e) => {
  const feature = e.features[0];
  if (!feature.properties || !feature.properties.address || !feature.properties.units) {
    console.error('Feature properties are missing:', feature);
    return;
  }

  const coordinates = feature.geometry.coordinates.slice();
  const description_first_part = `<b>${feature.properties.address}</b>`; // Make the address bold
  const description_units = JSON.parse(feature.properties.units);
  let result = '';

  // Build the description string for the popup
  if (description_units.length > 1) {
    for (let i = 0; i < description_units.length; i++) {
      result += `<br><b>Price:</b> ${description_units[i].price}`;
      if (description_units[i].beds !== undefined) {
        result += ` <br><b>Beds:</b> ${description_units[i].beds}`;
      }
      result += `<br>`;
    }
  } else {
    result += `<br><b>Price:</b> ${description_units[0].price}`;
    if (description_units[0].beds !== undefined) {
      result += ` <br><b>Beds:</b> ${description_units[0].beds}`;
    }
    result += `<br>`;
  }

  const description = description_first_part + "<br>" + result;

  // Open a popup with the description at the clicked coordinates
  new mapboxgl.Popup()
    .setLngLat(coordinates)
    .setHTML(description)
    .addTo(map);
});

map.on('click', 'parks_points', (e) => {
  const feature = e.features[0];
  const coordinates = feature.geometry.coordinates.slice();
  const description_info = feature.properties.ASSET_NAME;
  const description = `<b> Park Name: <br> </b> `+ description_info;

  // Open a popup with the description at the clicked coordinates
  new mapboxgl.Popup()
    .setLngLat(coordinates)
    .setHTML(description)
    .addTo(map);
});

map.on('click', 'grocery_points', (e) => {
  const feature = e.features[0];
  const coordinates = feature.geometry.coordinates.slice();
  const description_info = feature.properties.name;
  const description = `<b> Grocery Store: <br> </b> `+ description_info;

  // Open a popup with the description at the clicked coordinates
  new mapboxgl.Popup()
    .setLngLat(coordinates)
    .setHTML(description)
    .addTo(map);
});


/*--------------------------------------------------------------------
CHANGE OF CURSOR STYLE
--------------------------------------------------------------------*/


// Change cursor style when hovering over a TTC stop
map.on('mouseenter', 'TTC_Stops', () => {
  map.getCanvas().style.cursor = 'pointer';
});

// This changes the mouse icon
map.on('mouseleave', 'TTC_Stops', () => {
  map.getCanvas().style.cursor = '';
});

// Change cursor style when hovering over a listing in the 'listings_in' layer
map.on('mouseenter', 'listings_in', () => {
  map.getCanvas().style.cursor = 'pointer';
});

// Reset cursor when leaving the 'listings_in' layer
map.on('mouseleave', 'listings_in', () => {
  map.getCanvas().style.cursor = '';
});

// Change cursor style when hovering over a listing in the 'listings_in' layer
map.on('mouseenter', 'parks_points', () => {
  map.getCanvas().style.cursor = 'pointer';
});

// Reset cursor when leaving the 'listings_in' layer
map.on('mouseleave', 'parks_points', () => {
  map.getCanvas().style.cursor = '';
});

// Change cursor style when hovering over a listing in the 'listings_in' layer
map.on('mouseenter', 'grocery_points', () => {
  map.getCanvas().style.cursor = 'pointer';
});

// Reset cursor when leaving the 'listings_in' layer
map.on('mouseleave', 'grocery_points', () => {
  map.getCanvas().style.cursor = '';
});



/*--------------------------------------------------------------------
LOADS DATA ON THE BAESMAP
--------------------------------------------------------------------*/


// Add the TTC Stops layer with data from the GeoJSON file
map.on('load', () => {

  map.addLayer({
    id: 'TTC_Stops',
    type: 'circle',
    paint: {
      'circle-radius': 8,
      'circle-color': '#36454F', // Corrected circle color with quotes
      'circle-opacity': 0
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

/*--------------------------------------------------------------------
MAKES THE BUFFER SLIDERS HAVE AN ACTUAL VALUE
--------------------------------------------------------------------*/
// Update the displayed value of the buffer sliders (in meters) as the user adjusts them

// Grocery slider
let grocerySlider = document.getElementById("grocery-slider");
let groceryOutput = document.getElementById("grocery-slider-value");
groceryOutput.innerHTML = grocerySlider.value * 1000 + " meters";

grocerySlider.oninput = function() {
  groceryOutput.innerHTML = this.value * 1000 + " meters";
};

// Parks slider
let parksSlider = document.getElementById("parks-slider");
let parksOutput = document.getElementById("parks-slider-value");
parksOutput.innerHTML = parksSlider.value * 1000 + " meters";

parksSlider.oninput = function() {
  parksOutput.innerHTML = this.value * 1000 + " meters";
};

// TTC slider
let ttcSlider = document.getElementById("ttc-slider");
let ttcOutput = document.getElementById("ttc-slider-value");
ttcOutput.innerHTML = ttcSlider.value * 1000 + " meters";

ttcSlider.oninput = function() {
  ttcOutput.innerHTML = this.value * 1000 + " meters";
};
