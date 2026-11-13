mapboxgl.accessToken = mapToken;
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: coordinates,
    zoom: 9
});

const popupContent = document.createElement("div");
const titleEl = document.createElement("h4");
titleEl.textContent = listingTitle;
const noteEl = document.createElement("p");
noteEl.className = "mb-2";
noteEl.textContent = "Exact location will be provided after booking";
const dirBtn = document.createElement("button");
dirBtn.type = "button";
dirBtn.className = "btn btn-danger btn-sm rounded-pill w-100 fw-semibold";
dirBtn.textContent = "Directions from My Location";
dirBtn.addEventListener("click", () => {
    if (typeof window.wlOpenMapsDirections === "function") {
        window.wlOpenMapsDirections({ lng: coordinates[0], lat: coordinates[1] });
    }
});
popupContent.appendChild(titleEl);
popupContent.appendChild(noteEl);
popupContent.appendChild(dirBtn);

new mapboxgl.Marker({ color: 'red' })
    .setLngLat(coordinates)
    .setPopup(new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContent))
    .addTo(map);
