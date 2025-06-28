/* A good Practise
saraa kaam ek hii fxn mee nahii karwatee, intead of this hum har different kaam ke liyee different fxn bana sakte hai
jaisee yaha ek fxn joo api koo call & fetch karga aur dusra fxn joo iss fetched data ko user ko display karega
*/

class WeatherApp {
  constructor() {
    this.API_KEY = SECRET_API_KEY;
    this.oldTab = null;
    this.currentTab = null;
    this.currentUnit = 'C';
    this.currentWeatherData = null; // Store current weather data for unit conversion

    this.userTab = document.querySelector("#userWeather");
    this.searchTab = document.querySelector("#searchWeather");
    this.grantAccessContainer = document.querySelector(".grantLocationContainer");
    this.grantAccessButton = document.querySelector("#grantAccessBtn");
    this.searchForm = document.querySelector(".SearchForm");
    this.loadingScreen = document.querySelector(".loadingContainer");
    this.userInfoContainer = document.querySelector(".displayWeatherInfo");
    this.searchInput = document.querySelector("#searchInput");
    this.unitToggle = document.querySelector("#unitToggle");
    this.favoriteBtn = document.querySelector("#favoriteBtn");

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.currentTab = this.userTab;
    this.currentTab.classList.add("current-tab");
    this.getFromSessionStorage();
  }

  setupEventListeners() {
    this.userTab.addEventListener("click", () => this.switchTab(this.userTab));
    this.searchTab.addEventListener("click", () => this.switchTab(this.searchTab));
    this.grantAccessButton.addEventListener("click", () => this.getLocation());
    this.searchForm.addEventListener("submit", (e) => this.handleSearch(e));
    this.unitToggle.addEventListener("click", () => this.toggleTemperatureUnit());
    this.favoriteBtn.addEventListener("click", () => this.toggleFavorite());

    this.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.searchInput.value = "";
        this.searchInput.blur();
      }
    });
  }

  switchTab(newTab) {
    if (newTab !== this.currentTab) {
      this.currentTab.classList.remove("current-tab");
      this.currentTab = newTab;
      this.currentTab.classList.add("current-tab");

      this.userTab.setAttribute("aria-selected", this.currentTab === this.userTab);
      this.searchTab.setAttribute("aria-selected", this.currentTab === this.searchTab);

      if (!this.searchForm.classList.contains("active")) {
        this.hideAllContainers();
        this.searchForm.classList.add("active");
        this.searchForm.setAttribute("aria-hidden", "false");
      } else {
        this.searchForm.classList.remove("active");
        this.searchForm.setAttribute("aria-hidden", "true");
        this.hideAllContainers();
        this.getFromSessionStorage();
      }
    }
  }

  hideAllContainers() {
    this.userInfoContainer.classList.remove("active");
    this.grantAccessContainer.classList.remove("active");
    this.loadingScreen.classList.remove("active");
  }

  getFromSessionStorage() {
    const localCoordinates = sessionStorage.getItem("user-coordinates");
    if (!localCoordinates) {
      this.grantAccessContainer.classList.add("active");
    } else {
      try {
        const coordinates = JSON.parse(localCoordinates);
        this.fetchUserWeatherInfo(coordinates);
      } catch (error) {
        console.error("Error parsing stored coordinates:", error);
        sessionStorage.removeItem("user-coordinates");
        this.grantAccessContainer.classList.add("active");
      }
    }
  }

  async fetchUserWeatherInfo(coordinates) {
    const { latitude, longitude } = coordinates;
    this.hideAllContainers();
    this.loadingScreen.classList.add("active");

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.cod === "404") {
        throw new Error("Location not found");
      }

      this.loadingScreen.classList.remove("active");
      this.userInfoContainer.classList.add("active");
      this.renderWeatherInfo(data);

    } catch (error) {
      console.error("Error fetching weather data:", error);
      this.loadingScreen.classList.remove("active");
      this.showError("Failed to fetch weather data. Please try again.");
    }
  }

  async fetchSearchWeatherInfo(city) {
    this.hideAllContainers();
    this.loadingScreen.classList.add("active");

    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.API_KEY}&units=metric`
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("City not found. Please check the spelling and try again.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.cod === "404") {
        throw new Error("City not found. Please check the spelling and try again.");
      }

      this.loadingScreen.classList.remove("active");
      this.userInfoContainer.classList.add("active");
      this.renderWeatherInfo(data);

    } catch (error) {
      console.error("Error fetching weather data:", error);
      this.loadingScreen.classList.remove("active");
      this.showError(error.message || "Failed to fetch weather data. Please try again.");
    }
  }

  renderWeatherInfo(weatherInfo) {
    this.currentWeatherData = weatherInfo;

    const elements = {
      cityName: document.querySelector("#LocationName"),
      countryIcon: document.querySelector("#LocationFlag"),
      desc: document.querySelector("#WeatherDescription"),
      weatherIcon: document.querySelector("#WeatherIcon"),
      temp: document.querySelector("#LocationTemprature"),
      windSpeed: document.querySelector("#WindSpeed"),
      humidity: document.querySelector("#Humidity"),
      clouds: document.querySelector("#Clouds"),
      lastUpdated: document.querySelector("#lastUpdated")
    };

    try {
      elements.cityName.innerText = weatherInfo?.name || "Unknown Location";
      elements.countryIcon.src = `https://flagcdn.com/144x108/${weatherInfo?.sys?.country?.toLowerCase()}.png`;
      elements.countryIcon.alt = `Flag of ${weatherInfo?.sys?.country || "Unknown"}`;
      elements.desc.innerText = weatherInfo?.weather?.[0]?.description || "Weather information unavailable";
      elements.weatherIcon.src = `http://openweathermap.org/img/w/${weatherInfo?.weather?.[0]?.icon}.png`;
      elements.weatherIcon.alt = weatherInfo?.weather?.[0]?.description || "Weather icon";

      const tempCelsius = weatherInfo?.main?.temp || 0;
      const tempFahrenheit = (tempCelsius * 9 / 5) + 32;
      const displayTemp = this.currentUnit === 'C' ? tempCelsius : tempFahrenheit;
      elements.temp.innerText = `${Math.round(displayTemp)}°${this.currentUnit}`;

      elements.windSpeed.innerText = `${(weatherInfo?.wind?.speed || 0).toFixed(1)} m/s`;
      elements.humidity.innerText = `${weatherInfo?.main?.humidity || 0}%`;
      elements.clouds.innerText = `${weatherInfo?.clouds?.all || 0}%`;

      const now = new Date();
      elements.lastUpdated.innerText = now.toLocaleTimeString();

      const favorites = this.getFavorites();
      this.favoriteBtn.textContent = favorites.includes(weatherInfo.name) ? '❤️' : '🤍';

      this.userInfoContainer.setAttribute("aria-label", `Weather for ${elements.cityName.innerText}`);

    } catch (error) {
      console.error("Error rendering weather info:", error);
      this.showError("Error displaying weather information.");
    }
  }

  getLocation() {
    if (navigator.geolocation) {
      this.grantAccessContainer.classList.remove("active");
      this.loadingScreen.classList.add("active");

      navigator.geolocation.getCurrentPosition(
        (position) => this.showPosition(position),
        (error) => this.handleLocationError(error),
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      this.showError("Geolocation is not supported by this browser.");
    }
  }

  showPosition(position) {
    const userCoordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };

    try {
      sessionStorage.setItem("user-coordinates", JSON.stringify(userCoordinates));
      this.fetchUserWeatherInfo(userCoordinates);
    } catch (error) {
      console.error("Error saving coordinates:", error);
      this.fetchUserWeatherInfo(userCoordinates);
    }
  }

  handleLocationError(error) {
    this.loadingScreen.classList.remove("active");
    let errorMessage = "Unable to retrieve your location.";

    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location access denied. Please allow location access to use this feature.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information unavailable.";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out. Please try again.";
        break;
    }

    this.showError(errorMessage);
    this.grantAccessContainer.classList.add("active");
  }

  handleSearch(e) {
    e.preventDefault();
    const cityName = this.searchInput.value.trim();

    if (cityName === "") {
      this.showError("Please enter a city name.");
      this.searchInput.focus();
      return;
    }

    this.fetchSearchWeatherInfo(cityName);
  }

  toggleTemperatureUnit() {
    this.currentUnit = this.currentUnit === 'C' ? 'F' : 'C';
    this.unitToggle.textContent = this.currentUnit === 'C' ? '°C / °F' : '°F / °C';

    if (this.currentWeatherData) {
      this.renderWeatherInfo(this.currentWeatherData);
    }
  }

  toggleFavorite() {
    if (!this.currentWeatherData) return;

    const cityName = this.currentWeatherData.name;
    const favorites = this.getFavorites();

    if (favorites.includes(cityName)) {
      const updatedFavorites = favorites.filter(city => city !== cityName);
      localStorage.setItem('weather-favorites', JSON.stringify(updatedFavorites));
      this.favoriteBtn.textContent = '🤍';
      this.showError(`${cityName} removed from favorites`);
    } else {
      favorites.push(cityName);
      localStorage.setItem('weather-favorites', JSON.stringify(favorites));
      this.favoriteBtn.textContent = '❤️';
      this.showError(`${cityName} added to favorites`);
    }

    this.updateFavoritesList();
  }

  getFavorites() {
    try {
      const favorites = localStorage.getItem('weather-favorites');
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      console.error('Error reading favorites:', error);
      return [];
    }
  }

  updateFavoritesList() {
    const favoritesList = document.querySelector("#favoritesList");
    const favorites = this.getFavorites();

    if (favorites.length === 0) {
      favoritesList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No favorite cities yet</p>';
      return;
    }

    favoritesList.innerHTML = favorites.map(city => `
      <div class="favorite-item" onclick="weatherApp.searchCity('${city}')">
        <h4>${city}</h4>
        <p>Click to view weather</p>
      </div>
    `).join('');
  }

  searchCity(cityName) {
    this.searchInput.value = cityName;
    this.fetchSearchWeatherInfo(cityName);
    this.switchTab(this.searchTab);
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff6b6b;
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      z-index: 1000;
      font-weight: bold;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }
}

let weatherApp;
document.addEventListener('DOMContentLoaded', () => {
  weatherApp = new WeatherApp();
  weatherApp.updateFavoritesList();
});
