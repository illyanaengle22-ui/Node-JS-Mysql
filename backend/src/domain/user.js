class User {
  constructor({ id, nombre, email, passwordHash }){ 
     this.id = id;
     this.nombre = nombre;
     this.email = email;
     this.passwordHash = passwordHash; 
    }
  } 
 module.exports = User;
