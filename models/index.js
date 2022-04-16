const bookshelf = require('../bookshelf')

const Product = bookshelf.model('Product', {
    tableName:'products',
    category() {
        return this.belongsTo('Category');
    },
    tags(){
        return this.belongsToMany('Tag');
    }
});

const Category = bookshelf.model('Category',{
    tableName: 'categories',
    category() {
        return this.hasMany('Product', 'category_id');
    }
})

const Tag = bookshelf.model('Tag',{
    tableName: 'tags',
    products() {
        return this.belongsToMany('Product')
    }
})

module.exports = { Product, Category, Tag};