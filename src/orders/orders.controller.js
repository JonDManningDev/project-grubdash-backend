const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

//Middleware:

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order with ID ${orderId} cannot be found.`,
    });
  }

  res.locals.foundOrder = foundOrder;
  return next();
}

function validateBodyId(req, res, next) {
  const {
    data: { id },
  } = req.body;
  const { orderId } = req.params;

  if (!id) {
    return next();
  }

  id === orderId
    ? next()
    : next({
        status: 400,
        message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
      });
}

function validateDishes(dishes) {
  if (!dishes) {
    return "Order must include a dish";
  } else if (!Array.isArray(dishes) || !dishes.length) {
    return "Order must include at least one dish";
  }

  for (let i = 0; i < dishes.length; i++) {
    const message = validateQuantity(dishes[i], i);
    if (message) {
      return message;
    }
  }
}

function validateProperties(req, res, next) {
  const {
    data: { deliverTo, mobileNumber, dishes },
  } = req.body;

  if (!deliverTo) {
    return next({
      status: 400,
      message: "Order must include a deliverTo",
    });
  }

  if (!mobileNumber) {
    return next({
      status: 400,
      message: "Order must include a mobileNumber",
    });
  }

  const message = validateDishes(dishes);
  if (message) {
    return next({
      status: 400,
      message: message,
    });
  }

  res.locals.newOrder = req.body.data;
  return next();
}

function validateQuantity(dish, index) {
  const quantity = dish.quantity;

  if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
    return `dish ${index} must have a quantity that is an integer greater than 0`;
  }
}

function validateStatus(req, res, next) {
  if (req.method === "DELETE") {
    if (res.locals.foundOrder.status !== "pending") {
      return next({
        status: 400,
        message: "An order cannot be deleted unless it is pending.",
      });
    } else {
      return next();
    }
  }

  const {
    data: { status },
  } = req.body;
  if (!status) {
    return next({
      status: 400,
      message:
        "Order must have a status of pending, preparing, out-for-delivery, delivered",
    });
  } else if (res.locals.foundOrder.status === "delivered") {
    return next({
      status: 400,
      message: "A delivered order cannot be changed",
    });
  }

  res.locals.status = status;
  next();
}

//Routes:

function create(req, res) {
  const newOrder = res.locals.newOrder;
  newOrder.id = nextId();

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function destroy(req, res) {
  const foundOrder = res.locals.foundOrder;
  const indexToDelete = orders.findIndex((order) => order.id === foundOrder.id);

  orders.splice(indexToDelete, 1);
  return res.sendStatus(204);
}

function list(req, res) {
  return res.status(200).json({ data: orders });
}

function read(req, res) {
  const foundOrder = res.locals.foundOrder;

  return res.status(200).json({ data: foundOrder });
}

function update(req, res) {
  const { deliverTo, mobileNumber, dishes } = res.locals.newOrder;
  const status = res.locals.status;
  const foundOrder = res.locals.foundOrder;

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;
  foundOrder.status = status;

  return res.status(200).json({ data: foundOrder });
}

module.exports = {
  create: [validateProperties, create],
  delete: [orderExists, validateStatus, destroy],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    validateBodyId,
    validateProperties,
    validateStatus,
    update,
  ],
};
