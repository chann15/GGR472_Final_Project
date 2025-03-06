mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhbm5pNDIiLCJhIjoiY201cjdmdmJxMDdodTJycHc2a3ExMnVqaiJ9.qKDYRE5K3C9f05Cj_JNbWA'; // Add default public map token from your Mapbox account



const map = new mapboxgl.Map({
    container: 'my-map', // container id
    style: 'mapbox://styles/mapbox/streets-v12', // stylesheet
    center: [-79.3832, 43.6532],
    zoom: 8 // starting zoom
  });


  const box = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [-79.639, 43.653], // Southwest
                        [-79.639, 43.755], // Southeast
                        [-79.377, 43.755], // Northeast
                        [-79.377, 43.653], // Northwest
                        [-79.639, 43.653]  // Closing
                    ]
                ]
            }
        }
    ]
};
  

let listing_data;
let listing_in_iso;


fetch('https://raw.githubusercontent.com/chann15/GGR472_Final_Project/refs/heads/main/Data/Whole_dataset_reformated.geojson')
    .then(response => response.json())
    .then(response => {
        console.log(response); //Check response in console
        listing_data = response; // Store geojson as variable using URL from fetch response

        listing_length = listing_data.features.length;
        console.log(listing_length)

        console.log(response[0])

        listing_in_iso = [];
        for (let i = 0; i <listing_length; i++){
            if(turf.booleanContains(box.features[0], listing_data[i])){
                listing_in_iso.push(listing_data[i]);
            }
        }
    });


//The error stems from the fact that I can't store the data. the response data is correct but not the rest of it




const points = {
    "type": "FeatureCollection",
    "features": listing_in_iso
};






map.on('load', () => {
  map.addLayer({
      id: 'line-bounding-box',
      type: 'fill',
      paint: {
          'fill-color': '#3386c0',
          'fill-opacity': 0.5
      },
      source: {
          type: 'geojson',
          data: box
      }
  });

  map.addLayer({
    id: 'random_points',
    type: 'circle',
    paint: {
        'circle-radius': 8,
        'circle-color': '#FF0000' // Corrected circle color with quotes
    },
    source: {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/chann15/GGR472_Final_Project/refs/heads/main/Data/Whole_dataset_reformated.geojson'
    }
});
});

