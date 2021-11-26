const Product = require("../models/Product");

const createProduct = (req, res) => {
  Product.create(req.body)
    .then(() => {
      res.status(201).send("Producto creado con exito");
    })
    .catch((error) => {
      res.status(400).send({ error: error });
    });
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    return res.status(400).json({ error: error });
  }
};

const findOneProduct = async (req, res) => {
  const id = req.params.id;
  try {
    const product = await Product.findOne({ _id: id });
    res.json(product);
  } catch (error) {
    return res.status(400).json({ error: error });
  }
};

const updateProduct = async (req, res) => {
  const _id = req.params.id;
  try {
    const product = await Product.findByIdAndUpdate(_id, req.body, {
      new: true,
    });
    res.json(product);
  } catch (error) {
    return res.status(400).json({ error: error });
  }
};

const deleteProduct = async (req, res) => {
  const _id = req.params.id;
  try {
    const product = await Product.findByIdAndDelete({ _id });
    if (!product) {
      return res.status(404).json({
        error: "Producto no encontrado",
      });
    }
    res.sendStatus(204);
  } catch (error) {
    return res.status(400).json({ error: error });
  }
};

module.exports = {
    createProduct,
    getAllProducts,
    findOneProduct,
    deleteProduct,
    updateProduct
};
