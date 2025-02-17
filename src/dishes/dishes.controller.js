const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

//Middleware:

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);

    if (foundDish) {
        res.locals.foundDish = foundDish;
        return next();
    } else {
        return next({
        status: 404,
        message: `Dish does not exist: ${dishId}`
    });
    }        
}

function validateBodyId(req, res, next) {
    const { data: { id }} = req.body;
    const { dishId } = req.params;

    if (!id) {
        return next();
    }

    id === dishId ? next() : next({
        status: 404,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`
    });
}

function validateProperties(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;

    if (!name) {
        return next({
            status: 400,
            message: "Dish must include a name"
        });
    }

    if (!description) {
        return next({
            status: 400,
            message: "Dish must include a description"
        });
    }

    if (!price) {
        return next({
            status: 400,
            message: "Dish must include a price"
        });
    } else if (price <= 0 || !Number.isInteger(price)) {
        return next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0"
        });
    }

    if (!image_url) {
        return next({
            status: 400,
            message: "Dish must include a image_url"
        });
    }

    res.locals.newDish = req.body.data;
    return next();
}

//Routes:

function create(req, res) {
    const newDish = res.locals.newDish;
    const newId = nextId();
    newDish.id = newId;

    dishes.push(newDish);
    return res.status(201).json({ data: newDish });
}

function list(req, res) {
    return res.status(200).json({ data: dishes });
}

function read(req, res) {
    return res.status(200).json({ data: res.locals.foundDish });
}

function update(req, res) {
    const { name, description, price, image_url } = res.locals.newDish;
    const foundDish = res.locals.foundDish;
  
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;

    return res.status(201).json({ data: foundDish });
}

module.exports = {
    create: [validateProperties, create],
    list,
    read: [dishExists, read],
    update: [validateBodyId, validateProperties, dishExists, update],
};