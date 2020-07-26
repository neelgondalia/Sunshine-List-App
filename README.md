## Description

The app is intended to display sunshine list data and various graphs to better understand the data.

## Steps to install & run for the first time

1. Clone the repository.

2. cd into the directory.

$ cd sunshine-list-app

3. Install dependencies.

$ npm install

4. Copy config.example.js and rename it to config.js. Input your database credentials.

5. Load in the data for the application to run. Edit the username, and database name to match that in your config.

$ cd scripts

$ wget http://maxmastalerz.com/wp-content/uploads/database-export.sql

$ cd ../

$ mysql -u <your_username> -p sunshine_list_app < scripts/database-export.sql

OR generate the db tables manually from the raw csv data.
WARNING: Generating from csv data will take a very long time. You're better off loading it from mysqldump above ^

$ npm run-script generate-db-from-csv-data

6. Run the application.

$ node app.js

7. Visit localhost:3000

## The Data

The data for this application has been collected from the following sources:
- https://www.ontario.ca/page/public-sector-salary-disclosure
- https://open.alberta.ca/opendata/public-disclosure-of-salary-and-severance

## Developers that worked on this application:

- Neel Gondalia
- Max Mastalerz
- Alistair Carscadden
- Alex Robinson-Kenner
- Jonathan Hovich