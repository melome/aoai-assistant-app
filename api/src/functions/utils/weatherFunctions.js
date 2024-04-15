const getFavoriteCity = () => "Atlanta, GA";

const getCityNickname = (city) => {
  switch (city) {
    case "Atlanta, GA":
      return "The ATL";
    case "Seattle, WA":
      return "The Emerald City";
    case "Los Angeles, CA":
      return "LA";
    default:
      return "Unknown";
  }
};

const getWeatherAtLocation = (location, temperatureUnit = "f") => {
  switch (location) {
    case "Atlanta, GA":
      return temperatureUnit === "f" ? "84f" : "26c";
    case "Seattle, WA":
      return temperatureUnit === "f" ? "70f" : "21c";
    case "Los Angeles, CA":
      return temperatureUnit === "f" ? "90f" : "28c";
    default:
      return "Unknown";
  }
};

module.exports = {
  getFavoriteCity,
  getCityNickname,
  getWeatherAtLocation,
};