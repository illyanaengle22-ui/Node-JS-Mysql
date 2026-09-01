require("dotenv").config();
const express = require("express");
const cors = require("cors");

const UserRepositoryAdapter = require("./infrastructure/userRepositoryAdapter");
const UserService = require("./application/userService");
const UserController = require("./interfaces/userController");

const userRepository = new UserRepositoryAdapter();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/usuarios", userController.list);

app.post("/usuarios", userController.register);
app.post("/login", userController.login);
app.put("/usuarios/:id", userController.update);
app.delete("/usuarios/:id", userController.remove);

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor escuchando en el puerto", process.env.PORT || 3000);
});
