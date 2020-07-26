var express = require('express'),
	http = require('http'),
	env = process.env.NODE_ENV || 'development',
	config = require('./config.js')[env];

var app = module.exports = express();
require('./express-settings.js')(app);
require('./express-routes.js')(app);

var mysql = require('mysql');
var stream = require('stream');

var con = mysql.createConnection({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database
});

if(app.get('env')==='development') {
	app.use(require('errorhandler')());
	app.locals.pretty = true;
}

const fs = require('fs');

app.post('/getTable', function(req,res) {
	let filters = req.body;
	let tableName = "public_sector_high_earners";
	let queryLimit = 5000;
	
	let provinceQuery = "";
	
	if (filters.hasOwnProperty("provinces") && filters.provinces.length == 2)
		provinceQuery = provinceQuery.concat("AND (province = '" + filters.provinces[0] + "' OR province = '" + filters.provinces[1] +"')");
	else if (filters.hasOwnProperty("provinces") && filters.provinces.length == 1)
		provinceQuery = provinceQuery.concat("AND province = '" + filters.provinces[0] + "'");
	else
	{
		res.send({notice:"No data was returned.", tableData: []});
		return;
	}

	let querySel = `SELECT *, (COALESCE(taxable_benefits,0) + COALESCE(cash_benefits,0) + COALESCE(non_cash_benefits,0)) AS total 
					FROM ?
					WHERE year BETWEEN ? and ?
					AND salary BETWEEN ? and ?
					?
					HAVING total BETWEEN ? and ?
					ORDER BY year
					Limit ?`;

	con.connect(function(err) {
		con.query(querySel, [tableName,filters.yearLow,filters.yearHigh,filters.salaryLow,filters.salaryHigh,provinceQuery,filters.taxableBenefitsLow,filters.taxableBenefitsHigh,queryLimit], function (err, result, fields) {
				//console.log(result.length);
				if (result.length >= queryLimit)
			 		res.send({notice:"Your query has surpassed "+queryLimit+" results. You will only see the first "+queryLimit+" results.", tableData: result});
			 	else
					res.send({notice:null, tableData: result});
		});
	});
});




/*
app.post('/getTable', function(req,res) {
	let filters = req.body;
	let tableName = "public_sector_high_earners";
	let queryLimit = 5000;

	let querySel = "SELECT *, (COALESCE(taxable_benefits,0) + COALESCE(cash_benefits,0) + COALESCE(non_cash_benefits,0)) AS total FROM " + tableName;

	let filterQuery = " WHERE year BETWEEN " + filters.yearLow + " AND " + filters.yearHigh + " AND salary BETWEEN " + filters.salaryLow + " AND " + filters.salaryHigh;
	if (filters.hasOwnProperty("provinces") && filters.provinces.length == 2)
		filterQuery = filterQuery.concat(" AND (province = '" + filters.provinces[0] + "' OR province = '" + filters.provinces[1] +"')");
	else if (filters.hasOwnProperty("provinces") && filters.provinces.length == 1)
		filterQuery = filterQuery.concat(" AND province = '" + filters.provinces[0] + "'");
	else
	{
		res.send({notice:"No data was returned.", tableData: []});
		return;
	}
	querySel = querySel.concat(filterQuery," HAVING total between ",filters.taxableBenefitsLow, " AND ", filters.taxableBenefitsHigh," ORDER BY year Limit ", queryLimit, ";");

	con.connect(function(err) {
		console.log(querySel);
		con.query(querySel, function (err, result, fields) {
				//console.log(result.length);
				if (result.length >= queryLimit)
			 		res.send({notice:"Your query has surpassed "+queryLimit+" results. You will only see the first "+queryLimit+" results.", tableData: result});
			 	else
					res.send({notice:null, tableData: result});
		});
	});
});
*/


app.post('/getMaxMin', function(req,res) {
	let filters = req.body;
	let tableName = "public_sector_high_earners";

	if (filters.type == "max")
		query = "SELECT MAX(" + filters.field + ") AS minmax FROM " + tableName;
	else if (filters.type == "min")
		query = "SELECT MIN(" + filters.field + ") AS minmax FROM " + tableName;
	else
	{
		res.send({});
		return;
	}
	
	con.connect(function(err) {
		con.query(query, function (err, result, fields) {
			res.send(result);
		});
	});
});


http.createServer(app).listen(app.get('port'), function() {
	console.log('Express server listening on port '+app.get('port')+' in a '+env+' environment.');
});