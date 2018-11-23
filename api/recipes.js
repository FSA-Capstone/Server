const express = require('express');
const { findAllNodes, findNode, Models } = require('../db')
const router = express.Router();

router.get('/:id', (req, res, next) => { 

  findNode(Models.Recipe, {id: req.params.id })
    .then(recipe => res.send(recipe))
    .catch(next);

});

router.get('/', (req, res, next) => { 

  findAllNodes(Models.Recipe)
    .then(recipes => res.send(recipes))
    .catch(next);

});

module.exports = router;