const express = require("express");
const router = express.Router();

// #1 import in the Product model
const { Product, Category, Tag } = require('../models')

// import in the Forms
const { bootstrapField, createProductForm } = require('../forms');

//import in the CheckIfAuthenticated middleware
const {checkIfAuthenticated} = require('../middleware');

async function getProductById(productId){
    // eqv of
    // select * from products where id = ${productId}
    const product = await Product.where({
        'id': productId
    }).fetch({
        'require': true, // will cause an error if not found
        'withRelated':['category', 'tags']  // load in the associated category and tags
    })
    return product;

}

async function getAllCategories() {
    const allCategories = await Category.fetchAll().map( category => {
        return [ category.get('id'), category.get('name')]
    });
    return allCategories;
}

async function getAllTags() {
    const allTags = await Tag.fetchAll().map( tag => {
        return [ tag.get('id'), tag.get('name')]
    })
    return allTags;
}

router.get('/', async (req, res) => {
    // #2 - fetch all the products (ie, SELECT * from products)
    let products = await Product.collection().fetch({
        withRelated:['category', 'tags']
    });
    res.render('products/index', {
        'products': products.toJSON() // #3 - convert collection to JSON
    })
})

router.get('/create', checkIfAuthenticated, async (req, res) => {

    const allCategories = await Category.fetchAll().map((category)=>{
        return [category.get('id'), category.get('name')];
    })

    const allTags = await Tag.fetchAll().map( tag => [tag.get('id'), tag.get('name')]);

    const productForm = createProductForm(allCategories, allTags);
    res.render('products/create', {
        'form': productForm.toHTML(bootstrapField)
    })
})


router.post('/create', checkIfAuthenticated, async (req, res) => {

    const allCategories = await Category.fetchAll().map((category) => {
        return [category.get('id'), category.get('name')];
    })
    const productForm = createProductForm(allCategories);
    productForm.handle(req, {
        'success': async (form) => {
            //separate out tags from the other product data
            //as not to cause an error when we create 
            // the new product
            let {tags, ...productData} = form.data;
            const product = new Product(productData);
            // product.set('name', form.data.name);
            // product.set('cost', form.data.cost);
            // product.set('description', form.data.description);
            await product.save();
            if(tags) {
                await product.tags().attach(tags.split(","));
            }
            req.flash("success_messages", `New Product ${product.get('name')} has been created`)
            res.redirect('/products');
        },
        'error': async (form) => {
            res.render('products/create', {
                'form': form.toHTML(bootstrapField)
            })
        }

    })
})


router.get('/:product_id/update', async (req, res) => {
    // retrieve the product
    const productId = req.params.product_id
    const product = await Product.where({
        'id': productId
    }).fetch({
        require: true,
        withRelated:['category','tags']
    });
    //fetch all the tags
    const allTags = await Tag.fetchAll().map( tag => [tag.get('id'), tag.get('name')]);


    // fetch all the categories
    const allCategories = await Category.fetchAll().map((category)=>{
        return [category.get('id'), category.get('name')];
    })

    const productForm = createProductForm(allCategories, allTags);

    // fill in the existing values
    productForm.fields.name.value = product.get('name');
    productForm.fields.cost.value = product.get('cost');
    productForm.fields.description.value = product.get('description');
    productForm.fields.category_id.value = product.get('category_id');

    //fill in the muti-select for the tags
    let selectedTags = await product.related('tags').pluck('id');
    productForm.fields.tags.value = selectedTags;

    res.render('products/update', {
        'form': productForm.toHTML(bootstrapField),
        'product': product.toJSON()
    })

})

router.post('/:product_id/update', async (req, res) => {

    //fetch all the categories
    // const allCategories = await (await Category.fetchAll()).invokeMap((category)=>{
    //     return [category.get('id'), category.get('name')];
    // })
 
    // fetch the product that we want to update
    const product = await Product.where({
        'id': req.params.product_id
    }).fetch({
        require: true,
        withRelated:['category','tags']
    });

    // process the form
    const productForm = createProductForm();
    productForm.handle(req, {
        'success': async (form) => {
            let {tags, ...productData} = form.data
            product.set(productData);
            product.save();

            let tagIds = tags.split(',');
            let existingTagIds = await product.related('tags').pluck('id');

            // remove all the tags that aren't selected anymore
            let toRemove = existingTagIds.filter( id => tagIds.includes(id) === false);
            await product.tags().detach(toRemove);

            // add in all the tags selected in the form
            await product.tags().attach(tagIds);


            res.redirect('/products');
        },
        'error': async (form) => {
            res.render('products/update', {
                'form': form.toHTML(bootstrapField),
                'product': product.toJSON()
            })
        }
    })

})


router.get('/:product_id/delete', async(req,res)=>{
    // fetch the product that we want to delete
    const product = await Product.where({
        'id': req.params.product_id
    }).fetch({
        require: true
    });

    res.render('products/delete', {
        'product': product.toJSON()
    })

});


router.post('/:product_id/delete', async(req,res)=>{
    // fetch the product that we want to delete
    const product = await Product.where({
        'id': req.params.product_id
    }).fetch({
        require: true
    });
    await product.destroy();
    res.redirect('/products')
})

module.exports = router;