const { Router } = require("express");
const authRouter = Router();

const AuthController = require("../controllers/AuthController");
const verifyAuth = require("../middlewares/verifyAuth");

// api/auth/register
authRouter.post("/register", AuthController.register);
authRouter.post("/login", AuthController.login);
authRouter.put("/profile/:id", verifyAuth(), AuthController.updateProfile);
authRouter.put('/password/:id', verifyAuth(), AuthController.updatePassword);
authRouter.post('/avatar/:id', verifyAuth(), AuthController.updateAvatar);
authRouter.post('/verify-email', AuthController.verifyEmail);
authRouter.post('/forgot-password', AuthController.forgotPassword);
authRouter.post('/reset-password', AuthController.resetPassword);

module.exports = authRouter;
