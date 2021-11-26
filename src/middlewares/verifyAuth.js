const jwt = require("jsonwebtoken");

// Middleware para validar el token (rutas protegidas)
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;
  // Se verifica si el request posee el header authorization
  if (!token) return res.status(403).json({ error: "No token provided." });
  try {
    console.log(token);
    const verified = jwt.verify(token, process.env.TOKEN_SECRET);
    // autorización exitosa
    // guardamos el usuario en req para poder acceder a él en futuras funciones
    req.user = verified;
    // Continuamos
    next();
  } catch (error) {
    console.log(error);
    res.status(400).json({ error: "Invalid token" });
  }
};

// Función para validar el rol del usuario
function verifyRole(roles = []) {
  return async (req, res, next) => {
    const { user } = req;
    if (!user || (roles.length && !roles.includes(user.role))) {
      // El usuario no existe o no tiene el rol necesario
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };
}

function verifyAuth(roles = []) {
  return [verifyToken, verifyRole(roles)];
}

module.exports = verifyAuth;
