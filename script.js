

const API_KEY = "buUidRwG4B7hBH57jOJnCcGFnwfe8y9PvfNRhNiC";
const API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

const cropList = ["wheat", "rice", "tomato", "potato", "banana", "spinach", "lentil", "corn", "apple", "chickpea"];

let allCrops = [];




async function loadCrops() {

  const status = document.getElementById("statusMsg");
  const container = document.getElementById("cardsContainer");

  status.textContent = "⏳ Fetching crop nutrition data...";
  container.innerHTML = "";

  try {

    let fetchedCrops = [];

    for (let cropName of cropList) {

      
      const url = `${API_URL}?api_key=${API_KEY}&query=${cropName}&pageSize=8`;

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

      // clean name (remove extra variations)
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

function buildCard(crop) {

  const name = crop.description || "Unknown";
  const category = crop.foodCategory || "General";

  const calories = getNutrient(crop, "Energy");
  const protein = getNutrient(crop, "Protein");

  return `
    <div class="card">
      <h3>${name}</h3>
      <p>${category}</p>
      <p>Calories: ${calories.toFixed(0)} kcal</p>
      <p>Protein: ${protein.toFixed(1)} g</p>
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



// SEARCH FUNCTION (REQUIRED FEATURE)

function searchCrops() {

  const searchText = document
    .getElementById("searchInput")
    .value.toLowerCase();

  const filtered = allCrops.filter(crop =>
    (crop.description || "").toLowerCase().includes(searchText)
  );

  showCards(filtered);
}


// EVENT LISTENER


document
  .getElementById("searchInput")
  .addEventListener("input", searchCrops);



// START


loadCrops();