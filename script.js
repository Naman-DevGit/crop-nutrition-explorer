const API_KEY = "n9dtkBgrcFMdKaNjO7yKbLdJm6geiIRRReuMWIOa";
const API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

const cropList = [
  "wheat", "rice", "tomato", "potato", "banana",
  "spinach", "lentil", "corn", "apple", "chickpea",
  "mango", "carrot", "soybean", "oat", "peanut"
];

let allCrops = [];
let favourites = JSON.parse(localStorage.getItem("favourites")) || [];


async function loadCrops() {

  const status = document.getElementById("statusMsg");
  const container = document.getElementById("cardsContainer");

  status.textContent = "⏳ Fetching crop nutrition data...";
  container.innerHTML = "";

  try {

    const urls = cropList.map(function(cropName) {
      return `${API_URL}?api_key=${API_KEY}&query=${cropName}&pageSize=3&dataType=Foundation,SR%20Legacy`;
    });

    const responses = await Promise.all(
      urls.map(function(url) { return fetch(url); })
    );

    const allData = await Promise.all(
      responses.map(function(response) { return response.json(); })
    );

    let fetchedCrops = [];
    allData.forEach(function(data) {
      if (data && data.foods) {
        fetchedCrops = fetchedCrops.concat(data.foods);
      }
    });

    const seen = new Set();
    allCrops = fetchedCrops.filter(function(crop) {
      let cleanName = (crop.description || "").toLowerCase().split(",")[0].trim();
      if (!cleanName || seen.has(cleanName)) return false;
      seen.add(cleanName);
      return true;
    });

    showCards(allCrops);

  } catch (error) {
    console.error(error);
    status.textContent = "❌ Failed to load data. Please refresh.";
  }
}


function showCards(crops) {

  const container = document.getElementById("cardsContainer");
  const status = document.getElementById("statusMsg");

  container.innerHTML = "";

  if (!crops || crops.length === 0) {
    container.innerHTML = "<p style='text-align:center; color:#888;'>No crops found.</p>";
    status.textContent = "0 results found";
    return;
  }

  status.textContent = `✅ Showing ${crops.length} crops`;

  const cardList = crops.map(function(crop) {
    return buildCard(crop);
  });

  container.innerHTML = cardList.join("");
}


function buildCard(crop) {

  const name     = crop.description || "Unknown";
  const category = crop.foodCategory || "General";
  const calories = getNutrient(crop, "Energy");
  const protein  = getNutrient(crop, "Protein");
  const carbs    = getNutrient(crop, "Carbohydrate");
  const fat      = getNutrient(crop, "Total lipid");

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


function getNutrient(crop, nutrientName) {
  if (!crop || !crop.foodNutrients) return 0;
  const found = crop.foodNutrients.find(function(n) {
    return (n.nutrientName || "").includes(nutrientName);
  });
  return found && found.value ? found.value : 0;
}


function getCategoryKeywords(category) {
  if (category === "cereal")    return ["wheat", "rice", "corn", "oat", "grain", "flour", "maize", "barley"];
  if (category === "vegetable") return ["tomato", "potato", "spinach", "carrot", "onion", "broccoli", "cabbage", "cauliflower", "cucumber", "pumpkin", "garlic", "ginger", "turmeric", "pepper"];
  if (category === "fruit")     return ["apple", "banana", "mango", "orange", "grape", "berry", "watermelon", "strawberry", "pineapple", "papaya", "coconut"];
  if (category === "legume")    return ["lentil", "chickpea", "bean", "pea", "soybean", "peanut"];
  return [];
}


function applyAll() {

  const searchText = document.getElementById("searchInput").value.toLowerCase();
  const category   = document.getElementById("categoryFilter").value;
  const sortBy     = document.getElementById("sortSelect").value;

  let result = allCrops.filter(function(crop) {
    return (crop.description || "").toLowerCase().includes(searchText);
  });

  if (category !== "all") {
    const keywords = getCategoryKeywords(category);
    result = result.filter(function(crop) {
      const name = (crop.description || "").toLowerCase();
      return keywords.some(function(kw) { return name.includes(kw); });
    });
  }

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


function toggleFavourite(fdcId) {

  const id = String(fdcId);

  const alreadyFav = favourites.find(function(savedId) {
    return savedId === id;
  });

  if (alreadyFav) {
    favourites = favourites.filter(function(savedId) {
      return savedId !== id;
    });
  } else {
    favourites.push(id);
  }

  localStorage.setItem("favourites", JSON.stringify(favourites));
  applyAll();
}


document.getElementById("searchInput").addEventListener("input", function() {
  applyAll();
});

document.getElementById("categoryFilter").addEventListener("change", function() {
  applyAll();
});

document.getElementById("sortSelect").addEventListener("change", function() {
  applyAll();
});

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

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  document.getElementById("themeBtn").textContent = "☀️ Light Mode";
}


loadCrops();