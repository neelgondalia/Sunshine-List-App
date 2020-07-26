var apiCallData = {
	yearLow: 2012,
	yearHigh: 2017,
	salaryLow: 100000,
	salaryHigh: 2500000,
	taxableBenefitsLow: 5000,
	taxableBenefitsHigh: 1500000,
	provinces: ['ON', 'AB']
};

var responseData = {
	province: [],
	year: [],
	sector: [],
	employer: [],
	salary: [],
	tableTaxableBenefits: [],
	severance: []
}

var currentChart1 = {
	canvasId: "canvas-01",
	chart: null
};
var currentChart2 = {
	canvasId: "canvas-02",
	chart: null
};
var currentChart3 = {
	canvasId: "canvas-03",
	chart: null
};

var tableData = [];
var statisticalTableData = [];

var dataTable = null;
var statisticalTable = null;

var mainTableGenerated = false;
var statisticalTableGenerated = false;

function regenerateStatisticalTable() {
	if(!statisticalTableGenerated) { //First time creating table
		statisticalTable = $('#statistical-analysis-table').DataTable({
			dom: 'rt',
			data: statisticalTableData,
			columns: [
				{ title: "" },
				{ title: "Salary" },
				{ title: "Taxable Benefits" },
				{ title: "Severance" }
			]
		});
		statisticalTableGenerated = true;
	} else { //Every other time we just reload it.
		statisticalTable.clear().rows.add(statisticalTableData).draw();
	}
}

function regenerateCharts() {
	updateChart(currentChart1, generateJobsBySectorPieChartData(responseData));
	updateChart(currentChart2, generateAverageSalaryBySectorBarChartData(responseData));
	$('#chart-selection-dropdown-menu-01').css("visibility","visible");
	$('#chart-selection-dropdown-menu-02').css("visibility","visible");
	$('#chart-save-01').css("visibility","visible");
	$('#chart-save-02').css("visibility","visible");
	$('#main-sunshine-list-table').css("visibility","visible");
	$('py-3').css("visibility","visible");
}

function regenerateMainTable() {
	if(!mainTableGenerated) { //First time creating table
		dataTable = $('#main-sunshine-list-table').DataTable({
			dom: 'Blfrtip',
			data: tableData,
			columns: [
				{ title: "Province" },
				{ title: "Year" },
				{ title: "Sector" },
				{ title: "Employer" },
				{ title: "Position Title" },
				{ title: "Position Class" },
				{ title: "First Name" },
				{ title: "Last Name" },
				{ title: "Salary" },
				{ title: "Taxable Benefits" },
				{ title: "Severance" },
			],
			buttons: [
				'csv', 'excel'
			]
		});
		mainTableGenerated = true;
	} else { //Every other time we just reload it.
		dataTable.clear().rows.add(tableData).draw();
	}

	dataTable.columns().every(function() { // Apply the search
		var that = this;

		$('input', this.footer()).on('keyup change', function() {
			if(that.search() !== this.value) {
				that.search(this.value).draw();
			}
		});
	});
}

function apiGetTables() {
	console.log('calling api with : ');
	console.log(apiCallData);
	$.ajax({
		type: "POST", 
		url: "/getTable",
		dataType: 'json',
		data: apiCallData,
		dataType: "json",
		success: function(response) {
			if(response.notice != null) {
				$.notify(response.notice, "warn");
			}
			//Fill in front end table/re-draw graphs
			var appendedRows = '';
			resetResponseDataArrays();

			tableData = [];
			statisticalTableData = [];

			var salaries = [];
			var taxableBenefits = [];
			var severances = [];

			response.tableData.forEach(function(e, i) {
				var tableTaxableBenefits;
				if(e.taxable_benefits!=null) {
					tableTaxableBenefits = e.taxable_benefits;
				} else {
					tableTaxableBenefits = e.cash_benefits + e.non_cash_benefits;
				}

				salaries.push(e.salary);
				taxableBenefits.push(tableTaxableBenefits);
				severances.push(e.severance);

				tableData.push([
					e.province,
					e.year,
					e.sector,
					e.employer,
					e.position_title,
					e.position_class,
					e.first_name,
					e.last_name,
					e.salary,
					tableTaxableBenefits,
					e.severance
				]);

				pushResponseDataToArrays(e);
			});

			//                                salary / taxable benefits / severance
			statisticalTableData.push(['Mean', mean(salaries), mean(taxableBenefits) , mean(severances)]);
			statisticalTableData.push(['Median', median(salaries), median(taxableBenefits), median(severances)]);
			statisticalTableData.push(['Mode', mode(salaries), mode(taxableBenefits), mode(severances)]);
			statisticalTableData.push(['Standard Deviation', stdDeviation(salaries), stdDeviation(taxableBenefits), stdDeviation(severances)]);

			regenerateMainTable();
			regenerateStatisticalTable();
			regenerateCharts();

			console.log('ajax success:');
			console.log(tableData);
		},
		error: function(xhr, ajaxOptions, thrownError) {
			console.log('Failed to send Ajax Call');
			console.log(xhr.responseText);
		}
	});
}

function resetResponseDataArrays() {
	responseData.province = [];
	responseData.year = [];
	responseData.sector = [];
	responseData.employer = [];
	responseData.salary = [];
	responseData.tableTaxableBenefits = [];
	responseData.severance = [];
}

function pushResponseDataToArrays(obj) {
	responseData.province.push(obj.province);
	responseData.year.push(obj.year);
	responseData.sector.push(obj.sector);
	responseData.employer.push(obj.employer);
	responseData.salary.push(obj.salary);
	responseData.tableTaxableBenefits.push(obj.tableTaxableBenefits);
	responseData.severance.push(obj.severance);
}

function updateChart(chartObj, chartData) {
	var canvasObj = document.getElementById(chartObj.canvasId).getContext("2d");
	if (chartObj.chart) chartObj.chart.destroy();
	chartObj.chart = new Chart(canvasObj, chartData);
}

$(document).ready(function() {
	apiGetTables();

	//Initialize sliders and their listeners
	$("#filter-rs-year").slider({
		range: true,
		min: 1996,
		max: 2017,
		values: [ apiCallData.yearLow, apiCallData.yearHigh ],
		slide: function(event, ui) {
			$("#filter-rs-year-val").text(ui.values[0] + " - " + ui.values[1]);
		},
		stop: function(event, ui) {
			apiCallData.yearLow = ui.values[0];
			apiCallData.yearHigh = ui.values[1];
			
			apiGetTables();
		}
	});

	$("#filter-rs-salary").slider({
		range: true,
		min: 100000,
		max: 5000000,
		values: [ apiCallData.salaryLow, apiCallData.salaryHigh ],
		slide: function(event, ui) {
			$("#filter-rs-salary-val").text(ui.values[0] + " - " + ui.values[1]);
		},
		stop: function(event, ui) {
			apiCallData.salaryLow = ui.values[0];
			apiCallData.salaryHigh = ui.values[1];

			apiGetTables();
		}
	});

	$("#filter-rs-taxable-benefits").slider({
		range: true,
		min: 0,
		max: 5000000,
		values: [ apiCallData.taxableBenefitsLow , apiCallData.taxableBenefitsHigh ],
		slide: function(event, ui) {
			$("#filter-rs-taxable-benefits-val").text(ui.values[0] + " - " + ui.values[1]);
		},
		stop: function(event, ui) {
			apiCallData.taxableBenefitsLow = ui.values[0];
			apiCallData.taxableBenefitsHigh = ui.values[1];

			apiGetTables();
		}
	});
	//Initialize province checkbox listeners
	$('input:checkbox').change(function() {
		console.log('checkbox change');
		var checkboxId = this.id;
		var checkboxIdSplit = checkboxId.split('-');

		if(checkboxIdSplit[1] === 'province' && checkboxIdSplit[2].length === 2) {
			var provinceSymbol = checkboxId.split('-')[2];

			if($('#'+checkboxId).is(':checked')) { //Add province symbol to apiCallData.provinces
				var alreadyAdded = false;
				apiCallData.provinces.forEach(function(e, i) {
					if(apiCallData.provinces[i] === provinceSymbol) {
						alreadyAdded = true;
					}
				});

				if(!alreadyAdded) {
					apiCallData.provinces.push(provinceSymbol);
				}
			} else { //Remove province symbol from apiCallData.provinces
				apiCallData.provinces.forEach(function(e, i) {
					if(apiCallData.provinces[i] === provinceSymbol) {
						apiCallData.provinces.splice(i, 1);
					}
				});
			}

			apiGetTables();
		}
	});

	$('input#checkbox-AB:checkbox').change(function() {
		if($(this).is(':checked')) {
			console.log('ontario is checked');
		} else {
			console.log('ontario is not checked');
		}
	});

	//Initialize front-end range sliders
	var yearRangeFromValue = $("#filter-rs-year").slider("values", 0);
	var yearRangeToValue = $("#filter-rs-year").slider("values", 1);
	$("#filter-rs-year-val").text(yearRangeFromValue + " - " + yearRangeToValue);

	var salaryRangeFromValue = $("#filter-rs-salary").slider("values", 0);
	var salaryRangeToValue = $("#filter-rs-salary").slider("values", 1);
	$("#filter-rs-salary-val").text(salaryRangeFromValue + " - " + salaryRangeToValue);

	var taxableBenefitsRangeFromValue = $("#filter-rs-taxable-benefits").slider("values", 0);
	var taxableBenefitsRangeToValue = $("#filter-rs-taxable-benefits").slider("values", 1);
	$("#filter-rs-taxable-benefits-val").text(taxableBenefitsRangeFromValue + " - " + taxableBenefitsRangeToValue);

	//Fill in the main table data:
	$('#main-sunshine-list-table tfoot th').each( function () {
		var title = $(this).text();
		$(this).html('<input type="text" placeholder="Search '+title+'" />');
	});

	$('#chart-selection-dropdown-menu-01').on('change', function(){
		selectedChartID = $('#chart-selection-dropdown-menu-01 option:selected').attr('id');
		console.log(selectedChartID);

		if (selectedChartID == "chart-opt-01") {
			updateChart(currentChart1, generateJobsBySectorPieChartData(responseData));
		}
		else if (selectedChartID == "chart-opt-02") {
			updateChart(currentChart1, generateSalaryBySectorPieChartData(responseData));
		}

	});

	$( "#chart-save-01").click(function() {
		$("#canvas-01").get(0).toBlob(function(blob) {
			saveAs(blob, "chart.png");
		});
	});

	$( "#chart-save-02").click(function() {
		$("#canvas-02").get(0).toBlob(function(blob) {
			saveAs(blob, "chart.png");
		});
	});

});