
function uniqueArray(arr1) {
  // referenced from: https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates

  function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }

  var unique = arr1.filter( onlyUnique );

  return unique;
}

function sumsArray(arr1, origArray, uniqueArray) {
  var uniqueArr1 = [];

  origArray.forEach(function(origElement, origIndex) {
    uniqueArray.forEach(function(uniqueElement, uniqueIndex) {
      
      if (origElement === uniqueElement) {
        if (uniqueArr1.length-1 < uniqueIndex) {
          uniqueArr1.push(0);
          uniqueArr1[uniqueIndex] += arr1[origIndex];
        }
        else {
          uniqueArr1[uniqueIndex] += arr1[origIndex];
        }
      }
    });
  });
  return uniqueArr1;
}

function countArray(arr1, origArray, uniqueArray) {
  var uniqueArr1 = [];

  origArray.forEach(function(origElement, origIndex) {
    uniqueArray.forEach(function(uniqueElement, uniqueIndex) {
      
      if (origElement === uniqueElement) {
        if (uniqueArr1.length-1 < uniqueIndex) {
          uniqueArr1.push(0);
          uniqueArr1[uniqueIndex] += 1;
        }
        else {
          uniqueArr1[uniqueIndex] += 1;
        }
      }
    });
  });
  return uniqueArr1;
}

function avgArray(arr1, origArray, uniqueArray) {
  var uniqueArr1 = [];
  var avgArray = []

  origArray.forEach(function(origElement, origIndex) {
    uniqueArray.forEach(function(uniqueElement, uniqueIndex) {
      
      if (origElement === uniqueElement) {
        if (uniqueArr1.length-1 < uniqueIndex) {
          uniqueArr1.push([]);
          uniqueArr1[uniqueIndex].push(arr1[origIndex]);
        }
        else {
          uniqueArr1[uniqueIndex].push(arr1[origIndex]);
        }
      }
    });
  });

  uniqueArr1.forEach(function(element, index) {
    var sum = 0;
    element.forEach(function(innerElement, innerIndex) {
      sum += innerElement;
    });
    avgArray.push(sum/element.length);
  });

  return avgArray;
}

function generateChartColorPalette() {
	// referenced from: https://stackoverflow.com/questions/22503297/create-an-array-of-colors-about-100-in-javascript-but-the-colors-must-be-quit
	var chartColorPalette = [];
	while (chartColorPalette.length < 100) {
		do {
			var color = Math.floor((Math.random()*1000000)+1);
		} while (chartColorPalette.indexOf(color) >= 0);
		chartColorPalette.push("#" + ("000000" + color.toString(16)).slice(-6));
	}
	return chartColorPalette;
}
var chartColorPalette = generateChartColorPalette();

function generateJobsBySectorPieChartData(responseData) {  
  tempArr1 = uniqueArray(responseData.sector);
  tempArr2 = countArray(responseData.salary, responseData.sector, tempArr1);
 
  return {
    type: 'pie',
    data: {
      labels: tempArr1,
      datasets: [{
        data: tempArr2,
        backgroundColor: chartColorPalette
      }]
    },
    options: {
      title: {
        display: true,
        text:"Jobs by Sector"
      },
      legend: { display: false }
    }
  };
}

function generateSalaryBySectorPieChartData(responseData) {
  tempArr1 = uniqueArray(responseData.sector);
  tempArr2 = sumsArray(responseData.salary, responseData.sector, tempArr1);
 
  return {
    type: 'pie',
    data: {
      labels: tempArr1,
      datasets: [{
        data: tempArr2,
        backgroundColor: chartColorPalette
      }]
    },
    options: {
      title: {
        display: true,
        text:"Aggregate Salaries by Sector"
      },
      legend: { display: false }
    }
  };
}

function generateAverageSalaryBySectorBarChartData(responseData) {
  var tempArr1 = uniqueArray(responseData.sector);
  var tempArr2 = avgArray(responseData.salary, responseData.sector, tempArr1);

  return {
    type: 'bar',
    data: {
      labels: tempArr1,
      datasets: [{
        data: tempArr2,
        backgroundColor: chartColorPalette
      }]
    },
    options: {
      title: {
        display: true,
        text:"Average Salaries by Sector"
      },
      legend: { display: false },
      scales: {
        xAxes: [{
          ticks: {
            display: false
          }
        }]
      }
    }
  };
}
