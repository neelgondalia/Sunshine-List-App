function roundTo2Decimals(num) {
	return Math.round(num * 100) / 100
}

function mode(arr) {
	if(arr.length ===0) {
		return 'N/A';
	}

	var mode = 0;
	var count = 0;

	for(var i=0; i<arr.length; i++) {
		for(var j=0; j<i; j++) {
			if(arr[j] === arr[i]) {
				mode = arr[j];
				count++;
			}
		}
	}

	return roundTo2Decimals(mode);
}

function mean(arr) {
	if(arr.length ===0) {
		return 'N/A';
	}

	return roundTo2Decimals(arr.reduce(function (p, c) {
		return p + c;
	}) / arr.length);
}

function median(arr) {
	if(arr.length ===0) {
		return 'N/A';
	}

	arr.sort(function(a,b) {
		return a-b;
	});

	var half = Math.floor(arr.length/2);

	if(arr.length % 2) {
		return arr[half];
	}

	return roundTo2Decimals((arr[half - 1] + arr[half]) / 2.0);
}

function stdDeviation(arr) {
	if(arr.length ===0) {
		return 'N/A';
	}

	var avg = mean(arr);

	var squareDiffs = arr.map(function(value) {
		var diff = value - avg;
		var sqrDiff = diff * diff;
		return sqrDiff;
	});

	var avgSquareDiff = mean(squareDiffs);

	var stdDev = Math.sqrt(avgSquareDiff);

	return roundTo2Decimals(stdDev);
}