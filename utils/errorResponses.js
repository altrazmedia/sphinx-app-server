function requiredFields(res, fields) {
  return res.status(400).send({
    required: fields,
    message: "Some of required fields were not provided or their type is not valid"
  })
}


function invalidStructure(res, fields) {
  return res.status(400).send({
    strucutre: fields,
    message: "Structure of some of the fields is not valid"
  })
}

function notFound(res, props) {
  return res.status(404).send({
    notfound: props
  })
}

function duplicate(res, fields) {
  return res.status(409).send({
    duplicate: fields,
    message: "Unique fields duplication"
  })
}


module.exports = {
  requiredFields,
  invalidStructure,
  notFound,
  duplicate
}