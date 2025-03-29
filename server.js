import express from "express";
import axios from "axios";

const app = express();
const port = process.env.port || 3000;
const API_Key = "&appid=f0c7410e1389604be33bbe3fc21621c1";
const language = "&lang=en";
let new_city = null;

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
  
  const city = "q=Meerut,in";
  try {
    const result = await axios.get(
      `http://pro.openweathermap.org/data/2.5/weather?${city}&units=metric${API_Key}${language}`
    );
    const iconID = result.data.weather[0].icon;
    const currentTemp = Math.round(result.data.main.temp);
    const lat = result.data.coord.lat;
    const lon = result.data.coord.lon;

    const iconResponse = await axios.get(
      `https://openweathermap.org/img/wn/${iconID}@2x.png`,
      {
        responseType: "arraybuffer",
      }
    );

    const iconBase64 = btoa(
      new Uint8Array(iconResponse.data).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    const iconDataUrl = `data:image/png;base64,${iconBase64}`;

    const dailyForecast = await axios.get(
      `http://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=2&units=metric${API_Key}`
    );

    const daily_max = dailyForecast.data.list[0].temp.max;
    const daily_min = dailyForecast.data.list[0].temp.min;

    const AQIIndex = await axios.get(
      `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}${API_Key}`
    );
    const index = AQIIndex.data.list[0].main.aqi;
    var bp_1_pm2;
    var bp_2_pm2;
    var bp_1_pm10;
    var bp_2_pm10;
    var bp_1_o3;
    var bp_2_o3;

    const co = AQIIndex.data.list[0].components.co;
    const no = AQIIndex.data.list[0].components.no;
    const no2 = AQIIndex.data.list[0].components.no2;
    const o3 = AQIIndex.data.list[0].components.o3;
    const so2 = AQIIndex.data.list[0].components.so2;
    const pm2 = AQIIndex.data.list[0].components.pm2_5;
    const pm10 = AQIIndex.data.list[0].components.pm10;
    const nh3 = AQIIndex.data.list[0].components.nh3;

    switch (index) {
      case 1:
        bp_1_pm2 = 0;
        bp_2_pm2 = 10;
        bp_1_pm10 = 0;
        bp_2_pm10 = 20;
        bp_1_o3 = 0;
        bp_2_o3 = 60;
        break;

      case 2:
        bp_1_pm2 = 11;
        bp_2_pm2 = 25;
        bp_1_pm10 = 21;
        bp_2_pm10 = 50;
        bp_1_o3 = 61;
        bp_2_o3 = 100;
        break;

      case 3:
        bp_1_pm2 = 26;
        bp_2_pm2 = 50;
        bp_1_pm10 = 51;
        bp_2_pm10 = 100;
        bp_1_o3 = 101;
        bp_2_o3 = 140;
        break;

      case 4:
        bp_1_pm2 = 51;
        bp_2_pm2 = 75;
        bp_1_pm10 = 101;
        bp_2_pm10 = 200;
        bp_1_o3 = 141;
        bp_2_o3 = 180;
        break;

      case 5:
        bp_1_pm2 = 76;
        bp_2_pm2 = 100;
        bp_1_pm10 = 201;
        bp_2_pm10 = 400;
        bp_1_o3 = 181;
        bp_2_o3 = 230;
        break;
      default:
        break;
    }
    const AQI_PM2 =
      bp_1_pm2 +
      ((bp_2_pm2 - bp_1_pm2) / (bp_2_pm2 - bp_1_pm2)) * (pm2 - bp_1_pm2);
    const AQI_PM10 =
      bp_1_pm10 +
      ((bp_2_pm10 - bp_1_pm10) / (bp_2_pm10 - bp_1_pm10)) * (pm10 - bp_1_pm10);
    const AQI_o3 =
      bp_1_o3 + ((bp_2_o3 - bp_1_o3) / (bp_2_o3 - bp_1_o3)) * (o3 - bp_1_o3);

    console.log(AQI_PM2, AQI_PM10, AQI_o3);
    console.log(index);

    const aqi = Math.round(Math.max(AQI_PM10, AQI_PM2, AQI_o3));

    res.render(`index.ejs`, {
      city: result.data.name,
      icon: iconDataUrl,
      desc: result.data.weather[0].description,
      currentTemp: currentTemp,
      min: Math.round(daily_min),
      max: Math.round(daily_max),
      humidity: result.data.main.humidity,
      wind: result.data.wind.speed,
      index: index,
      aqi: aqi,
      feels_like: Math.round(result.data.main.feels_like),
    });
  } catch (error) {
    res.status(404).send(error.message);
  }
});

app.get("/weather", async (req, res) => {
  try {
    const result = await axios.get(
      `http://pro.openweathermap.org/data/2.5/weather?${new_city}&units=metric${API_Key}${language}`
    );
    const lat = result.data.coord.lat;
    const lon = result.data.coord.lon;

    const tempForecast = await axios.get(
      `https://pro.openweathermap.org/data/2.5/forecast/hourly?lat=${lat}&lon=${lon}&cnt=12&units=metric${API_Key}`
    );

    const forecastData = tempForecast.data.list.map((item) => ({
      date: item.dt_txt,
      value: item.main.temp,
      humidity: result.data.main.humidity,
    }));

    res.json(forecastData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.post("/city", async (req, res) => {
  const n_city = req.body.city;
  new_city = `q=${n_city}`;
  try{
  const result = await axios.get(
    `http://pro.openweathermap.org/data/2.5/weather?${new_city}&units=metric${API_Key}${language}`
  );
  const iconID = result.data.weather[0].icon;
  const currentTemp = Math.round(result.data.main.temp);
  const lat = result.data.coord.lat;
  const lon = result.data.coord.lon;

  const iconResponse = await axios.get(
    `https://openweathermap.org/img/wn/${iconID}@2x.png`,
    {
      responseType: "arraybuffer",
    }
  );

  const iconBase64 = btoa(
    new Uint8Array(iconResponse.data).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ""
    )
  );
  const iconDataUrl = `data:image/png;base64,${iconBase64}`;

  const dailyForecast = await axios.get(
    `http://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=2&units=metric${API_Key}`
  );

  const daily_max = dailyForecast.data.list[0].temp.max;
  const daily_min = dailyForecast.data.list[0].temp.min;

  const AQIIndex = await axios.get(
    `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}${API_Key}`
  );
  const index = AQIIndex.data.list[0].main.aqi;
  var bp_1_pm2;
  var bp_2_pm2;
  var bp_1_pm10;
  var bp_2_pm10;
  var bp_1_o3;
  var bp_2_o3;

  const co = AQIIndex.data.list[0].components.co;
  const no = AQIIndex.data.list[0].components.no;
  const no2 = AQIIndex.data.list[0].components.no2;
  const o3 = AQIIndex.data.list[0].components.o3;
  const so2 = AQIIndex.data.list[0].components.so2;
  const pm2 = AQIIndex.data.list[0].components.pm2_5;
  const pm10 = AQIIndex.data.list[0].components.pm10;
  const nh3 = AQIIndex.data.list[0].components.nh3;

  switch (index) {
    case 1:
      bp_1_pm2 = 0;
      bp_2_pm2 = 10;
      bp_1_pm10 = 0;
      bp_2_pm10 = 20;
      bp_1_o3 = 0;
      bp_2_o3 = 60;
      break;

    case 2:
      bp_1_pm2 = 11;
      bp_2_pm2 = 25;
      bp_1_pm10 = 21;
      bp_2_pm10 = 50;
      bp_1_o3 = 61;
      bp_2_o3 = 100;
      break;

    case 3:
      bp_1_pm2 = 26;
      bp_2_pm2 = 50;
      bp_1_pm10 = 51;
      bp_2_pm10 = 100;
      bp_1_o3 = 101;
      bp_2_o3 = 140;
      break;

    case 4:
      bp_1_pm2 = 51;
      bp_2_pm2 = 75;
      bp_1_pm10 = 101;
      bp_2_pm10 = 200;
      bp_1_o3 = 141;
      bp_2_o3 = 180;
      break;

    case 5:
      bp_1_pm2 = 76;
      bp_2_pm2 = 100;
      bp_1_pm10 = 201;
      bp_2_pm10 = 400;
      bp_1_o3 = 181;
      bp_2_o3 = 230;
      break;
    default:
      break;
  }
  const AQI_PM2 =
    bp_1_pm2 +
    ((bp_2_pm2 - bp_1_pm2) / (bp_2_pm2 - bp_1_pm2)) * (pm2 - bp_1_pm2);
  const AQI_PM10 =
    bp_1_pm10 +
    ((bp_2_pm10 - bp_1_pm10) / (bp_2_pm10 - bp_1_pm10)) * (pm10 - bp_1_pm10);
  const AQI_o3 =
    bp_1_o3 + ((bp_2_o3 - bp_1_o3) / (bp_2_o3 - bp_1_o3)) * (o3 - bp_1_o3);

  console.log(AQI_PM2, AQI_PM10, AQI_o3);
  console.log(index);

  const aqi = Math.round(Math.max(AQI_PM10, AQI_PM2, AQI_o3));

  res.render(`index.ejs`, {
    city: n_city,
    icon: iconDataUrl,
    desc: result.data.weather[0].description,
    currentTemp: currentTemp,
    min: Math.round(daily_min),
    max: Math.round(daily_max),
    humidity: result.data.main.humidity,
    wind: result.data.wind.speed,
    index: index,
    aqi: aqi,
    feels_like: Math.round(result.data.main.feels_like),
  });
} catch (error) {
  res.status(404).send(error.message);
}
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
