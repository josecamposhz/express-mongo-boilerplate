const { Router } = require("express");
const router = Router();

const ProductController = require("../controllers/ProductController");
const verifyAuth = require("../middlewares/verifyAuth");
// api/produts
router.get("/", verifyAuth(), ProductController.getAllProducts);
router.post("/", verifyAuth(), ProductController.createProduct);
router.get("/:id", ProductController.findOneProduct);
router.put("/:id", verifyAuth(), ProductController.updateProduct);
router.delete("/:id", ProductController.deleteProduct);

module.exports = router;
