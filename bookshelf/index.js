//Setting up the database connection
const knex = require('knex')({
    client: 'mysql',
    connection: {
        user: 'foo',
        password: 'Bar_111111',
        database: 'organic'
    }
})
const bookshelf = require('bookshelf')(knex)

module.exports = bookshelf;