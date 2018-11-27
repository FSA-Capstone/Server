const axios = require('axios');
const { parse } = require('recipe-ingredient-parser');
const { API_KEY } = require('../config'); 
const neode = require('./conn');
const { Models, Relationships } = require('./models/constants');

const findAllNodes = (model) => { 
  return neode.all(model)
    .then( result => {
      if(!result) {
        return [];
      }
      return result.toJson();
    });
}

const findNode = (model, params) => {
  return neode.first(model, params)
   .then( result => {
      if(!result) {
        return null;
      }
      return result.toJson();
    });
}

const createNode = (model, properties) => {
  return neode.create(model, properties);
}

const findOrCreateNode = (model, params) => {
  return findNode(model, params)
    .then(response => {
      if(!response) {
        return createNode(model, params);
      }
      return response;
    })
}

const updateNode = (model, params, properties) => {
  return neode.first(model, params)
    .then(node => node.update(properties));
}

const findConditionalNodes = (model, params, relation, direction, target) => { 

  return neode.query()
    .match('n', model)
    .relationship(relation, direction, 'r')
    .to('t', target)
    .where(params)
    .return('properties (n) as result')
    .execute()
    .then(data => data.records)
    .then(result => {
      let response = [];
      if(result.length) {
        response = result.map(element => element.toObject()['result'])
      }
      return response;
    });
}

const findRelationships = (model, params, relation, direction, target) => {
  return neode.query()
    .match('n', model)
    .where(params)
    .relationship(relation, direction, 'r')
    .to('t', target)
    .return('properties(t) as properties_target, properties(r) as properties_relation')
    .execute()
    .then(response => response.records)
    .then(result => {
      let relationships = [];
      if(result.length) {
        relationships = result.map(element => {
          return {
            properties: element.toObject()['properties_target'],
            relation: element.toObject()['properties_relation']
          }
        })
      }
      return relationships;
    });
}

const createRelationship = (source, target, relationship, properties) => {
  let sourceNode;
  return neode.first(source.model, source.params)
   .then( result => {
      sourceNode = result;
      return neode.first(target.model, target.params)
    }).then( targetNode => {
      return sourceNode.relateTo(targetNode, relationship, properties);
    })
}

const deleteRelationship = (source, target, params, relation, direction) => {
  return neode.query()
    .match('n', source)
    .relationship(relation, direction, 'r')
    .to('t', target)
    .where(params)
    .delete('r')
    .execute();
}

const saveRecipe = async ({ name, instructions, postedByUserId, categoryName, cuisineName, ingredients, imageUrl, videoUrl }) => { 
  try 
  {
    await createNode(Models.Recipe, { name, instructions, imageUrl, videoUrl });
    await findOrCreateNode(Models.Category, { name: categoryName });
    await findOrCreateNode(Models.Cuisine, { name: cuisineName });
    await Promise.all([
      createRelationship({ model: Models.Recipe, params: { name } },
        { model: Models.User, params: { id: postedByUserId } }, Relationships.postedBy),
      createRelationship({ model: Models.User, params: { id: postedByUserId } },
        { model: Models.Recipe, params: { name } }, Relationships.hasPosted),
      createRelationship({ model: Models.Recipe, params: { name } },
        { model: Models.Category, params: { name: categoryName } }, Relationships.isOfCategory),
      createRelationship({ model: Models.Recipe, params: { name } },
        { model: Models.Cuisine, params: { name: cuisineName } }, Relationships.isOfCuisine),
    ])
    const lines = ingredients.match(/[^\r\n]+/g);
    for(let i = 0; i < lines.length; i++) {
      saveIngredients(parse(lines[i]), name);
    }
    const response = await findNode(Models.Recipe, { name })
    return response.id
  } 
  catch(error) 
  {
    console.log(error);
    throw error;
  }
}

const saveIngredients = async ({ quantity, unit, ingredient }, name) => {
  try
  {
    let ingredientNode = await findNode(Models.Ingredient, { name: ingredient });
    if(!ingredientNode) 
    {
      const response = await axios.post(
        'https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/food/products/classify',
        { title: ingredient, upc:'', plu_code:''},
        { headers: { 'X-Mashape-Key': API_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json' } });

      const breadcrumbs = response.data.breadcrumbs.filter(b => b != 'ingredient');
      const tags = (breadcrumbs && breadcrumbs.length) ? breadcrumbs.join(',') : '';
      const typeRaw = breadcrumbs.pop();
      const type = typeRaw ? typeRaw : 'Unknown';

      ingredientNode = await createNode(Models.Ingredient, { name: ingredient, tags });
      await findOrCreateNode(Models.IngredientType, { name: type });
      await createRelationship({ model: Models.Ingredient, params: { name: ingredient } },
        { model: Models.IngredientType, params: { name: type } }, Relationships.isOfIngredientType);

      console.log(`New Ingredient created: ${{ name: ingredient, tags }}`)
    }
    await createRelationship({ model: Models.Recipe, params: { name } },
      { model: Models.Ingredient, params: { name: ingredient } }, Relationships.hasIngredient,
      { measure: `${quantity} ${unit}`});
  }
  catch(error) {
    console.log(error);
    throw error;
  }
}

module.exports = {
  findAllNodes,
  findNode,
  findRelationships,
  createRelationship,
  deleteRelationship,
  findConditionalNodes,
  createNode,
  findOrCreateNode,
  updateNode,
  saveRecipe
}