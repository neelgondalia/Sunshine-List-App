/*
 * This file creates the required database and tables for the application to run.
 * Once the database is generated it proceeds to load the database with public sectory salary data.
 * @Author Max Mastalerz
 */

let fs = require('fs'),
	path = require('path'),
	mysql = require('mysql'),
	csv = require('csv-parser'),
	sqlstring = require('sqlstring'),
	env = process.env.NODE_ENV || 'development',
	config = require('../config.js')[env];

let connection = mysql.createConnection({
	host: config.host,
	user: config.user,
	password: config.password,
	database: config.database,
	multipleStatements: true
});

connection.connect();

createTable().then(function(createTableResult) {
	console.log('Created Table');
	return getRegions();
}).catch(function(createTableError) {
	console.log("createTable() error.", createTableError);
}).then(function(regions) {
	console.log('Got Regions: ');
	console.log(regions);
	return parseRegions(regions);
}).catch(function(error) {
	console.log("getRegions() error.", error);
}).then(function() {
	console.log('Done parsing regions!');
	connection.end();
});

function createTable() {
	return new Promise(function(resolve, reject) {
		connection.query(`
			CREATE TABLE IF NOT EXISTS ${config.database}.public_sector_high_earners (
				id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
				province VARCHAR(2) NOT NULL,
				year YEAR NOT NULL,
				sector NVARCHAR(512),
				employer NVARCHAR(512),
				position_title NVARCHAR(512),
				position_class NVARCHAR(512),
				first_name NVARCHAR(128),
				last_name NVARCHAR(128),
				salary DECIMAL(11,2),
				taxable_benefits DECIMAL(11,2),
				cash_benefits DECIMAL(11,2),
				non_cash_benefits DECIMAL(11,2),
				severance DECIMAL(11,2)
			)
			ENGINE = InnoDB;
			`,
			function(error, results) {
				if(error) {
					reject(error);
				} else {
					resolve(results);
				}
			}
		);
	});
}

function getRegions() {
	return new Promise(function(resolve, reject) {
		let regions = path.resolve(__dirname, '../data/public-sector-earnings');

		fs.readdir(regions, function(error, items) {
			if(error) {
				reject(error);
			} else {
				resolve(items);
			}
		});
	});
}

function parseRegions(regions) {
	return new Promise(async function(resolve, reject) {
		for(let i=0; i<regions.length; i++) {
			console.log('started to parse region: '+regions[i]);
			// Wait for the promise to resolve before advancing the for loop
			await parseDataFilesInRegion(regions[i]);
		}
		resolve();
	});
}

function parseDataFilesInRegion(region) {
	return new Promise(function(resolve, reject) {
		let regionDir = path.resolve(__dirname, '../data/public-sector-earnings/', region);

		fs.readdir(regionDir, function(err, dataFiles) {
			if(dataFiles.length!=0) {
				parseDataFiles(dataFiles, region)
				.then(function(rowInsertionResults) {
					resolve(regionDir);
				}).catch(function(error) {
					reject(error);
				});
			} else {
				resolve(regionDir);
			}
		});
	});
}

function getProbableYearFromString(str) {
	if(str.match(/\d{1,4}/)) {
		return str.match(/\d{1,4}/)[0];
	}
}

function parseDataFiles(dataFiles, region) {
	return new Promise(async function(resolve, reject) {
		let regionDir = path.resolve(__dirname, '../data/public-sector-earnings/', region);
		let dataFilesParsed = 0;

		for(let i=0; i<dataFiles.length; i++) {
			let dataFile = dataFiles[i];
			let probableYear = getProbableYearFromString(dataFile); //Try to extract a year from the file's name.

			if(path.extname(dataFile) === '.csv') {
				console.log('Beginning to parse ' + region+'/'+dataFile);
				// Wait for the promise to resolve before advancing the for loop
				await parseCSVDataFile(region, probableYear, regionDir+'/'+dataFile)
				.then(function(rowInsertionResults) {
					dataFilesParsed++;
					console.log(region+'/'+dataFile+' parsed and loaded to database.');
					if(dataFilesParsed === dataFiles.length) {
						resolve(rowInsertionResults);
					}
				})
				.catch(function(error) {
					console.log("getRegions() error.", error);
				});
			} else if(path.extname(dataFile) === '.json') {
				console.log('JSON not supported! Skipping region'+'/'+dataFile);
			}
		}
	});
}

function parseCSVDataFile(region, probableYear, filePath) {
	return new Promise(function(resolve, reject) {
		let csvRows = [];

		fs.createReadStream(filePath)
		.pipe(csv())
		.on('data', function(data) {
			csvRows.push(data);
		})
		.on('end', function() {
			let rowsProcessed = 0;
			rowInsertionResults = [];
			csvRows.forEach(function(row, i) {
				row['Region'] = region;

				insertRowToDB(row, probableYear)
				.then(function(result) {
					rowInsertionResults.push(result);
					rowsProcessed++;
					if(rowsProcessed === csvRows.length) {
						resolve(rowInsertionResults);
					}
				}).catch(function(error) {
					console.log("insertRowToDB() error.", error);
					reject(error);
				});
			});
		});
	});
}

function isValidYear(s) {
	return /^\+?[0-9]{1,4}$/.test(s);
}

function isValidTaxableBenefits(taxableBenefits) {
	if(taxableBenefits=='') {
		return false;
	}

	return true;
}

function insertRowToDB(row, probableYear) {
	return new Promise(function(resolve, reject) {
		//Replace 'NULL' values from csv with an actual null.
		for(let prop in row) {
			if(row[prop] === 'NULL') {
				row[prop] = null;
			}
		}

		//Sadly, the government does a bad job at staying consistent with their column naming.
		//They also do a horrible job at formatting the file correctly
		let region 			= row['Region'];
		let year 			= row['Calendar Year'] || row['Calendar year'] || row['Year'];
		let sector 			= row['Sector'] || row['Ministry'];
		let firstName 		= row['First Name'];
		let lastName 		= row['Last Name'] || row['Surname'];
		let employer 		= row['Employer'];
		let jobTitle 		= row['Job Title'] || row['Job title'] || row['PositionTitle'];
		let positionClass 	= row['PositionClass'];
		let salaryPaid 		= (row['Salary Paid'] || row['Salary Paid '] || row['BaseSalary']);
		let taxableBenefits = row['Taxable Benefits'];
		let cashBenefits 	= row['CashBenefits'];
		let nonCashBenefits = row['NonCashBenefits'];
		let severance 		= row['Severance'];
		//Fixing the governments badly exported CSV file...
		if(!isValidYear(year)) {
			jobTitle += year; //The job title had a comma in it and jumped over to the year column
			year = probableYear; //Resort to reading year from the file name.
		}
		if(salaryPaid!=undefined) {
			salaryPaid = salaryPaid.replace(/\$|,|-/g, '');
		}
		if(taxableBenefits!=undefined) {
			taxableBenefits = taxableBenefits.replace(/\$|,|-/g, '');
		}
		if(!isValidTaxableBenefits(taxableBenefits)) {
			taxableBenefits = 0;
		}
		if(cashBenefits!=undefined) {
			cashBenefits = cashBenefits.replace(/\$|,|-/g, '');
		}
		if(nonCashBenefits!=undefined) {
			nonCashBenefits = nonCashBenefits.replace(/\$|,|-/g, '');
		}
		if(severance!=undefined) {
			severance = severance.replace(/\$|,|-/g, '');
		}

		//Escape strings for mysql insert statement
		region = sqlstring.escape(region);
		year = sqlstring.escape(year);
		sector = sqlstring.escape(sector);
		employer = sqlstring.escape(employer);
		jobTitle = sqlstring.escape(jobTitle);
		positionClass = sqlstring.escape(positionClass);
		firstName = sqlstring.escape(firstName);
		lastName = sqlstring.escape(lastName);
		salaryPaid = sqlstring.escape(salaryPaid);
		taxableBenefits = sqlstring.escape(taxableBenefits);
		cashBenefits = sqlstring.escape(cashBenefits);
		nonCashBenefits = sqlstring.escape(nonCashBenefits);
		severance = sqlstring.escape(severance);

		let query = `
		INSERT INTO public_sector_high_earners
		(
			province,
			year,
			sector,
			employer,
			position_title,
			position_class,
			first_name,
			last_name,
			salary,
			taxable_benefits,
			cash_benefits,
			non_cash_benefits,
			severance
		)
		VALUES
		(
			${region},
			${year},
			${sector},
			${employer},
			${jobTitle},
			${positionClass},
			${firstName},
			${lastName},
			${salaryPaid},
			${taxableBenefits},
			${cashBenefits},
			${nonCashBenefits},
			${severance}
		);
		`;

		connection.query(query,
		function(error, results) {
			if(error) {
				console.log('query error occured at:');
				console.log(query);
				reject(error);
			} else {
				resolve(results);
			}
		});
	});
}