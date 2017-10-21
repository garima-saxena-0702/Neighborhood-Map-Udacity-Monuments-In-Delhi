var defaultIcon, highlightedIcon, largeinfowindow;
var markers = [];
var bounds;
var indicator = false;
var map;
//adding name and location of monuments
var initialLocations = [{
        "name": "National Zoological park Delhi",
        "location": {
            "lat": 28.608632,
            "lng": 77.246680
        }
    },
    {
        "name": "Humayun Tomb",
        "location": {
            "lat": 28.598383,
            "lng": 77.250285
        }
    },
    {
        "name": "Purana Quila",
        "location": {
            "lat": 28.614739,
            "lng": 77.243247
        }
    },
    {
        "name": "National Gallery of Modern Art",
        "location": {
            "lat": 28.609917,
            "lng": 77.234492
        }
    },
    {
        "name": "Akshardham (Delhi)",
        "location": {
            "lat": 28.612780,
            "lng": 77.277064
        }
    },
    {
        "name": "India Gate",
        "location": {
            "lat": 28.613192,
            "lng": 77.229471
        }
    },
    {
        "name": "Red Fort",
        "location": {
            "lat": 28.656159,
            "lng": 77.241010
        }
    },
    {
        "name": "Agrasen Ki Baoli",
        "location": {
            "lat": 28.626113,
            "lng": 77.224966
        }
    }
];

var mapLocations = initialLocations;

//defining a MapAppViewModel
function MapAppViewModel() {
    // Data
    var self = this;
    self.searchName = ko.observable("");
    //filter the items using the filter text
    this.locations = ko.computed(function() {
        var filter = self.searchName().toLowerCase();
        if (!filter) {
            mapLocations = initialLocations;
            return initialLocations;
        } else {
            var matchedLocations = [];
            mapLocations = [];
            markers = [];
            for (i = 0; i < initialLocations.length; i++) {
                if (initialLocations[i].name.toLowerCase().includes(filter)) {
                    matchedLocations.push(initialLocations[i]);
                    mapLocations.push(initialLocations[i]);
                }
            }
            initMap();
            return matchedLocations;
        }
    }, MapAppViewModel);
    self.clearClick = function() {
        self.searchName("");
        mapLocations = initialLocations;
        initMap();
    };
    self.listClick = function() {
        var text = event.target.textContent;
        indicator = true;
        for (var k = 0; k < initialLocations.length; k++) {
            if (initialLocations[k].name === text) {
                var position = initialLocations[k].location;
                var title = initialLocations[k].name;
                setMarker(position, title, k);
            }
        }
    };
};
//Activating Knockout
ko.applyBindings(new MapAppViewModel());


//defining function initMap to initialize Map
function initMap() {

    largeinfowindow = new google.maps.InfoWindow();
    bounds = new google.maps.LatLngBounds();
    defaultIcon = makeMarkerIcon('0011ff');
    highlightedIcon = makeMarkerIcon('FF0024');

    //Styles given in Udacity classroom course
    var styles = [{
        featureType: 'water',
        stylers: [{
            color: '#19a0d8'
        }]
    }];
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 28.604039,
            lng: 77.233977
        },
        zoom: 8,
        styles: styles,
        mapTypeControl: false
    });

    for (var i = 0; i < mapLocations.length; i++) {
        var position = mapLocations[i].location;
        var title = mapLocations[i].name;
        setMarker(position, title, i);
    }
}

//makeMarkerIcon given in Udacity course
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34));
    return markerImage;
}

//function to set the marker at given position
function setMarker(position, title, i) {
    var marker = new google.maps.Marker({
        //map: map,
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon,
        id: i
    });
    markers.push(marker);
    bounds.extend(marker.position);
    if (indicator === true) {
        indicator = false;
        populateInfoWindow(marker, largeinfowindow);
    }
    marker.addListener('click', function() {
        populateInfoWindow(this, largeinfowindow);
    });
    marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
    });
    marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });
    setBound();
}

//setting bounds of the marker
function setBound() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}

//info window having information from wikipedia
function populateInfoWindow(marker, infowindow) {
    var wiki = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title + '&imlimit=5&format=json&callback=wikiCallback';;
    //var wiki = "https://en.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrsearch=" + marker.title + "&gsrlimit=15&prop=extracts&exsentences=3&exintro=&explaintext&exlimit=max&callback=JSON_CALLBACK"
    var wikiResponse = wikiAjax(wiki);
    wikiResponse.done(function(data) {
        console.log(data);

        var wikiUrl = data[3][0];
        var wikiData = data[2][0];

        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            infowindow.setContent('<div><h3>' + marker.title + '</h3><p>' + wikiData + '<a href="' + wikiUrl + '" target="blank">' + '..' + 'More</a></p></div>');
            infowindow.open(map, marker);
            infowindow.addListener('closeclick', function() {
                infowindow.setMarker = null;
            });
            // Open the infowindow on the correct marker.
            infowindow.open(map, marker);
        }
    }).fail(function(err) {
        alert("The call has been rejected");
    });
}

//Ajax call for wikipedia
function wikiAjax(searchURL) {
    return $.ajax({
        url: searchURL,
        jsonp: "callback",
        dataType: 'jsonp',
        xhrFields: {
            withCredentials: true
        }
    });
}

//Map error function
function mapError() {
    this.mapElem = document.getElementById('map');
    this.area = document.createElement('div');
    this.area.innerHTML = "Sorry!! Map can't be loaded.";
    mapElem.appendChild(mapElem);
}