import { useState } from "react";

export function WeatherDashboard() {
  // instead of requesting data from an API, use this mock data
  const mockWeatherData = {
    "New York": {
      temperature: "22°C",
      humidity: "56%",
      windSpeed: "15 km/h",
    },
    "Los Angeles": {
      temperature: "27°C",
      humidity: "45%",
      windSpeed: "10 km/h",
    },
    London: {
      temperature: "15°C",
      humidity: "70%",
      windSpeed: "20 km/h",
    },
  };

  const AMOUT_OF_PREV_SELECTED_CITIES = 5;

  const [filteredCityList, setFilteredCityList] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [historySearch, setHistorySearch] = useState([]);

  const onChangeCitySearch = (citySearchev) => {
    let citySearch = ev.target.value?.trim().toLowerCase();
    setFilteredCityList(
      Object.keys(mockWeatherData).filter((city) =>
        city.toLowerCase().includes(citySearch),
      ),
    );
  };

  const onSelectCity = (city) => {
    setHistorySearch((existing) => {
      if (!city || existing.includes(city)) return existing;
      return [...existing, city].slice(-AMOUT_OF_PREV_SELECTED_CITIES);
    });
  };

  return (
    <div>
      {historySearch.map((city) => (
        <button
          onClick={() => {
            setCitySearch(() => city);
            handleCitySearch();
          }}
          key={city}
        >
          {city}
        </button>
      ))}
      <input
        onChange={onChangeCitySearch}
        type="text"
        id="citySearch"
        placeholder="Search for a city..."
      />

      <ul>
        {filteredCityList.map((city) => (
          <li onClick={() => onChangeCitySearch(city)} key={city}>
            {city}
          </li>
        ))}
      </ul>

      {selectedCity && (
        <div id="weatherData">
          <div>Temperature: {mockWeatherData[selectedCity].temperature}</div>
          <div>Humidity: {mockWeatherData[selectedCity].humidity}</div>
          <div>Wind Speed: {mockWeatherData[selectedCity].windSpeed} km/h</div>
          <hr />
        </div>
      )}
    </div>
  );
}
