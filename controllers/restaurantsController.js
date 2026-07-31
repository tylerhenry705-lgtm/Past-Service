const { ObjectId } = require('mongodb');
const { getDatabase } = require('../config/db');

const ALLOWED_SORT_FIELDS = new Set(['name', 'foundedYear', 'closedYear', 'peakLocations']);

function collection() {
  return getDatabase().collection('restaurants');
}

function parseInteger(value, fieldName, { required = false, min = 0 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${fieldName} is required.`);
    }
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min) {
    throw new Error(`${fieldName} must be an integer of at least ${min}.`);
  }
  return parsed;
}

function normalizeRestaurant(body, { partial = false } = {}) {
  const restaurant = {};
  const requiredTextFields = ['name', 'country', 'headquarters', 'closureReason', 'history'];

  for (const field of requiredTextFields) {
    if (body[field] !== undefined) {
      const value = String(body[field]).trim();
      if (!value) {
        throw new Error(`${field} cannot be empty.`);
      }
      restaurant[field] = value;
    } else if (!partial) {
      throw new Error(`${field} is required.`);
    }
  }

  const foundedYear = parseInteger(body.foundedYear, 'foundedYear', { required: !partial, min: 1800 });
  const closedYear = parseInteger(body.closedYear, 'closedYear', { required: !partial, min: 1800 });
  const peakLocations = parseInteger(body.peakLocations, 'peakLocations', { min: 0 });

  if (foundedYear !== undefined) restaurant.foundedYear = foundedYear;
  if (closedYear !== undefined) restaurant.closedYear = closedYear;
  if (peakLocations !== undefined) restaurant.peakLocations = peakLocations;

  const effectiveFounded = foundedYear ?? body.existingFoundedYear;
  const effectiveClosed = closedYear ?? body.existingClosedYear;
  if (effectiveFounded && effectiveClosed && effectiveClosed < effectiveFounded) {
    throw new Error('closedYear cannot be earlier than foundedYear.');
  }

  if (body.signatureItems !== undefined) {
    if (!Array.isArray(body.signatureItems)) {
      throw new Error('signatureItems must be an array of strings.');
    }
    restaurant.signatureItems = body.signatureItems
      .map((item) => String(item).trim())
      .filter(Boolean);
  } else if (!partial) {
    restaurant.signatureItems = [];
  }

  if (body.sourceNote !== undefined) {
    restaurant.sourceNote = String(body.sourceNote).trim();
  }

  return restaurant;
}

async function listRestaurants(req, res, next) {
  try {
    const filter = {};

    if (req.query.country) {
      filter.country = { $regex: req.query.country.trim(), $options: 'i' };
    }

    if (req.query.reason) {
      filter.closureReason = { $regex: req.query.reason.trim(), $options: 'i' };
    }

    if (req.query.search) {
      const search = req.query.search.trim();
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { headquarters: { $regex: search, $options: 'i' } },
        { history: { $regex: search, $options: 'i' } },
        { signatureItems: { $regex: search, $options: 'i' } }
      ];
    }

    if (req.query.decade) {
      const decade = parseInteger(req.query.decade, 'decade', { min: 1800 });
      filter.closedYear = { $gte: decade, $lte: decade + 9 };
    }

    const sortField = ALLOWED_SORT_FIELDS.has(req.query.sort) ? req.query.sort : 'name';
    const sortDirection = req.query.order === 'desc' ? -1 : 1;

    const restaurants = await collection()
      .find(filter)
      .sort({ [sortField]: sortDirection })
      .toArray();

    res.json({ count: restaurants.length, restaurants });
  } catch (error) {
    next(error);
  }
}

async function getRestaurant(req, res, next) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant ID.' });
    }

    const restaurant = await collection().findOne({ _id: new ObjectId(req.params.id) });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    res.json(restaurant);
  } catch (error) {
    next(error);
  }
}

async function createRestaurant(req, res, next) {
  try {
    const restaurant = normalizeRestaurant(req.body);
    restaurant.createdAt = new Date();
    restaurant.updatedAt = new Date();

    const result = await collection().insertOne(restaurant);
    const created = await collection().findOne({ _id: result.insertedId });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
}

async function updateRestaurant(req, res, next) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant ID.' });
    }

    const id = new ObjectId(req.params.id);
    const existing = await collection().findOne({ _id: id });
    if (!existing) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    const update = normalizeRestaurant(
      {
        ...req.body,
        existingFoundedYear: existing.foundedYear,
        existingClosedYear: existing.closedYear
      },
      { partial: true }
    );

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Provide at least one field to update.' });
    }

    update.updatedAt = new Date();
    await collection().updateOne({ _id: id }, { $set: update });
    const updated = await collection().findOne({ _id: id });
    res.json(updated);
  } catch (error) {
    next(error);
  }
}

async function deleteRestaurant(req, res, next) {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid restaurant ID.' });
    }

    const result = await collection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Restaurant not found.' });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

async function getSummary(req, res, next) {
  try {
    const [summary] = await collection()
      .aggregate([
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  restaurantCount: { $sum: 1 },
                  averageLifespan: {
                    $avg: { $subtract: ['$closedYear', '$foundedYear'] }
                  },
                  largestPeakLocations: { $max: '$peakLocations' }
                }
              },
              { $project: { _id: 0 } }
            ],
            byClosureDecade: [
              {
                $group: {
                  _id: {
                    $multiply: [
                      { $floor: { $divide: ['$closedYear', 10] } },
                      10
                    ]
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { _id: 1 } }
            ],
            byCountry: [
              { $group: { _id: '$country', count: { $sum: 1 } } },
              { $sort: { count: -1, _id: 1 } }
            ]
          }
        }
      ])
      .toArray();

    res.json({
      totals: summary.totals[0] || {
        restaurantCount: 0,
        averageLifespan: 0,
        largestPeakLocations: 0
      },
      byClosureDecade: summary.byClosureDecade,
      byCountry: summary.byCountry
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getSummary
};
