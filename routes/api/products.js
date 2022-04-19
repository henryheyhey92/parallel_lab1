const express = require('express');
const router =express.Router();

const productDataLayer = require()

router.get('/', async function (req, res){
    res.send(await productDataLayer.getAllProduct)
})

module.exports = router;