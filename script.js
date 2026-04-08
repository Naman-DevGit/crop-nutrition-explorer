const API_KEY = "buUidRwG4B7hBH57jOJnCcGFnwfe8y9PvfNRhNiC";
const API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

const cropList = [
  "wheat", "rice", "tomato", "potato", "banana",
  "spinach", "lentil", "corn", "apple", "chickpea",
  "mango", "onion", "garlic", "carrot", "soybean",
  "barley", "oat", "peanut", "orange", "grapes",
  "broccoli", "cauliflower", "cabbage", "cucumber", "pumpkin",
  "watermelon", "strawberry", "pineapple", "papaya", "ginger",
  "turmeric", "pepper", "mustard", "sunflower", "coconut"
];

let allCrops = [];

// MILESTONE 3 — stores favourite crop IDs in localStorage
let favourites = JSON.parse(localStorage.getItem("favourites")) || [];




async function loadCrops() {

  const status = document.getElementById("statusMsg");
  const container = document.getElementById("cardsContainer");

  status.textContent = "⏳ Fetching crop nutrition data...";
  container.innerHTML = "";

  try {

    let fetchedCrops = [];

    for (let cropName of cropList) {

      const url = `${API_URL}?api_key=${API_KEY}&query=${cropName}&pageSize=5&dataType=Foundation,SR%20Legacy`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API failed for ${cropName}`);
      }

      const data = await response.json();

      if (data && data.foods) {
        fetchedCrops = fetchedCrops.concat(data.foods);
      }
    }

    const seen = new Set();

    allCrops = fetchedCrops.filter(crop => {

      let name = (crop.description || "").toLowerCase();

      if (!name) return false;

      let cleanName = name.split(",")[0].trim();

      if (seen.has(cleanName)) return false;

      seen.add(cleanName);
      return true;
    });

    showCards(allCrops);

  } catch (error) {
    console.error(error);
    status.textContent = "❌ Failed to load data.";
  }
}


//Cards...

function showCards(crops) {

  const container = document.getElementById("cardsContainer");
  const status = document.getElementById("statusMsg");

  container.innerHTML = "";

  if (!crops || crops.length === 0) {
    container.innerHTML = "<p>No crops found</p>";
    status.textContent = "0 results";
    return;
  }

  status.textContent = `✅ Showing ${crops.length} crops`;

  const cardList = crops.map(crop => buildCard(crop));
  container.innerHTML = cardList.join("");
}


// Build Card...
// MILESTONE 3 — added Carbs, Fat and Favourites button

function buildCard(crop) {

  const name     = crop.description || "Unknown";
  const category = crop.foodCategory || "General";
  const calories = getNutrient(crop, "Energy");
  const protein  = getNutrient(crop, "Protein");

  // MILESTONE 3 — two new nutrients added
  const carbs = getNutrient(crop, "Carbohydrate");
  const fat   = getNutrient(crop, "Total lipid");

  // MILESTONE 3 — check if crop is in favourites using .find()
  const isFav = favourites.find(function(id) {
    return id === String(crop.fdcId);
  });

  const heartLabel = isFav ? "❤️ Remove Favourite" : "🤍 Add to Favourites";

  return `
    <div class="card">
      <h3>${name}</h3>
      <p>${category}</p>
      <div class="nutrient"><span>Calories</span><span>${calories.toFixed(0)} kcal</span></div>
      <div class="nutrient"><span>Protein</span><span>${protein.toFixed(1)} g</span></div>
      <div class="nutrient"><span>Carbs</span><span>${carbs.toFixed(1)} g</span></div>
      <div class="nutrient"><span>Fat</span><span>${fat.toFixed(1)} g</span></div>
      <button class="fav-btn" onclick="toggleFavourite('${crop.fdcId}')">
        ${heartLabel}
      </button>
    </div>
  `;
}


// GET NUTRIENT...

function getNutrient(crop, nutrientName) {

  if (!crop || !crop.foodNutrients) return 0;

  const found = crop.foodNutrients.find(n =>
    (n.nutrientName || "").includes(nutrientName)
  );

  return found && found.value ? found.value : 0;
}


// SEARCH FUNCTION
// MILESTONE 3 — updated to call applyAll() so it works with filter and sort

function searchCrops() {
  applyAll();
}

document
  .getElementById("searchInput")
  .addEventListener("input", searchCrops);



// MILESTONE 3 — CATEGORY FILTER
// Uses .filter() HOF


function getCategoryKeywords(category) {
  if (category === "cereal")    return ["wheat", "rice", "corn", "oat", "grain", "flour", "maize", "barley"];
  if (category === "vegetable") return ["tomato", "potato", "spinach", "carrot", "onion", "broccoli", "cabbage", "cauliflower", "cucumber", "pumpkin", "garlic", "ginger", "turmeric", "pepper"];
  if (category === "fruit")     return ["apple", "banana", "mango", "orange", "grape", "berry", "watermelon", "strawberry", "pineapple", "papaya", "coconut"];
  if (category === "legume")    return ["lentil", "chickpea", "bean", "pea", "soybean", "peanut", "mustard"];
  return [];
}

document.getElementById("categoryFilter").addEventListener("change", function() {
  applyAll();
});


// MILESTONE 3 — SORT
// Uses .sort() HOF


document.getElementById("sortSelect").addEventListener("change", function() {
  applyAll();
});



// MILESTONE 3 — applyAll
// Runs search + filter + sort together

function applyAll() {

  const searchText = document.getElementById("searchInput").value.toLowerCase();
  const category   = document.getElementById("categoryFilter").value;
  const sortBy     = document.getElementById("sortSelect").value;

  // Search using .filter()
  let result = allCrops.filter(function(crop) {
    return (crop.description || "").toLowerCase().includes(searchText);
  });

  // Category filter using .filter()
  if (category !== "all") {
    const keywords = getCategoryKeywords(category);
    result = result.filter(function(crop) {
      const name = (crop.description || "").toLowerCase();
      return keywords.some(function(kw) {
        return name.includes(kw);
      });
    });
  }

  // Sort using .sort()
  if (sortBy === "protein") {
    result = result.sort(function(a, b) {
      return getNutrient(b, "Protein") - getNutrient(a, "Protein");
    });
  } else if (sortBy === "calories") {
    result = result.sort(function(a, b) {
      return getNutrient(b, "Energy") - getNutrient(a, "Energy");
    });
  } else if (sortBy === "name") {
    result = result.sort(function(a, b) {
      return (a.description || "").localeCompare(b.description || "");
    });
  }

  showCards(result);
}


// MILESTONE 3 — FAVOURITES
// Uses .find() and .filter() HOFs
// Saves to localStorage


function toggleFavourite(fdcId) {

  const id = String(fdcId);

  // Check if already saved using .find()
  const alreadyFav = favourites.find(function(savedId) {
    return savedId === id;
  });

  if (alreadyFav) {
    // Remove using .filter()
    favourites = favourites.filter(function(savedId) {
      return savedId !== id;
    });
  } else {
    // Add to favourites
    favourites.push(id);
  }

  // Save to localStorage
  localStorage.setItem("favourites", JSON.stringify(favourites));

  // Re-render cards
  applyAll();
}


// MILESTONE 3 — DARK / LIGHT MODE
// Saves preference to localStorage

document.getElementById("themeBtn").addEventListener("click", function() {

  document.body.classList.toggle("dark");

  if (document.body.classList.contains("dark")) {
    document.getElementById("themeBtn").textContent = "☀️ Light Mode";
  } else {
    document.getElementById("themeBtn").textContent = "🌙 Dark Mode";
  }

  const theme = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", theme);
});

// Apply saved theme when page opens
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  document.getElementById("themeBtn").textContent = "☀️ Light Mode";
}


// START

loadCrops();