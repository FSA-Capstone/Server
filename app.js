const express = require('express');
const app = express();
const neo4j = require('neo4j-driver').v1;

// connect to Neo4j using the Bolt Protocol
// Neo4j.auth.basic takes two parameters, a username (dangerously set to default right now and a password)
const driver = neo4j.driver(
  'bolt://localhost', neo4j.auth.basic('neo4j', 'ne1Upbph2'
  ));
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
