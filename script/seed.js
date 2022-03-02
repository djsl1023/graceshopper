"use strict";
const { faker } = require("@faker-js/faker");

const {
  db,
  models: { User, Product },
} = require("../server/db");

/**
 * seed - this function clears the database, updates tables to
 *      match the models, and populates the database.
 */
async function seed() {
  await db.sync({ force: true }); // clears db and matches models to tables
  console.log("db synced!");

  const createFakeUser = () => ({
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password: faker.internet.password(10),
    isAdmin: faker.datatype.boolean(),
  });

  const usersArray = [];
  for (let i = 0; i < 10; i++) {
    usersArray.push(createFakeUser());
  }
  const createFakeProduct = () => ({
    name: faker.commerce.product(),
    pennies: faker.datatype.number({min: 1, max: 100000}),
    imageUrl: faker.image.fashion(),
    description: faker.lorem.lines(3),
  });

  const productsArray = [];
  for (let i = 0; i < 30; i++) {
    productsArray.push(createFakeProduct());
  }

  const products = await Promise.all(
    productsArray.map((current) => {
      return Product.create(current);
    })
  );

  const users = await Promise.all(
    usersArray.map((current) => {
      return User.create(current);
    })
  );

  console.log(User);
  console.log(Product);
  const products = await Promise.all([
    Product.create({ name: "Shirt", price: 10 }),
    Product.create({ name: "Pants", price: 10 }),
    Product.create({ name: "Sweater", price: 10 }),
  ]);

  console.log(`seeded ${users.length} users`);
  console.log(`seeded ${products.length} products`);
  console.log(`seeded successfully`);
  return {
    users: {
      cody: users[0],
      murphy: users[1],
    },
  };
}

/*
 We've separated the `seed` function from the `runSeed` function.
 This way we can isolate the error handling and exit trapping.
 The `seed` function is concerned only with modifying the database.
*/
async function runSeed() {
  console.log("seeding...");
  try {
    await seed();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    console.log("closing db connection");
    await db.close();
    console.log("db connection closed");
  }
}

/*
  Execute the `seed` function, IF we ran this module directly (`node seed`).
  `Async` functions always return a promise, so we can use `catch` to handle
  any errors that might occur inside of `seed`.
*/
if (module === require.main) {
  runSeed();
}

// we export the seed function for testing purposes (see `./seed.spec.js`)
module.exports = seed;
