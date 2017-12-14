const userLimits = {
  rain: 0,
  snow: 0,
  temp: 273.15 + 3,
  wind: 50,
  daysOff: [0,6] //Sunday, Saturday
}

function valueOr0(object){
  if (object === undefined){
    return 0;
  } else if (object["3h"] === undefined){
    return 0;
  } else {
    return object["3h"];
  }
}

const xhr = new XMLHttpRequest();
const url = "https://api.openweathermap.org/data/2.5/forecast?id=" + process.env.id + "&APPID=" + process.env.appId;
xhr.responseType = 'json';
xhr.onreadystatechange = function(){
  if(xhr.readyState === XMLHttpRequest.DONE){
    console.log(xhr.response);
    const returnedData = xhr.response;
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const dayOfTheWeek = today.getDay();
    const currentHour = today.getHours();
    const now = `${year}-${month}-${day} ${currentHour}`;

    let returnedTimes = returnedData.list.map((object) => {
        return {
          time: object.dt_txt,
          date: object.dt_txt.split(" ")[0],
          day: (new Date(object.dt_txt.split(" ")[0])).getDay(),
          hour: object.dt_txt.split(" ")[1].split(":")[0],
          rain: Math.round(valueOr0(object.rain)*100)/100,
          snow: Math.round(valueOr0(object.snow)*100)/100,
          temp: Math.round(object.main.temp - 273.15)*10/10,
          wind: Math.round(object.wind.speed*100)/100,
          bikeExplanation: "",
          bikeDecision: false,
          bike : function(dayParam){
            if (userLimits.daysOff.find((number) => number === dayParam) !== undefined){
              this.bikeExplanation = "week-end";
            } else if (userLimits.rain < this.rain){
              this.bikeExplanation = `pluie ${this.rain}mm`;
            } else if (userLimits.snow < this.snow){
              this.bikeExplanation = `neige ${this.snow}mm`;
            } else if (userLimits.wind < this.wind){
              this.bikeExplanation = `trop de vent ${this.wind}km/h`;
            } else if (userLimits.temp < this.temp - 273.15){
              this.bikeExplanation = `trop froid ${this.temp}°C`
            } else{
              this.bikeDecision = true;
            }
          }
        };
    });
    returnedTimes.forEach((object) => {
      object.bike(object.day);
    })

    let selectedTimes = returnedTimes.filter((object) => {
      if (object.hour === "09" || object.hour === "21"){
        return object;
      }
    });
    if (selectedTimes[0].hour === "21"){// if it's already afternoon, you already took your decision
      selectedTimes.splice(0,1);
    }
    if (selectedTimes[selectedTimes.length - 1].hour === "09"){//21 not yet in the forecast
      selectedTimes.pop();
    }

    let groupByDate = [];
    for (let i = 0; i<selectedTimes.length; i = i+2){
      jourTemp = selectedTimes[i].date;
        groupByDate.push({
          date: selectedTimes[i].date,
          morningBike: selectedTimes[i].bikeDecision,
          morningExplanation: selectedTimes[i].bikeExplanation,
          eveningBike: selectedTimes[i+1].bikeDecision,
          eveningExplanation: selectedTimes[i+1].bikeExplanation
        });
    }

    let decision = groupByDate.map((object) => {
      if (object.morningExplanation === "week-end"){
        return `\n${object.date} week-end`;
      } else if (object.morningBike && object.eveningBike) {
        return `\n${object.date} 🚲`;
      } else if (!object.morningBike && !object.eveningBike){
        return `\n${object.date} 🚙  : ${object.morningExplanation} le matin et ${object.eveningExplanation} le soir.`;
      } else if (!object.morningBike && object.eveningBike){
        return `\n${object.date} 🚙  : ${object.morningExplanation} le matin.`;
      } else if (object.morningBike && !object.eveningBike){
        return `\n${object.date} 🚙  : ${object.eveningExplanation} le soir.`;
      }
    });

    document.write("<h1>Prévisions pour les jours à venir : </h1><br/>");
    for (let i=0; i < decision.length; i++){
      const toHTML = decision[i];
      document.write("<br/>" + toHTML + "<br/>");
    }
  }
};
xhr.open('GET',url);
xhr.send();

module.exports = {
  userLimits: userLimits
};