let map;
let directionsService;
let directionsRenderer;
let userMarker = null;
let activeButton = null;

const townshipCoordinates = {
  "South Okkalapa": { lat: 16.847343, lng: 96.178970 },
  "Dagon Seikkan": { lat: 16.856670, lng: 96.282780 },
  "North Dagon": { lat: 16.871900, lng: 96.192200 },
  "East Dagon": { lat: 16.901100, lng: 96.211800 },
  "Kamaryut": { lat: 16.823800, lng: 96.132100 },
  "Hlaing": { lat: 16.850826, lng: 96.115593 },
  "Bago": { lat: 17.335210, lng: 96.481350 },
  "Hlaingthaya": { lat: 16.850000, lng: 96.066670 },
  "Maubin": { lat: 16.731500, lng: 95.654400 },
  "Kyaiklat": { lat: 16.442248, lng: 95.722084 },
  "Bogale": { lat: 16.294200, lng: 95.397400 },
  "Pyapon": { lat: 16.285400, lng: 95.678800 },
  "Mayangone": { lat: 16.868876, lng: 96.150604 },
  "North Okkalapa": { lat: 16.908314, lng: 96.158005 },
  "Letpadan": { lat: 17.791715, lng: 95.756315 },
  "Monyo": { lat: 17.983333, lng: 95.500000 },
  "Mingaladon": { lat: 16.907220, lng: 96.133330 },
  "Shwepyithar": { lat: 17.050000, lng: 96.050000 },
  "Kyauktan": { lat: 16.443000, lng: 96.122000 },
  "Kawmhu": { lat: 16.538831492400764, lng: 96.06541755274057 },
  "Dedaye": { lat: 16.400000, lng: 95.883300 },
  "Kwanchaungon": { lat: 16.300000, lng: 95.850000 },
  "Dala": { lat: 16.758330, lng: 96.158330 },
  "Thanlyin": { lat: 16.765852, lng: 96.251495 },
  "Hmawbi": { lat: 17.120000, lng: 96.030000 },
  "Taikkyi": { lat: 17.650000, lng: 96.116700 },
  "Twantay": { lat: 16.716700, lng: 96.016700 },
  "Danubyu": { lat: 17.000000, lng: 95.650000 },
  "Hlegu": { lat: 17.050000, lng: 96.300000 },
  "Shwepyitha": { lat: 17.020000, lng: 96.080000 },
  "Nyaungdon": { lat: 17.050000, lng: 95.450000 }
};

function initMap() {
  // Initialize map centered on Yangon
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 16.8409, lng: 96.1735 },
    zoom: 12,
    mapTypeControl: false,
    streetViewControl: false,
  });

  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: '#3d5afe',
      strokeWeight: 6,
    }
  });
  const overlay = document.getElementById("intro-overlay");
  if (overlay) {
    overlay.style.opacity = "0";
    setTimeout(() => {
      overlay.style.display = "none";
    }, 500); // delay to allow opacity transition
  }

  setupVanButtons();
  setupTownshipClicks();
  setupCloseButtons();

  setupLocateMe();

  setupAutocomplete();

  updateUserLocationOnLoad();
}

function setupVanButtons() {
  const buttons = document.querySelectorAll('.location-button');
  buttons.forEach(btn => {
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-pressed', 'false');

    btn.addEventListener('click', () => activateVan(btn));
    btn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activateVan(btn);
      }
    });
  });
}

function activateVan(button) {
  if (activeButton) {
    activeButton.classList.remove('active');
    activeButton.setAttribute('aria-pressed', 'false');
  }
  button.classList.add('active');
  button.setAttribute('aria-pressed', 'true');
  activeButton = button;

  const vanId = button.dataset.location;

  document.querySelectorAll('.location-info').forEach(panel => {
    const match = panel.id === `location-info-${vanId}`;
    panel.style.display = match ? 'block' : 'none';
    panel.setAttribute('aria-hidden', !match);
  });

  clearRouteAndMarkers();
}

function setupTownshipClicks() {
  document.querySelectorAll('.location-line').forEach(el => {
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');

    function selectTownship() {
      hideAllVanPanelsAndClearButtons();

      const townshipName = el.dataset.place;
      const coords = townshipCoordinates[townshipName];

      if (!coords) {
        alert(`Coordinates not found for ${townshipName}`);
        return;
      }

      // Route from user location (or map center if no user location) to township
      const origin = userMarker ? userMarker.getPosition() : map.getCenter();
      const destination = new google.maps.LatLng(coords.lat, coords.lng);

      map.panTo(destination);
      map.setZoom(14);

      calculateAndDisplayRoute(origin, destination, townshipName);
    }

    el.addEventListener('click', selectTownship);
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectTownship();
      }
    });
  });
}

function hideAllVanPanelsAndClearButtons() {
  document.querySelectorAll('.location-info').forEach(panel => {
    panel.style.display = 'none';
    panel.setAttribute('aria-hidden', 'true');
  });
  if (activeButton) {
    activeButton.classList.remove('active');
    activeButton.setAttribute('aria-pressed', 'false');
    activeButton = null;
  }
  clearRouteAndMarkers();
}

function setupCloseButtons() {
  document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      hideAllVanPanelsAndClearButtons();
    });
  });
}

function setupLocateMe() {
  const locateButton = document.createElement('button');
  locateButton.textContent = '';
  locateButton.classList.add('locate-me-btn');
  locateButton.setAttribute('aria-label', 'Locate Me');
  locateButton.innerHTML = '<i class="fas fa-location-arrow"></i>';
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(locateButton);

  locateButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported by your browser.');
      return;
    }
    locateButton.disabled = true;
    locateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    navigator.geolocation.getCurrentPosition(pos => {
      const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };

      if (!userMarker) {
        userMarker = new google.maps.Marker({
          position: latlng,
          map,
          title: 'Your Location',
          icon: {
            url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            scaledSize: new google.maps.Size(30, 30)
          }
        });
      } else {
        userMarker.setPosition(latlng);
      }

      map.panTo(latlng);
      map.setZoom(14);

      locateButton.disabled = false;
      locateButton.innerHTML = '<i class="fas fa-location-arrow"></i>';
    }, err => {
      alert('Unable to get your location: ' + err.message);
      locateButton.disabled = false;
      locateButton.innerHTML = '<i class="fas fa-location-arrow"></i>';
    }, { enableHighAccuracy: true, timeout: 10000 });
  });
}

function updateUserLocationOnLoad() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(pos => {
    const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    if (!userMarker) {
      userMarker = new google.maps.Marker({
        position: latlng,
        map,
        title: 'Your Location',
        icon: {
          url: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
          scaledSize: new google.maps.Size(30, 30)
        }
      });
    } else {
      userMarker.setPosition(latlng);
    }
    map.panTo(latlng);
    map.setZoom(13);
  }, () => {
    // No user location found: do nothing, keep default center
  });
}

function setupAutocomplete() {
  const input = document.createElement('input');
  input.id = 'search-input';
  input.type = 'text';
  input.placeholder = 'Search township or address...';
  input.setAttribute('aria-label', 'Search township or address');
  input.style.cssText = `
    position: absolute;
    top: 20px;
    left: 320px;
    width: 280px;
    max-width: 90vw;
    padding: 10px 14px;
    border-radius: 10px;
    border: none;
    font-size: 14px;
    font-family: 'Inter', sans-serif;
    box-shadow: 0 0 10px rgba(0,0,0,0.3);
    z-index: 1000;
  `;

  document.body.appendChild(input);

  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    if (!place.geometry) {
      alert('Place not found');
      return;
    }

    clearRouteAndMarkers();

    const origin = userMarker ? userMarker.getPosition() : map.getCenter();
    const destination = place.geometry.location;

    map.panTo(destination);
    map.setZoom(15);

    calculateAndDisplayRoute(origin, destination, place.name);
  });
}

function calculateAndDisplayRoute(origin, destination, destinationName) {
  if (!directionsService || !directionsRenderer) return;

  directionsService.route({
    origin: origin,
    destination: destination,
    travelMode: google.maps.TravelMode.DRIVING,
  }, (response, status) => {
    if (status === google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(response);

      // Add custom markers for start and end
      addOrUpdateMarkers(response);

      // Show info panel with ETA and distance
      showRouteInfo(response.routes[0], destinationName);
    } else {
      alert('Directions request failed due to ' + status);
    }
  });
}

let startMarker = null;
let endMarker = null;

function addOrUpdateMarkers(directionResult) {
  const route = directionResult.routes[0];
  if (!route) return;

  const leg = route.legs[0];
  if (!leg) return;

  if (startMarker) startMarker.setMap(null);
  if (endMarker) endMarker.setMap(null);

  startMarker = new google.maps.Marker({
    position: leg.start_location,
    map,
    title: leg.start_address,
    icon: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  });

  endMarker = new google.maps.Marker({
    position: leg.end_location,
    map,
    title: leg.end_address,
    icon: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  });
}

function showRouteInfo(route, destinationName) {
  let infoPanel = document.getElementById('route-info-panel');
  if (!infoPanel) {
    infoPanel = document.createElement('div');
    infoPanel.id = 'route-info-panel';
    infoPanel.setAttribute('aria-live', 'polite');
    infoPanel.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      max-width: 350px;
      background: rgba(30,30,30,0.8);
      color: white;
      padding: 15px 20px;
      border-radius: 12px;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      box-shadow: 0 0 14px rgba(0,0,0,0.7);
      z-index: 10000;
    `;
    document.body.appendChild(infoPanel);
  }

  const leg = route.legs[0];
  infoPanel.innerHTML = `
    <strong>Route to ${destinationName}</strong><br />
    From: ${leg.start_address} <br />
    To: ${leg.end_address} <br />
    Distance: ${leg.distance.text} <br />
    Estimated Time: ${leg.duration.text} <br />
    <button id="clear-route-btn" aria-label="Clear Route" style="margin-top:10px; cursor:pointer; padding:6px 12px; border:none; border-radius:6px; background:#ff5252; color:#fff; font-weight:600;">Clear Route</button>
  `;

  document.getElementById('clear-route-btn').addEventListener('click', () => {
    clearRouteAndMarkers();
    infoPanel.innerHTML = '';
  });
}

function clearRouteAndMarkers() {
  if (directionsRenderer) directionsRenderer.set('directions', null);
  if (startMarker) {
    startMarker.setMap(null);
    startMarker = null;
  }
  if (endMarker) {
    endMarker.setMap(null);
    endMarker = null;
  }
}

window.initMap = initMap; 
