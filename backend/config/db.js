const mongoose = require('mongoose');

// Connect to TEST database as primary (for writes)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_TEST_URI);
    console.log('Connected to TEST MongoDB');
  } catch (error) {
    console.error('TEST MongoDB connection error:', error);
    process.exit(1);
  }
};

// Secondary connection for MAIN database (for fallback)
const mainDbConnection = mongoose.createConnection(process.env.MONGODB_MAIN_URI);

mainDbConnection.on('connected', () => {
  console.log('Connected to MAIN MongoDB (Fallback)');
});

mainDbConnection.on('error', (err) => {
  console.error('MAIN MongoDB connection error:', err);
});

const executeQuery = (MongooseModel, query, options = {}) => {
  let q = MongooseModel.find(query);
  if (options.populate) {
    if (Array.isArray(options.populate)) {
      options.populate.forEach(p => { q = q.populate(p); });
    } else {
      q = q.populate(options.populate);
    }
  }
  if (options.select) q = q.select(options.select);
  if (options.sort) q = q.sort(options.sort);
  if (options.limit) q = q.limit(options.limit);
  return q.exec();
};

/**
 * Smart query helper function
 * Tries Test DB first, if empty (0 documents), falls back to Main DB
 */
const smartQuery = async (Model, query = {}, options = {}) => {
  // 1. Try Test DB first
  let results = await executeQuery(Model, query, options);

  // 2. If result is empty (0 documents), fall back to Main DB
  if (!results || results.length === 0) {
    // Get the model dynamically from the main connection using the same schema
    // Check if model already exists on connection to avoid OverwriteModelError
    const MainModel = mainDbConnection.models[Model.modelName] || mainDbConnection.model(Model.modelName, Model.schema);
    results = await executeQuery(MainModel, query, options);
    
    if (results && results.length > 0) {
      console.log(`[DB: main fallback] Served from main DB for ${Model.modelName}`);
    } else {
      console.log(`[DB: test] Served from test DB for ${Model.modelName} (empty)`);
    }
    return results;
  }

  console.log(`[DB: test] Served from test DB for ${Model.modelName}`);
  return results;
};

// Also for count operations
const smartCount = async (Model, query = {}) => {
  let count = await Model.countDocuments(query);
  if (count === 0) {
    const MainModel = mainDbConnection.models[Model.modelName] || mainDbConnection.model(Model.modelName, Model.schema);
    count = await MainModel.countDocuments(query);
    if (count > 0) {
      console.log(`[DB: main fallback] Count served from main DB for ${Model.modelName}`);
    } else {
      console.log(`[DB: test] Count served from test DB for ${Model.modelName} (empty)`);
    }
    return count;
  }
  console.log(`[DB: test] Count served from test DB for ${Model.modelName}`);
  return count;
};

// For aggregate operations (Analytics)
const smartAggregate = async (Model, pipeline = []) => {
  let results = await Model.aggregate(pipeline);
  if (!results || results.length === 0) {
    const MainModel = mainDbConnection.models[Model.modelName] || mainDbConnection.model(Model.modelName, Model.schema);
    results = await MainModel.aggregate(pipeline);
    if (results && results.length > 0) {
      console.log(`[DB: main fallback] Aggregate served from main DB for ${Model.modelName}`);
    } else {
      console.log(`[DB: test] Aggregate served from test DB for ${Model.modelName} (empty)`);
    }
    return results;
  }
  console.log(`[DB: test] Aggregate served from test DB for ${Model.modelName}`);
  return results;
};

// For finding a single document by ID
const smartFindById = async (Model, id, populateOptions) => {
  let q = Model.findById(id);
  if (populateOptions) q = q.populate(populateOptions);
  let result = await q;
  
  if (!result) {
    const MainModel = mainDbConnection.models[Model.modelName] || mainDbConnection.model(Model.modelName, Model.schema);
    let mq = MainModel.findById(id);
    if (populateOptions) mq = mq.populate(populateOptions);
    result = await mq;
  }
  return result;
};

// For updating a single document by ID with fallback lookup
const smartFindByIdAndUpdate = async (Model, id, updateData, options = { new: true }) => {
  let doc = await Model.findById(id);
  if (doc) {
    return await Model.findByIdAndUpdate(id, updateData, options);
  }
  const MainModel = mainDbConnection.models[Model.modelName] || mainDbConnection.model(Model.modelName, Model.schema);
  doc = await MainModel.findById(id);
  if (doc) {
    return await MainModel.findByIdAndUpdate(id, updateData, options);
  }
  return null; // Not found in either
};

module.exports = { connectDB, mainDbConnection, smartQuery, smartCount, smartAggregate, smartFindById, smartFindByIdAndUpdate };
