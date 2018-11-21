const express = require('express');
const app = express();

// setup Neo4j driver
const neo4j = require('neo4j-driver').v1;
const { graphenedbPass, graphenedbURL, graphenedbUser} = require('./environment')

// connect to Neo4j using the Bolt Protocol
// Neo4j.auth.basic takes two parameters, a username and a password
const driver = neo4j.driver(graphenedbURL, neo4j.auth.basic(graphenedbUser, graphenedbPass));

const session = driver.session();

// Dummy Route - To test
// testing connection to Neo4j by console logging user names
app.get('/', (req, res, next) => {
  session
    .run(`MATCH(n:User) RETURN n.name LIMIT 25`)
    .then(result =>
      result.records.forEach(record => console.log(record._fields))
    )
    .catch(err => console.log(err));

    res.send("Hello World")
});

// error handling
app.use((err, req, res, next) => {
  console.error(err, typeof next);
  console.error(err.stack);
  res.status(err.status || 500).send(err.message || 'Internal server error.');
});

module.exports = app;
