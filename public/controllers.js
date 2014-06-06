/*
	John Drogo
	May 29, 2014

	WeatherNode Client
	
	AngularJS script to query weather conditions from Open Weather Map, display current weather, and update the
	background image based on a database query.
*/


var app = angular.module("WeatherAppJSON", []);


app.controller("WeatherController", function constructor($scope, $http){

	$scope.loadbackground = function(){
		/*Transition to new background image.*/
		$http.get("./node/"+$scope.weathersimple.toLowerCase().replace(/ /g, "")).success(function(data){
			$("#stageforground").css("background-image", $("#stagebackground").css("background-image"));
			$("#stageforground").css("opacity", 1);

			$scope.backgroundImage = data;
			$scope.$apply();
			$("#stageforground").animate({opacity: 0}, 1000);
		});
	}

	$scope.update = function(){
		//Get weather data.

		$http.get("http://api.openweathermap.org/data/2.5/weather?q="+$scope.location).success(function(data){

			$scope.weathersimple = data["weather"][0]["main"]
			$scope.weather = data["weather"][0]["description"];
			$scope.city = data["name"];
			$scope.temp = data["main"]["temp"];

			if ($scope.use == "celsius"){
				$scope.temp -= 273
				$scope.temp = Math.floor($scope.temp)
				$scope.temp += "°C";
			}

			if ($scope.use == "fahrenheit")
				$scope.temp = Math.floor(($scope.temp-273) * (9/5) + 32) + "°F";

			if ($scope.use == "kelvin")
				$scope.temp = Math.floor($scope.temp) + "K";

			$scope.loadbackground();
		});
	}


	$scope.location = "syracuse, ny";
	$scope.update();

});


app.directive('ngEnter', function () {

    //Capture when user presses enter.
    //Borrowed from EpokK's response: 
        //http://stackoverflow.com/questions/15417125/submit-form-on-pressing-enter-with-angularjs/17364716#17364716

    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });

                event.preventDefault();
            }
        });
    };
});