//  Parse and validate pagination parameters from query string

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

// Build Sequelize-compatible pagination options

const buildPaginationOptions = (query) => {
  const { page, limit, offset } = parsePagination(query);
  return { limit, offset, page };
};

// Build sorting options from query params
 
const buildSortOptions = (query, allowedFields = [], defaultField = 'createdAt', defaultOrder = 'DESC') => {
  const sortField = allowedFields.includes(query.sortBy) ? query.sortBy : defaultField;
  const sortOrder = ['ASC', 'DESC'].includes(query.sortOrder?.toUpperCase())
    ? query.sortOrder.toUpperCase()
    : defaultOrder;
  return [[sortField, sortOrder]];
};

module.exports = { parsePagination, buildPaginationOptions, buildSortOptions };
