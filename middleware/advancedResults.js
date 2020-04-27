const advancedResults = (model, populate) => async (req, res, next) => {
  let query;

  // copy the req.query
  // req.queri are what come after "?" in the URL
  const reqQuery = { ...req.query };

  //Fields to exclude
  const removeFields = ["select", "sort", "page", "limit"];

  // loop over removeFields and delete them from reqQuery
  removeFields.forEach((field) => delete reqQuery[field]);
  // so now we can use 'select' as we want

  let queryStr = JSON.stringify(reqQuery);

  // Create operator like gt gte ...
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Finding Resource
  query = model.find(JSON.parse(queryStr));

  // Select Fields
  if (req.query.select) {
    const field = req.query.select.split(",").join(" ");
    query = query.select(field);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination
  //Create a page by default the page is 1
  const page = parseInt(req.query.page, 10) || 1;
  // Create a limit of bootcamps show in a page and by default 100 bootcamps are showed in a page
  const limit = parseInt(req.query.limit, 10) || 25;
  // example: if are have ?page=2&limit=2
  // skip in going to startIndex the first to bootcamps and show in the page=2 the bootcamps starting at 3
  const startIndex = (page - 1) * limit;
  // End Index give us the last bootcamps
  const endIndex = page * limit;
  // Total will be the total number od bootcamps
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) query = query.populate(populate);

  // execute query
  const results = await query;

  // Pagination result
  const pagination = {};
  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  // we will use this in the routes files
  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };
  next();
};

module.exports = advancedResults;
