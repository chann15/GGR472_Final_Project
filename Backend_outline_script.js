
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
//----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


    grocery_store_buffers = [];
    parks_buffers = [];
    ttc_buffers = [];

    if (document.getElementById('grocery-checkbox').checked) {
        // Code to execute if the checkbox is checked
        const grocerySliderValue = parseFloat(document.getElementById('grocery-slider').value);
        var buffered = turf.buffer(groceryResponse, grocerySliderValue, { units: "kilometers" });
        grocery_store_buffers.push(buffered);        
    };
    if (document.getElementById('parks-checkbox').checked) {
        // Code to execute if the checkbox is checked
        const parksSliderValue = parseFloat(document.getElementById('parks-slider').value);
        var buffered1 = turf.buffer(parksResponse, parksSliderValue, { units: "kilometers" });
        parks_buffers.push(buffered1);        
    };
    if (document.getElementById('ttc-checkbox').checked) {
        // Code to execute if the checkbox is checked
        const ttcSliderValue = parseFloat(document.getElementById('ttc-slider').value);
        var buffered2 = turf.buffer(ttcResponse, ttcSliderValue, { units: "kilometers" });
        ttc_buffers.push(buffered2);        
    };

    // Combine all the buffers into one GeoJSON object
    const all_buffers = {
        type: "FeatureCollection",
        features: grocery_store_buffers.concat(parks_buffers).concat(ttc_buffers)
    };

    total_buffers = all_buffers.features.length;
    filteredPoints = [];

    // Loop through the listing data and check if points are inside the buffer polygons using Turf.js
    for (let i = 0; i < num_points_in.length; i++) {
        // Check if the point is inside the buffer polygons using Turf.js
        for (let j = 0; j < total_buffers; j++) {
            if (turf.booleanPointInPolygon(num_points_in[i], all_buffers.features[j])) {
                filteredPoints.push(num_points_in[i]); // Add points inside the buffer polygons to the array
            }
        }
    };
  
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
  