mapboxgl.accessToken = 'pk.eyJ1IjoiY2hhbm5pNDIiLCJhIjoiY201cjdmdmJxMDdodTJycHc2a3ExMnVqaiJ9.qKDYRE5K3C9f05Cj_JNbWA'; // Add default public map token from your Mapbox account

const map = new mapboxgl.Map({
    container: 'my-map', // container id
    style: 'mapbox://styles/mapbox/streets-v12', // stylesheet
    center: [-74.2709, 40.48972],
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
                        [-74.2709, 40.48972],
                        [-74.2709, 40.93288],
                        [-73.7042, 40.93288],
                        [-73.7042, 40.48972],
                        [-74.2709, 40.48972]
                    ]
                ]
            }
        }
    ]
};

const points = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "coordinates": [
            -74.00178468153797,
            40.71552508299132
          ],
          "type": "Point"
        }
      },
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "coordinates": [
            -74.19868417248696,
            40.97368645894693
          ],
          "type": "Point"
        }
      },
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "coordinates": [
            -74.75334033291878,
            40.21853904387291
          ],
          "type": "Point"
        }
      },
      {
        "type": "Feature",
        "properties": {},
        "geometry": {
          "coordinates": [
            -73.85465429796083,
            40.84744097424846
          ],
          "type": "Point"
        }
      }
    ]
};

const num_points = points.features.length; // Get the total number of points

let num_points_in = [];
for (let i = 0; i < num_points; i++) {
  // Check if the point is inside the polygon using turf.booleanContains
  if (turf.booleanContains(box.features[0], points.features[i])) {
    num_points_in.push(points.features[i]); // Add point to the array if inside the polygon
  }
}

console.log(num_points_in); // Log the points inside the bounding box


console.log(turf.booleanContains(box.features[0], points.features[0])); 



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
        data: {
            "type": "FeatureCollection",
            "features": num_points_in // Wrap the points inside a GeoJSON FeatureCollection
        }
    }
});
});

