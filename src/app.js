const baseUrl = 'https://api.winnipegtransit.com/v3/';
const APIKey = 'Xf2XhbFqkk-DeNRN3CmA';
const stops = 'stops.json?street='
const streetListElement = document.querySelector('section.streets');

//const dataObject = {
//stops: {
//    10066: {
//      stopName: 'Northbound Osborne at Osborne Junction',
//      crossStreet: 'McMillan Avenue',
//      direction: 'Northbound',
//      routes: {
//        55: ["2021-05-18T11:40:05", "First time"],
//        68: ["2021-05-18T11:55:56", "second time"]
//      }
//    },
//    10595: {
//      stopName: 'Northbound Osborne at Assiniboine',
//      crossStreet: 'Granite Way',
//      direction: 'Northbound',
//      routes: {
//        999: ["2021-05-18T23:59:59", "Third time"]
//      }0
//    }
//  }
//};


// get street name and return json data
const getroads = async function(string) {
  const response = await fetch(`${baseUrl}streets.json?api-key=${APIKey}&name=${string}`)
  const data = await response.json();
  return data.streets;
};


// get stops and return json data
const getStopages = async function(streetKey) {
  const response = await fetch(`${baseUrl}stops.json?api-key=${APIKey}&street=${streetKey}`);
  const data = await response.json();
  return data;
};


// get street list and add html
const getRoadLink = function(street) {
  if(street.leg) return `<a href="#" data-street-key="${street.key}">${street.name} ${street.leg}</a>`;
  else return `<a href="#" data-street-key="${street.key}">${street.name}</a>`;
}


// popluate street list, all list of street shows here.
const EveryStreetList = function(streets) {
  streetListElement.innerHTML = '';
  for (let street of streets) {
    streetListElement.innerHTML += getRoadLink(street);
  }
  if(streets.length == 0) streetListElement.innerHTML = 'No Streets found';
};


// search with input street name
document.forms[0].addEventListener('submit', (e) => {
  e.preventDefault();
  const searchString = e.target[0].value;

  if (searchString) {
    getroads(searchString)
    .then((streets) => {
      EveryStreetList(streets);
    })
    .catch((err) => {
      console.log('Something went wrong:');
      console.log(err);
    });
  }
});


// when click street name in street list after search done
streetListElement.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    const streetKey = e.target.dataset.streetKey;
    document.getElementById('street-name').innerHTML = "Displaying results for " + e.target.outerText;
    populateBusStops(streetKey);
  }
});


// populate bus stop using api stop
const populateBusStops = function(streetKey) {
 
  fetch(`${baseUrl}stops.json?api-key=${APIKey}&street=${streetKey}`)
  .then(stopsRespose => stopsRespose.json())
  .then(stopsJson => addDataToHtml(stopsJson));
};


// only select 2 buses for each scop, each direction, each bus num
const stopSchedules = stopKeys => {
  let promises = [];
  for (let key of stopKeys.stops) {

    let fetches = fetch(`${baseUrl}stops/${key.key}/schedule.json?api-key=${APIKey}&max-results-per-route=2`)
      .then(data => data.json());
    promises.push(fetches);
  }

  return promises;
}


// add data to html, show 
const addDataToHtml = jsonData => {
  const tbodyElem = document.querySelector('tbody');
  tbodyElem.innerHTML = '';
  Promise.all(stopSchedules(jsonData))
    .then(response => {
      let str = ``;

      response.forEach(e => {
        if(e['stop-schedule']['route-schedules'].length > 0) {
          for (let route of e['stop-schedule']['route-schedules']) {


            for (let bus of route['scheduled-stops']) {
              let busTime = bus.times.departure.scheduled;
              const appointment = (new Date(busTime)).toLocaleTimeString('en-US', {hour:"numeric", minute:"numeric"});
              
              str += `
              <tr>
                <td>${e['stop-schedule'].stop.street.name}</td>
                <td>${e['stop-schedule'].stop['cross-street'].name}</td>
                <td>${e['stop-schedule'].stop.direction}</td>`;
    
              str += `<td>${route.route.key}</td>`;
              str += `<td>${appointment}</td></tr>`;
              
            }


          }
        }
      })

      tbodyElem.innerHTML = str;

    })
}
