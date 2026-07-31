const express = require('express');
const controller = require('../controllers/restaurantsController');

const router = express.Router();

router.get('/stats/summary', controller.getSummary);
router.get('/', controller.listRestaurants);
router.get('/:id', controller.getRestaurant);
router.post('/', controller.createRestaurant);
router.patch('/:id', controller.updateRestaurant);
router.delete('/:id', controller.deleteRestaurant);

module.exports = router;
