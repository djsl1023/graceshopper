const router = require('express').Router();
const {
  models: { Product, Order, User, OrderProduct },
} = require('../db');

// ADD TO CART
router.post('/current', async (req, res, next) => {
  try {
    const currUser = await User.findByToken(req.headers.authorization);
    const { productId, quantity } = req.body;

    if (currUser) {
      //FIND CURRENTLY PENDING ORDER
      const currOrder = await Order.findOne({
        where: {
          userId: currUser.id,
          confirmed: false,
        },
      });
      //CHECK IF CART EXISTS-> IF NOT, CREATE ONE, ADD PRODUCT TO CART
      if (!currOrder) {
        const newOrder = await currUser.createOrder();
        const addedProd = await newOrder.addProduct(productId, {
          through: { quantity: quantity },
        });
        res.json(addedProd);
      } else {
        const addedProd = await currOrder.addProduct(productId, {
          through: { quantity: quantity },
        });
        res.json(addedProd);
      }
    }
  } catch (err) {
    console.error(err);
  }
});
//TO SEE CURRENT CART
router.get('/current', async (req, res, next) => {
  try {
    const currUser = await User.findByToken(req.headers.authorization);
    if (currUser) {
      // ALTERNATE WAY TO GRAB DATA : MAY USE IF THERE ARE PROBLEMS IMPLEMENTING FRONT END
      // const currOrder2 = await Order.findOne({
      //   where: {
      //     userId: currUser.id,
      //     confirmed: false,
      //   },
      // });
      // const ex = await currOrder2.getProducts({
      //   joinTableAttributes: ['quantity'],
      // });
      // const currOrder = await Order.findOne({
      //   where: {
      //     userId: currUser.id,
      //     confirmed: false,
      //   },
      //   include: [
      //     {
      //       model: Product,
      //       through: {
      //         attributes: ['quantity'],
      //       },
      //     },
      //   ],
      // });
      const currOrder = await Order.findPendingByUserId(currUser.id);
      res.json(currOrder);
    } else {
      //REPLACE WITH GUEST CART
      next();
    }
  } catch (error) {
    console.error(error);
    next();
  }
});
router.put('/current', async (req, res, next) => {
  try {
    const currUser = await User.findByToken(req.headers.authorization);
    // IF CURRENT USER EXISTS
    if (currUser) {
      const { confirmed } = req.body;
      //CHECKING IF PURCHASE BUTTON WAS CLICKED
      //(SEND confirmed: true FROM FRONT END)
      if (confirmed) {
        const { orderId } = req.body;
        const currOrder = await Order.findByPk(orderId, {
          where: {
            userId: currUser.id,
            confirmed: false,
          },
        });
        //UPDATE CART TO CONFIRMED
        await currOrder.update({ confirmed: true });
      } else {
        // IF PURCHASE BUTTON WASNT CLICKED -> UPDATE CART WAS CLICKED
        //(SEND updated: [{productId, quantity}], orderId, FROM FRONT END)
        // GRABBING UPDATED ITEMS FROM CART
        const { updated, orderId } = req.body;
        // GRABBING CURRENT UNCONFIRMED CART
        const currOrder = await Order.findByPk(orderId, {
          where: {
            confirmed: false,
          },
        });
        // CHECKING IF USER OWNS THIS CART
        if (currUser.hasOrder(currOrder)) {
          // IF THEY DO, LOOP THROUGH UPDATED ITEMS({productId, quantity}) AND UPDATE CART CONTENTS
          updated.forEach(async (currItem) => {
            const currOrderItem = await OrderProduct.findOne({
              where: {
                orderId: orderId,
                productId: currItem.id,
              },
            });
            await currOrderItem.update({ quantity: currItem.quantity });
          });
        }
      }
    }
  } catch (err) {
    console.error(err);
    next();
  }
});
router.delete('/current', async (req, res, next) => {
  try {
    const { orderId, productId } = req.body;
  } catch (err) {
    console.error(err);
    next(err);
  }
});
//CREATING A NEW CART
router.post('/', async (req, res, next) => {
  try {
    const currUser = await User.findByToken(req.headers.authorization);
    if (currUser) {
      const newCart = await currUser.createOrder();
    }
  } catch (err) {
    console.error(err);
    next();
  }
});

router.get('/past', async (req, res, next) => {
  try {
    const currUser = await User.findByToken(req.headers.authorization);
    if (currUser) {
      const pastOrders = await Order.findAll({
        where: {
          userId: currUser.id,
          confirmed: true,
        },
        include: [
          {
            model: Product,
            through: {
              attributes: ['quantity'],
            },
          },
        ],
      });
      res.json(pastOrders);
    }
  } catch (error) {
    console.error(error);
    next();
  }
});

router.get('/past/:id', async (req, res, next) => {
  try {
    const currUser = await User.findByToken(req.headers.authorization);
    if (currUser) {
      const orderId = req.params.id;
      const pastOrder = await Order.findByPk(orderId, {
        where: {
          userId: currUser.id,
        },
        include: [
          {
            model: Product,
            through: {
              attributes: ['quantity'],
            },
          },
        ],
      });
      res.json(pastOrder);
    }
  } catch (err) {
    console.error(err);
    next();
  }
});
module.exports = router;
