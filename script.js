document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const cityInput = document.getElementById('cityInput');
    const searchBtn = document.getElementById('searchBtn');
    const celsiusBtn = document.getElementById('celsiusBtn');
    const fahrenheitBtn = document.getElementById('fahrenheitBtn');
    const currentWeather = document.getElementById('currentWeather');
    const forecastCards = document.getElementById('forecastCards');
    const historyList = document.getElementById('historyList');

    // Weather data elements
    const currentCity = document.getElementById('currentCity');
    const currentIcon = document.getElementById('currentIcon');
    const currentTemp = document.getElementById('currentTemp');
    const currentUnit = document.getElementById('currentUnit');
    const currentDesc = document.getElementById('currentDesc');
    const currentFeelsLike = document.getElementById('currentFeelsLike');
    const currentHumidity = document.getElementById('currentHumidity');
    const currentWind = document.getElementById('currentWind');
    const currentPressure = document.getElementById('currentPressure');

    // App state
    let unit = 'metric'; // 'metric' for Celsius, 'imperial' for Fahrenheit
    let searchHistory = JSON.parse(localStorage.getItem('weatherSearchHistory')) || [];

    // API Key (Replace with your own OpenWeatherMap API key)
    const API_KEY = 'fec1ee72f9091b5a6b852f35419e19d3';

    // Initialize the app
    function init() {
        renderSearchHistory();
        addEventListeners();

        // Load last searched city if available
        if (searchHistory.length > 0) {
            fetchWeather(searchHistory[0]);
        }
    }

    // Add event listeners
    function addEventListeners() {
        searchBtn.addEventListener('click', handleSearch);
        cityInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') handleSearch();
        });

        celsiusBtn.addEventListener('click', function () {
            if (unit !== 'metric') {
                unit = 'metric';
                celsiusBtn.classList.add('active');
                fahrenheitBtn.classList.remove('active');
                // Refresh current display with new units
                if (currentCity.textContent !== 'Search for a city') {
                    fetchWeather(currentCity.textContent);
                }
            }
        });

        fahrenheitBtn.addEventListener('click', function () {
            if (unit !== 'imperial') {
                unit = 'imperial';
                fahrenheitBtn.classList.add('active');
                celsiusBtn.classList.remove('active');
                // Refresh current display with new units
                if (currentCity.textContent !== 'Search for a city') {
                    fetchWeather(currentCity.textContent);
                }
            }
        });
    }

    // Handle search
    function handleSearch() {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
            cityInput.value = '';
        }
    }

    // Fetch weather data from API
    async function fetchWeather(city) {
        try {
            // Show loading state
            currentCity.textContent = 'Loading...';
            currentIcon.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            // Fetch current weather
            const currentResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&appid=${API_KEY}`
            );

            if (!currentResponse.ok) {
                throw new Error('City not found');
            }

            const currentData = await currentResponse.json();

            // Fetch forecast
            const forecastResponse = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${API_KEY}`
            );

            const forecastData = await forecastResponse.json();

            // Process and display data
            displayCurrentWeather(currentData);
            displayForecast(forecastData);

            // Add to search history
            addToSearchHistory(city);

        } catch (error) {
            console.error('Error fetching weather data:', error);
            currentCity.textContent = 'Error: City not found';
            currentIcon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            currentTemp.textContent = '--';
            currentDesc.textContent = 'Please try another city name';

            // Clear forecast
            forecastCards.innerHTML = `
                <div class="forecast-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Could not load forecast data</p>
                </div>
            `;
        }
    }

    // Display current weather
    function displayCurrentWeather(data) {
        currentCity.textContent = `${data.name}, ${data.sys.country}`;
        currentTemp.textContent = Math.round(data.main.temp);
        currentUnit.textContent = unit === 'metric' ? '°C' : '°F';
        currentDesc.textContent = data.weather[0].description;
        currentFeelsLike.textContent = Math.round(data.main.feels_like);
        currentHumidity.textContent = data.main.humidity;
        currentWind.textContent = Math.round(data.wind.speed * (unit === 'metric' ? 3.6 : 1)); // Convert to km/h or keep mph
        currentPressure.textContent = data.main.pressure;

        // Set weather icon
        const iconCode = data.weather[0].icon;
        currentIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${iconCode}@2x.png" alt="${data.weather[0].description}">`;
    }

    // Display 5-day forecast
    function displayForecast(data) {
        // Clear previous forecast
        forecastCards.innerHTML = '';

        // Filter to get one entry per day (around midday)
        const dailyForecasts = [];
        const daysAdded = new Set();

        data.list.forEach(item => {
            const date = new Date(item.dt * 1000);
            const day = date.toLocaleDateString('en-US', { weekday: 'short' });

            // Add only one forecast per day (around 12:00)
            if (!daysAdded.has(day)) {
                const hours = date.getHours();
                if (hours >= 11 && hours <= 13) {
                    dailyForecasts.push({
                        day,
                        temp: item.main.temp,
                        temp_min: item.main.temp_min,
                        temp_max: item.main.temp_max,
                        icon: item.weather[0].icon,
                        description: item.weather[0].description
                    });
                    daysAdded.add(day);
                }
            }
        });

        // Display forecast cards
        dailyForecasts.slice(0, 5).forEach(day => {
            const forecastCard = document.createElement('div');
            forecastCard.className = 'forecast-card';

            forecastCard.innerHTML = `
                <div class="forecast-day">${day.day}</div>
                <div class="forecast-icon">
                    <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}">
                </div>
                <div class="forecast-desc">${day.description}</div>
                <div class="forecast-temp">
                    <span class="forecast-high">${Math.round(day.temp_max)}°</span>
                    <span class="forecast-low">${Math.round(day.temp_min)}°</span>
                </div>
            `;

            forecastCards.appendChild(forecastCard);
        });
    }

    // Add to search history
    function addToSearchHistory(city) {
        // Remove if already exists
        searchHistory = searchHistory.filter(item => item.toLowerCase() !== city.toLowerCase());

        // Add to beginning of array
        searchHistory.unshift(city);

        // Limit to 5 items
        if (searchHistory.length > 5) {
            searchHistory.pop();
        }

        // Save to localStorage
        localStorage.setItem('weatherSearchHistory', JSON.stringify(searchHistory));

        // Update UI
        renderSearchHistory();
    }

    // Render search history
    function renderSearchHistory() {
        historyList.innerHTML = '';

        searchHistory.forEach(city => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.textContent = city;
            historyItem.addEventListener('click', () => fetchWeather(city));
            historyList.appendChild(historyItem);
        });
    }

    // Initialize the app
    init();
});