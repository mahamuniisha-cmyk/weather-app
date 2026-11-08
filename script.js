
// Get HTML elements
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const weatherIcon = document.querySelector(".weather-icon");

const forecastBox = document.getElementById("forecast");
const recentCitiesBox = document.getElementById("recentCities");

// Load recently searched cities
let recentCities = JSON.parse(
    localStorage.getItem("recentCities")
) || [];

// Get weather description and icon
function getWeatherInfo(code) {
    const weatherConditions = {
        0: ["Clear Sky", "☀️"],
        1: ["Mainly Clear", "🌤️"],
        2: ["Partly Cloudy", "⛅"],
        3: ["Overcast", "☁️"],
        45: ["Foggy", "🌫️"],
        48: ["Foggy", "🌫️"],
        51: ["Light Drizzle", "🌦️"],
        53: ["Drizzle", "🌦️"],
        55: ["Heavy Drizzle", "🌧️"],
        61: ["Light Rain", "🌧️"],
        63: ["Rain", "🌧️"],
        65: ["Heavy Rain", "🌧️"],
        71: ["Light Snow", "🌨️"],
        73: ["Snow", "❄️"],
        75: ["Heavy Snow", "❄️"],
        80: ["Rain Showers", "🌦️"],
        81: ["Rain Showers", "🌧️"],
        82: ["Heavy Rain Showers", "⛈️"],
        95: ["Thunderstorm", "⛈️"],
        96: ["Thunderstorm with Hail", "⛈️"],
        99: ["Heavy Thunderstorm", "⛈️"]
    };

    return weatherConditions[code] || ["Unknown Weather", "🌡️"];
}

// Display 5-day forecast
function displayForecast(daily) {
    forecastBox.innerHTML = "";

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i] + "T00:00:00");

        const day = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const info = getWeatherInfo(daily.weather_code[i]);

        const card = document.createElement("div");
        card.classList.add("forecast-card");

        card.innerHTML = `
            <h3>${day}</h3>
            <div class="forecast-icon">${info[1]}</div>
            <p>${info[0]}</p>
            <p>
                ${Math.round(daily.temperature_2m_max[i])}°C /
                ${Math.round(daily.temperature_2m_min[i])}°C
            </p>
        `;

        forecastBox.appendChild(card);
    }
}

// Display recently searched cities
function displayRecentCities() {
    recentCitiesBox.innerHTML = "";

    recentCities.forEach(function(city) {
        const button = document.createElement("button");

        button.textContent = city;
        button.classList.add("recent-city");

        button.addEventListener("click", function() {
            cityInput.value = city;
            getWeather();
        });

        recentCitiesBox.appendChild(button);
    });
}

// Save recently searched city
function saveRecentCity(city) {
    recentCities = recentCities.filter(function(item) {
        return item.toLowerCase() !== city.toLowerCase();
    });

    recentCities.unshift(city);

    // Keep only the latest 5 cities
    recentCities = recentCities.slice(0, 5);

    localStorage.setItem(
        "recentCities",
        JSON.stringify(recentCities)
    );

    displayRecentCities();
}

// Get weather information
async function getWeather() {
    const city = cityInput.value.trim();

    if (city === "") {
        alert("Please enter a city name!");
        return;
    }

    try {
        searchBtn.textContent = "Loading...";
        searchBtn.disabled = true;

        // Find city coordinates
        const geoURL =
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Unable to search for this city.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found. Please try another city.");
        }

        const location = geoData.results[0];

        // Get weather using latitude and longitude
        const weatherURL =
            `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto&wind_speed_unit=kmh`;

        const weatherResponse = await fetch(weatherURL);

        if (!weatherResponse.ok) {
            throw new Error("Unable to get weather information.");
        }

        const weatherData = await weatherResponse.json();

        // Update current weather
        const current = weatherData.current;
        const info = getWeatherInfo(current.weather_code);

        cityName.textContent =
            `${location.name}, ${location.country}`;

        temperature.textContent =
            `${Math.round(current.temperature_2m)}°C`;

        description.textContent = info[0];

        weatherIcon.textContent = info[1];

        humidity.textContent =
            `${current.relative_humidity_2m}%`;

        wind.textContent =
            `${current.wind_speed_10m} km/h`;

        // Display forecast
        displayForecast(weatherData.daily);

        // Save city in recent searches
        saveRecentCity(location.name);

    } catch (error) {
        alert(error.message);

    } finally {
        searchBtn.textContent = "Search";
        searchBtn.disabled = false;
    }
}

// Search button click
searchBtn.addEventListener("click", getWeather);

// Search when Enter key is pressed
cityInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        getWeather();
    }
});

// Display saved cities when app opens
displayRecentCities();

// Load default city when app opens
cityInput.value = "Kolhapur";
getWeather();
