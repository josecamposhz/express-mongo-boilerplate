const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const fileUpload = require('express-fileupload');
const path = require('path');
require("dotenv").config();

const dbConnection = require("./database/config");

const app = express();

// middlewares
app.use(morgan("tiny"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload()); // enable files upload

// Connection to mongoDB
dbConnection();

app.get("/", (req, res) => {
  res.send("Ruta Raiz");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/products", require("./routes/products"));

app.use("/public", express.static(path.join(__dirname, '..', '/public')));

app.set("port", process.env.PORT || 3005);
app.listen(app.get("port"), function () {
  console.log(`App running at port: http://localhost:${app.get("port")}`);
});
