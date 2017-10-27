var defaultIcon, highlightedIcon, largeinfowindow;
var markers = [];
var marker;
var bounds;
var indicator = false, indi = true;
var map;
var mapLocations = initialLocations;
var mark = [];

//defining a MapAppViewModel
function MapAppViewModel() {
    // Data
    var self = this;
    self.searchName = ko.observable("");
    self.indi = ko.observable("false");
    //filter the items using the filter text
    this.locations = ko.computed(function() {
        var filter = self.searchName().toLowerCase();
        if (filter !== "") {
            var matchedLocations = [];
            mapLocations = [];
            //markers = [];
            for (var i = 0; i < markers.length; i++) {
                markers[i].setVisible(false);
            }
            for (i = 0; i < initialLocations.length; i++) {
                if (initialLocations[i].name.toLowerCase().includes(filter)) {
                    matchedLocations.push(initialLocations[i]);
                    mapLocations.push(initialLocations[i]);
                    markers[i].setVisible(true);
                }
            }
            indi = false;
            //initMap();
            return matchedLocations;
        } else {
            mapLocations = initialLocations;
            /*for(var j = 0; j < mark.length; j++) {
                setBound(mark);
            }*/
            for (var j = 0; j < markers.length; j++) {
                markers[j].setVisible(true);
            }
            return initialLocations;
        }
    }, MapAppViewModel);

    self.clearClick = function() {
        self.searchName("");
        mapLocations = initialLocations;
        //mark.setVisibility(true);
        //markers = [];
        //initMap();
    };

    self.listClick = function() {
        var text = event.target.textContent;
        indicator = true;
        for (var k = 0; k < initialLocations.length; k++) {
            if (initialLocations[k].name === text) {
                var position = initialLocations[k].location;
                var title = initialLocations[k].name;
                populateInfoWindow(markers[k], largeinfowindow);
                toggleBounce(markers[k]);
            }
        }
    };
}

//Activating Knockout
ko.applyBindings(new MapAppViewModel());

//function for error on loading the map
var mapError = function() {
  // Error handling
  alert("Oops! An error");
};

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
        //alert("hell");
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
    marker = new google.maps.Marker({
        //map: map,
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon,
        id: i
    });
    markers.push(marker);
    if(indi === true) {
        mark.push(marker);
    }
    bounds.extend(marker.position);
    if (indicator === true) {
        indicator = false;
        populateInfoWindow(marker, largeinfowindow);
        toggleBounce(marker);
    }
    marker.addListener('click', function() {
        populateInfoWindow(this, largeinfowindow);
        toggleBounce(this);
    });
    marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
    });
    marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });
     /*marker.addListener('click', function() {
        toggleBounce(this);
     });*/
    setBound(markers);
}

//function for toggleBounce
function toggleBounce(marker) {
    if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
    } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        //alert(marker.id);
        setTimeout(function() {
            marker.setAnimation(null); //setting merker null after timeout.
        }, 1400);  // setting time out time of 1400s.
    }
}

//setting bounds of the marker
function setBound(markers) {
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
    var wiki = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' + marker.title + '&imlimit=5&format=json&callback=wikiCallback';
    //var wiki = "https://en.wikipedia.org/w/api.php?format=json&action=query&generator=search&gsrsearch=" + marker.title + "&gsrlimit=15&prop=extracts&exsentences=3&exintro=&explaintext&exlimit=max&callback=JSON_CALLBACK"
    //alert(marker.title);
    var wikiResponse = wikiAjax(wiki);
    wikiResponse.done(function(data) {
        console.log(data);

        var wikiUrl = data[3][0];
        var wikiData = data[2][0];

        if (wikiData === "") {
            wikiData = "No info available!";
        }

        if (wikiUrl === "") {
            wikiUrl = "Not a URL";
        }

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

//handler for mapr error
//window.onerror = function() {  // on error function yo catch any error include loading map
//    alert('An error has occurred!');
//    return true;
//};
