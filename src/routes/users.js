const { Router } = require("express");
const router = Router();

const { ADMIN } = require("../helpers/Role");
const UserController = require("../controllers/UserController");
const verifyAuth = require("../middlewares/verifyAuth");

router.get("/", verifyAuth([ADMIN]), UserController.getAll);
router.get("/:id", verifyAuth([ADMIN]), UserController.getById);
router.delete("/:id", verifyAuth([ADMIN]), UserController.deleteUser);
router.post("/", verifyAuth([ADMIN]), UserController.create);

module.exports = router;
