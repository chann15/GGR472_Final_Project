# Housing Navigator

## Overview
The **Housing Navigator** is a web-based tool designed to assist students in locating housing options based on accessibility to essential amenities such as grocery stores, parks, and public transit (TTC). The project integrates **Mapbox GL JS**, **Bootstrap**, and **Turf.js** to provide interactive mapping and filtering capabilities.

## Features
- **Display Amenities**: Including TTC stations, grocery stores, parks, and housing units.
- **Search Functionality**: Uses Mapbox Geocoder for location-based searches.
- **Travel Mode Filters**: Allows users to filter results based on walking, cycling, or driving.
- **Distance-Based Filters**: Users can customize search criteria by adjusting sliders for amenities within specific distances.
- **Dynamic Data Display**: Interactive buttons allow toggling of grocery stores and parks.
- **Unit Generation**: Users can generate unit listings based on the applied filters.

## Technologies Used
- **Mapbox GL JS**: Interactive mapping and geospatial visualization.
- **Bootstrap 5**: Responsive design and UI components.
- **Turf.js**: Geospatial calculations for proximity analysis.
- **JavaScript, HTML, CSS**: Core web technologies for frontend development.

## File Structure
```
/housing-navigator
│── index.html  # Main HTML file
│── style.css   # Stylesheet
│── script.js   # JavaScript functionality
```

## Usage
1. Open `index.html` in a web browser.
2. Use the **search bar** to find a location.
3. Adjust **travel mode** (walking, cycling, driving).
4. Modify **distance sliders** to filter results.
5. Click **Generate Units** to display available housing options.
6. Click **TTC Stations** if you have a preferred station and specific distance from UofT campus

## Dependencies
Ensure you have an active **Mapbox API key** if you are modifying and hosting this project.


