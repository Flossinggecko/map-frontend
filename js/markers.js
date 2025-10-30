let markers = [];
let markerLayer = null;


function createPinIcon(locationType) {
    const iconConfig = CONFIG.pinIcons[locationType] || CONFIG.pinIcons.default;
    return L.icon(iconConfig);
}


function addAllMarkers(locations = CAMPUS_LOCATIONS) {
    clearMarkers();
    markerLayer = L.layerGroup().addTo(map);

    locations.forEach(location => addMarker(location));
    console.log(`Added ${locations.length} markers to map`);
}


function addMarker(location) {
    const icon = createPinIcon(location.type);

    const marker = L.marker([location.lat, location.lng], {
        icon: icon,
        title: location.name
    });

    marker.locationData = location;

    marker.on('click', async function () {
        showBuildingInfo(location);
        updateSelectedLocation(location);

        // Fetch images dynamically
        const images = await fetchBuildingImages(location.buildingId);
        populateBuildingCarousel(images);

        document.getElementById('buildingPopup').style.display = 'block';
    });

    if (markerLayer) marker.addTo(markerLayer);
    else marker.addTo(map);

    markers.push(marker);
    return marker;
}


function clearMarkers() {
    if (markerLayer) map.removeLayer(markerLayer);

    markers.forEach(marker => {
        if (map.hasLayer(marker)) map.removeLayer(marker);
    });

    markers = [];
}


function getLocationsByType(type) {
    if (!type || type === 'all') return CAMPUS_LOCATIONS;
    return CAMPUS_LOCATIONS.filter(loc => loc.type?.toLowerCase() === type.toLowerCase());
}

function filterMarkers(type) {
    if (typeof showBuildingPolygons === 'function') showBuildingPolygons();
    const filtered = getLocationsByType(type);
    addAllMarkers(filtered);
}


function highlightMarker(locationId) {
    const location = CAMPUS_LOCATIONS.find(loc => loc.id === locationId);
    if (location) {
        map.setView([location.lat, location.lng], 18);
        showBuildingInfo(location);
    }
}


function searchAndDisplayMarkers(query) {
    if (!query) {
        addAllMarkers(CAMPUS_LOCATIONS);
        return CAMPUS_LOCATIONS;
    }

    const lowerQuery = query.toLowerCase();
    const results = CAMPUS_LOCATIONS.filter(location =>
        location.name.toLowerCase().includes(lowerQuery) ||
        (location.type || '').toLowerCase().includes(lowerQuery)
    );

    addAllMarkers(results);
    if (results.length > 0) map.setView([results[0].lat, results[0].lng], 17);

    return results;
}


async function fetchBuildingImages(buildingId) {
    try {
        const res = await fetch(`https://map-backend-tdgk.onrender.com/api/building-images/${buildingId}`);
        if (!res.ok) throw new Error('Failed to fetch images');
        const data = await res.json();
        return data.images || [];
    } catch (err) {
        console.error(err);
        return [];
    }
}

function populateBuildingCarousel(images) {
    const slidesContainer = document.getElementById('carouselSlides');
    const counter = document.getElementById('carouselCounter');
    slidesContainer.innerHTML = '';

    images.forEach((img, i) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-slide';
        slide.innerHTML = `
            <img src="${img.url}" alt="${img.title}">
            <h4>${img.title}</h4>
            <p>${img.description}</p>
        `;
        slidesContainer.appendChild(slide);
    });

    counter.textContent = `1 / ${images.length || 1}`;
    initCarouselControls();
}
