const { Models } = require('./constants');

module.exports = {
  id: {
    primary: true,
    type: 'uuid',
    required: true, 
  },
  name: {
    type: 'string',
    required: true,
    invalid: [''],
  },
  userName: {
    type: 'string',
    required: true,
    unique: true,
    invalid: [''],
  },
  password: {
    type: 'string',
    required: true,
    invalid: [''],
  },
  email: {
    type: 'string',
    required: true,
    unique: true,
    email: true,
    invalid: [''],
  },
  active: {
    type: 'boolean',
    required: true,
    default: true,
  },
  isAdmin: {
    type: 'boolean',
    default: false,
    required: true,
  },
  hasSaved: {
    type: 'relationship',
    relationship: 'HAS_SAVED',
    direction: 'out',
    target: Models.Recipe,
  },
  hasPosted: {
    type: 'relationship',
    relationship: 'HAS_POSTED',
    direction: 'out',
    target: Models.Recipe,
  },
};