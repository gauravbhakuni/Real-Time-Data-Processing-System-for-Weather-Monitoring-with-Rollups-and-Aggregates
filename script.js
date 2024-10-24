import { API_KEY } from './config.js';

let currCity = "Delhi"

let cityy = document.querySelector(".weather__city")
let datetime = document.querySelector(".weather__datetime")
let weather__forecast = document.querySelector(".weather__forecast")
let weather__temperature = document.querySelector(".weather__temperature")
let weather__icon = document.querySelector(".weather__icon")
let weather__minmax = document.querySelector(".weather__minmax")
let weather__realfeel = document.querySelector(".weather__realfeel")
let weather__humidity = document.querySelector(".weather__humidity")
let weather__wind = document.querySelector(".weather__wind")
let weather__pressure = document.querySelector(".weather__pressure")

export function fetchWeather(city) {
  console.log(`Fetching weather for ${city}`); // Debugging log
  currCity = city;
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}`)
    .then(response => response.json())
    .then(data => {
      console.log('Weather data:', data); // Debugging log

      if (data && data.main) {
        displayWeather(city, data);
      } else {
        console.error('No valid data received');
      }
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

let cityWeatherData = {}; // Store weather data for each city over time
const alertThresholds = {
  temperature: 35, // Threshold for temperature alerts (in Celsius)
};

function convertCountryCode(country) {
  let regionNames = new Intl.DisplayNames(["en"], { type: "region" });
  return regionNames.of(country)
}

function convertTimeStamp(timestamp, timezone) {
  const convertTimeZone = timezone / 3600
  const date = new Date(timestamp * 1000)

  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    timezone: `Etc/GMT${convertTimeZone >= 0 ? "-" : "+"}${Math.abs(convertTimeZone)}`,
    hour12: true,
  }

  return date.toLocaleString("en-US", options)
}

function updateDailySummary(city, data) {
  const today = new Date().toLocaleDateString();

  if (!cityWeatherData[city]) {
    cityWeatherData[city] = {};
  }

  if (!cityWeatherData[city][today]) {
    cityWeatherData[city][today] = {
      temperatures: [],
      conditions: [],
    };
  }

  const tempInCelsius = kelvinToCelsius(data.main.temp);
  cityWeatherData[city][today].temperatures.push(tempInCelsius);
  cityWeatherData[city][today].conditions.push(data.weather[0].main);

  // Trigger daily summary calculations
  calculateDailySummary(city, today);
}

function calculateDailySummary(city, date) {
  // Fetch the data for the specified city and date
  const data = cityWeatherData[city][date];

  // Ensure that the temperatures array is defined and not empty
  if (!data || !data.temperatures || data.temperatures.length === 0) {
    console.error('Temperature data is not available');
    return;
  }

  const temps = data.temperatures.map(temp => parseFloat(temp)).filter(temp => !isNaN(temp));

  // Ensure there are valid temperatures
  if (temps.length === 0) {
    console.error('No valid temperature data available');
    return;
  }

  const avgTemp = (temps.reduce((sum, t) => sum + t, 0) / temps.length).toFixed(2);
  const maxTemp = Math.max(...temps).toFixed(2);
  const minTemp = Math.min(...temps).toFixed(2);

  // Calculate the dominant weather condition (most frequent)
  const conditionCounts = data.conditions.reduce((acc, cond) => {
    acc[cond] = (acc[cond] || 0) + 1;
    return acc;
  }, {});
  
  const dominantCondition = Object.keys(conditionCounts).reduce((a, b) =>
    conditionCounts[a] > conditionCounts[b] ? a : b
  );

  // Update the summary section on the screen
  const summaryDiv = document.getElementById('daily-summary');
  summaryDiv.innerHTML = `
    <h3>Daily Summary for ${city} on ${date}:</h3>
    <p><strong>Average Temperature:</strong> <span>${avgTemp}°C</span></p>
    <p><strong>Max Temperature:</strong> <span>${maxTemp}°C</span></p>
    <p><strong>Min Temperature:</strong> <span>${minTemp}°C</span></p>
    <p><strong>Dominant Condition:</strong> <span>${dominantCondition}</span></p>
  `;

  summaryDiv.style.display = 'block';
}


function checkAlertThresholds(city, tempInCelsius) {
  if (tempInCelsius > alertThresholds.temperature) {
    console.log(`Alert: Temperature in ${city} exceeds ${alertThresholds.temperature}°C`);
  }
}

function displayWeather(city, data) {
  const tempInCelsius = kelvinToCelsius(data.main.temp);

  // Update daily weather summary and check alert
  updateDailySummary(city, data);
  checkAlertThresholds(city, tempInCelsius);

  cityy.innerHTML = `${data.name}, ${convertCountryCode(data.sys.country)}`
  datetime.innerHTML = convertTimeStamp(data.dt, data.timezone)
  weather__forecast.innerHTML = `<p>${data.weather[0].main}</p>`
  weather__temperature.innerHTML = `${kelvinToCelsius(data.main.temp)} &#176C`
  weather__icon.innerHTML = `<img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png"/>`
  weather__minmax.innerHTML = `<p>Min : ${data.main.temp_min.toFixed()}&#176</p> <p>Max : ${data.main.temp_max.toFixed()}&#176</p>`
  weather__realfeel.innerHTML = `${data.main.feels_like} &#176`
  weather__humidity.innerHTML = `${data.main.humidity.toFixed()} %`
  weather__wind.innerHTML = `${data.wind.speed} m/s`
  weather__pressure.innerHTML = `${data.main.pressure.toFixed()} hPa`
  console.log("success")
}

function kelvinToCelsius(kelvin) {
  return (kelvin - 273.15).toFixed(2);
}

document.body.addEventListener("load", fetchWeather(currCity));
setInterval(() => {
  fetchWeather(currCity);
}, 3000000);