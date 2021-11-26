const { Schema, model } = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	avatar: { type: String, required: true },
	email: { type: String, unique: true, required: true },
	role: { type: String, required: true },
	password: { type: String, minlength: 6 },
	isVerified: { type: Boolean, default: true },
	verificationToken: String,
	resetToken: {
		token: String,
		expires: Date,
	},
	created: { type: Date, default: Date.now },
	updated: Date,
});

// Método para encriptar la contraseña
userSchema.methods.encryptPassword = async (password) => {
	const salt = await bcrypt.genSalt(10);
	const hash = bcrypt.hash(password, salt);
	return hash;
};

// Método para comparar la contraseña ingresada por el usuario
userSchema.methods.matchPassword = async function (password) {
	return await bcrypt.compare(password, this.password);
};

// Eliminanos la contraseña cuando obtenemos los datos de un usuario
userSchema.methods.toJSON = function () {
	var user = this.toObject();
	delete user.password;
	return user;
};

module.exports = model('User', userSchema);
