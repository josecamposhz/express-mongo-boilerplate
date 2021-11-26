const es = require("./es.json");

const options = {
  messages: es,
};

const schemaValidate = (schema, body) => {
  const { error } = schema.validate(body, options);
  if (error) {
    return { error: error.details[0].message };
  }
  return {};
};

module.exports = schemaValidate;
