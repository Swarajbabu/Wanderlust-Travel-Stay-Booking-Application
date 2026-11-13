/**
 * Shared cascading State -> City -> Stay dropdown controller.
 * `locationTree` supplies valid States & Cities; `tree` supplies selectable stays.
 */
window.initCascadingStayPicker = function initCascadingStayPicker(config) {
  const {
    stateSelect,
    citySelect,
    staySelect,
    categorySelect,
    destinationInput,
    tree,
    locationTree,
    initial = {},
    defaultStayPlaceholder = "Choose a stay...",
    onStayChange
  } = config || {};

  if (!stateSelect || !citySelect || !staySelect || !tree || !Array.isArray(tree.stays)) {
    return;
  }

  const stateCitySource = (locationTree && Array.isArray(locationTree.stays)) ? locationTree : tree;

  function getCategoryFilteredStays() {
    const chosenCat = categorySelect ? String(categorySelect.value || "").trim() : "";
    if (!chosenCat) return tree.stays;
    return tree.stays.filter((s) => s.category === chosenCat);
  }

  function uniqueSorted(values) {
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }

  function formatStayLabel(stay) {
    const priceText = Number(stay.price || 0).toLocaleString("en-IN");
    return `[${stay.category || "Stay"}] ${stay.title} — ₹${priceText}/night`;
  }

  function syncDestinationInput() {
    if (!destinationInput) return;
    const stateVal = stateSelect.value;
    const cityVal = citySelect.value;
    if (cityVal && stateVal) {
      destinationInput.value = `${cityVal}, ${stateVal}`;
    } else if (stateVal) {
      destinationInput.value = stateVal;
    } else {
      destinationInput.value = "";
    }
  }

  function populateStays() {
    const selectedState = stateSelect.value;
    const selectedCity = citySelect.value;
    const prevStay = staySelect.value || initial.listingId || "";

    staySelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";

    if (!selectedState) {
      placeholder.textContent = "Select a state first...";
      staySelect.appendChild(placeholder);
      staySelect.disabled = true;
      if (typeof onStayChange === "function") onStayChange(null);
      return;
    }

    if (!selectedCity) {
      placeholder.textContent = "Select a city first...";
      staySelect.appendChild(placeholder);
      staySelect.disabled = true;
      if (typeof onStayChange === "function") onStayChange(null);
      return;
    }

    const matchingStays = getCategoryFilteredStays().filter(
      (s) => s.state === selectedState && s.city === selectedCity
    );

    if (matchingStays.length === 0) {
      placeholder.textContent = "Decide stay in chat (no matches in " + selectedCity + ")";
      staySelect.appendChild(placeholder);
      staySelect.disabled = true;
      if (typeof onStayChange === "function") onStayChange(null);
      return;
    }

    placeholder.textContent = defaultStayPlaceholder;
    staySelect.appendChild(placeholder);

    let restoredStay = null;
    matchingStays.forEach((stay) => {
      const opt = document.createElement("option");
      opt.value = stay._id;
      opt.textContent = formatStayLabel(stay);
      opt.dataset.price = String(stay.price || 0);
      opt.dataset.maxguests = String(stay.maxGuests || 4);
      opt.dataset.location = `${stay.location || ""} ${stay.title || ""}`.toLowerCase();
      opt.dataset.category = stay.category || "";
      if (prevStay && prevStay === stay._id) {
        opt.selected = true;
        restoredStay = stay;
      }
      staySelect.appendChild(opt);
    });

    staySelect.disabled = false;
    if (typeof onStayChange === "function") onStayChange(restoredStay);
  }

  function populateCities(preferredCity) {
    const selectedState = stateSelect.value;
    const prevCity = preferredCity !== undefined ? preferredCity : citySelect.value;

    citySelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";

    if (!selectedState) {
      placeholder.textContent = "Select a state first...";
      citySelect.appendChild(placeholder);
      citySelect.disabled = true;
      populateStays();
      return;
    }

    const cities = uniqueSorted(
      stateCitySource.stays
        .filter((s) => s.state === selectedState)
        .map((s) => s.city)
    );

    if (cities.length === 0) {
      placeholder.textContent = "No cities in this state";
      citySelect.appendChild(placeholder);
      citySelect.disabled = true;
      populateStays();
      return;
    }

    placeholder.textContent = "Choose city...";
    citySelect.appendChild(placeholder);
    cities.forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      if (prevCity && prevCity === city) {
        opt.selected = true;
      }
      citySelect.appendChild(opt);
    });

    citySelect.disabled = false;
    populateStays();
  }

  function populateStates(preferredState, preferredCity) {
    const prevState = preferredState !== undefined ? preferredState : stateSelect.value;
    const states = uniqueSorted(stateCitySource.stays.map((s) => s.state));

    stateSelect.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = states.length ? "Choose state..." : "No states available";
    stateSelect.appendChild(placeholder);

    states.forEach((state) => {
      const opt = document.createElement("option");
      opt.value = state;
      opt.textContent = state;
      if (prevState && prevState === state) {
        opt.selected = true;
      }
      stateSelect.appendChild(opt);
    });

    stateSelect.disabled = states.length === 0;
    populateCities(preferredCity);
    syncDestinationInput();
  }

  stateSelect.addEventListener("change", () => {
    populateCities("");
    syncDestinationInput();
  });

  citySelect.addEventListener("change", () => {
    populateStays();
    syncDestinationInput();
  });

  staySelect.addEventListener("change", () => {
    const selectedId = staySelect.value;
    const stay = tree.stays.find((s) => s._id === selectedId) || null;
    if (typeof onStayChange === "function") onStayChange(stay);
  });

  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      populateStays();
    });
  }

  populateStates(initial.state || "", initial.city || "");
  if (initial.listingId && staySelect.querySelector(`option[value="${initial.listingId}"]`)) {
    staySelect.value = initial.listingId;
    const stay = tree.stays.find((s) => s._id === initial.listingId) || null;
    if (typeof onStayChange === "function") onStayChange(stay);
  }
};

/**
 * Cascading State -> City dropdown controller for search/filter bars.
 */
window.initStateCityFilter = function initStateCityFilter({ stateSelect, citySelect, tree, initialState = "", initialCity = "" }) {
  if (!stateSelect || !citySelect || !tree || !Array.isArray(tree.states)) return;

  function renderCities(selectedState, targetCity) {
    citySelect.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = selectedState ? "All Cities in " + selectedState : "All Cities";
    citySelect.appendChild(allOpt);

    const cities = selectedState
      ? ((tree.citiesByState && tree.citiesByState[selectedState]) || [])
      : Array.from(new Set((tree.stays || []).map((s) => s.city))).sort((a, b) => a.localeCompare(b));

    cities.forEach((city) => {
      const opt = document.createElement("option");
      opt.value = city;
      opt.textContent = city;
      if (targetCity && targetCity === city) opt.selected = true;
      citySelect.appendChild(opt);
    });
  }

  stateSelect.addEventListener("change", () => {
    renderCities(stateSelect.value, "");
  });

  renderCities(initialState || stateSelect.value, initialCity);
};
