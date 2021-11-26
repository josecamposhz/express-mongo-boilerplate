const jwt = require('jsonwebtoken');
const joi = require('joi');
const schemaValidate = require('../helpers/joi');

const User = require('../models/User');
const Role = require('../helpers/role');
const { fullURL, randomTokenString } = require('../helpers/utils');
const { sendPasswordResetEmail } = require('../helpers/mail/templates');

// joi object
const emailObject = joi
	.string()
	.min(6)
	.max(255)
	.required()
	.email()
	.label('Correo electrónico');
const passwordObject = joi.string().min(6).max(1024).required();

const schemaRegister = joi.object({
	firstName: joi.string().min(2).max(255).required().label('Nombres'),
	lastName: joi.string().min(2).max(255).required().label('Apellidos'),
	email: emailObject,
	password: passwordObject.label('Contraseña'),
});
async function register(req, res) {
	try {
		const { error } = schemaValidate(schemaRegister, req.body);

		if (error) {
			return res.status(400).json({ error });
		}

		const { firstName, lastName, email, password } = req.body;
		// Validamos que el email no se encuentra en nuestra base de datos
		const validEmail = await User.findOne({ email });
		if (validEmail) {
			return res.status(400).json({ error: 'Email ya registrado' });
		}

		const newUser = new User({
			firstName,
			lastName,
			avatar: fullURL(req) + '/public/avatar/default.png',
			email,
		});
		newUser.password = await newUser.encryptPassword(password);

		// El primer usuario que se registre tendra el rol de Admin
		const isFirstuser = (await User.countDocuments({})) === 0;
		newUser.role = isFirstuser ? Role.ADMIN : Role.USER;

		await newUser.save();

		res.status(201).send('Registro exitoso');
	} catch (error) {
		res.json({ error }).status(400);
	}
}

const schemaLogin = joi.object({
	email: emailObject,
	password: passwordObject.label('Contraseña'),
});

async function login(req, res) {
	// Validamos los datos
	const { error } = schemaValidate(schemaLogin, req.body);
	if (error) return res.status(400).json({ error });

	const { email, password } = req.body;

	// Buscamos el usuario en la base de datos
	const user = await User.findOne({ email });
	if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
	if (!user.isVerified) {
		return res
			.status(400)
			.json({ error: 'Revisa tu correo electrónico para verificar tu cuenta' });
	}

	const validPassword = await user.matchPassword(password);
	if (!validPassword) {
		return res.status(400).json({ error: 'Contraseña incorrecta' });
	}

	// Se crea el token
	const token = jwt.sign(
		{
			id: user._id,
			email: user.email,
			role: user.role,
		},
		process.env.TOKEN_SECRET,
		{ expiresIn: 60 * 60 * 24 * 30 }
	); // Expira en 30 días

	res.json({ user, token });
}

const schemaBasicData = joi.object({
	firstName: joi.string().min(2).max(255).required().label('Nombres'),
	lastName: joi.string().min(2).max(255).required().label('Apellidos'),
	email: emailObject,
});
async function updateProfile(req, res) {
	// Validamos que los datos cumplen con la estructura
	const { firstName, lastName, email } = req.body;
	const { error } = schemaValidate(schemaBasicData, {
		firstName,
		lastName,
		email,
	});
	if (error) return res.status(400).json({ error });

	// Obtenemos el usuario y comprobamos que sea el que esta realizando la petición
	const currentUser = await User.findById(req.params.id);
	if (`${currentUser._id}` !== req.user.id) {
		return res.status(400).json({ error: 'Unauthorized' });
	}

	// Validamos que el email no se encuentra en nuestra base de datos
	if (currentUser.email !== email && (await User.findOne({ email }))) {
		return res.status(400).json({
			error: 'El email ingresado ya se encuentra en nuestros registros',
		});
	}

	// Copiamos los parámetros al usuario y guardamos
	Object.assign(currentUser, {
		firstName,
		lastName,
		email,
		updated: Date.now(),
	});
	await currentUser.save();

	return res.json({ user: currentUser });
}

const schemaUpdatePassword = joi.object({
	oldPassword: passwordObject.label('Contraseña actual'),
	newPassword: passwordObject.label('Nueva contraseña'),
	repeatPassword: passwordObject.label('Repetir contraseña'),
});
async function updatePassword(req, res) {
	// Validamos que los datos cumplen con la estructura
	const { oldPassword, newPassword, repeatPassword } = req.body;
	const { error } = schemaValidate(schemaUpdatePassword, req.body);
	if (error) return res.status(400).json({ error });

	// Obtenemos el usuario y comprobamos que sea el que esta realizando la petición
	const currentUser = await User.findById(req.params.id);

	if (`${currentUser._id}` !== req.user.id) {
		return res.status(401).json({ error: 'Unauthorized' });
	}
	const validPassword = await currentUser.matchPassword(oldPassword);
	if (!validPassword) {
		return res.status(400).json({ error: 'Contraseña incorrecta' });
	}
	if (newPassword !== repeatPassword) {
		return res.status(400).json({ error: 'Las contraseñas no son identicas' });
	}

	// Encriptamos la contraseña y guardamos el usuario
	currentUser.password = await currentUser.encryptPassword(newPassword);
	currentUser.updated = Date.now();
	await currentUser.save();

	res.json({ user: currentUser });
}

async function updateAvatar(req, res) {
	try {
		if (!req.files) {
			res.status(400).send({ error: 'No se han cargado archivos' });
		} else {
			// Obtenemos el usuario y comprobamos que sea el que esta realizando la petición
			const currentUser = await User.findById(req.params.id);
			if (`${currentUser._id}` !== req.user.id) {
				return res.status(401).json({ error: 'Unauthorized' });
			}

			// Guardamos el archivo en la variable avatar
			const avatar = req.files.avatar;

			// obtenemos el nombre del archivo
			const { name } = avatar;
			const nameSplit = name.split('.');

			// obtenemos la extensión del archivo y generamos su nombre con el id del usuario
			const extension = nameSplit[nameSplit.length - 1];
			const avatarName = currentUser._id + '.' + extension;

			// Usamos el metodo mv() para mover el archivo al directorio pubic/avatar
			avatar.mv('public/avatar/' + avatarName);

			// Actualizamos el usuario y guardarmos
			currentUser.avatar = `${fullURL(req)}/public/avatar/${avatarName}`;
			currentUser.updated = Date.now();
			await currentUser.save();

			// Agregamos un query parameter para que la imagen se actualice en el frontend
			currentUser.avatar = `${currentUser.avatar}?${currentUser.updated}`;

			res.json({ user: currentUser });
		}
	} catch (error) {
		res.status(400).json({ error });
	}
}
const tokenSchema = joi.object({
	token: joi.string().required().label('token'),
	password: passwordObject.label('Contraseña'),
	confirmPassword: passwordObject.label('Repetir Contraseña'),
});
async function verifyEmail(req, res) {
	const { token, password, confirmPassword } = req.body;
	const { error } = schemaValidate(tokenSchema, {
		token,
		password,
		confirmPassword,
	});
	if (error) return res.status(400).json({ error });

	const currentUser = await User.findOne({ verificationToken: token });
	if (!currentUser) return res.status(400).json({ error: 'Token inválido' });
	if (password !== confirmPassword)
		return res.status(400).json({ error: 'Las contraseñas no son identicas' });

	// Encriptamos la contraseña
	const userPassword = await currentUser.encryptPassword(password);

	Object.assign(currentUser, {
		isVerified: true,
		password: userPassword,
		verificationToken: undefined,
	});
	await currentUser.save();

	res.json({ message: 'Verificación éxitosa, ahora puedes Iniciar Sesión' });
}

const forgotPasswordSchema = joi.object({ email: emailObject });
async function forgotPassword(req, res) {
	try {
		const { error } = schemaValidate(forgotPasswordSchema, req.body);
		if (error) return res.status(400).json({ error });
		
		// Buscamos el usuario en la base de datos
		const user = await User.findOne({ email: req.body.email });
		if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
		
		// Creamos un token para resetear la contraseña que expira en 24 horas
		user.resetToken = {
			token: randomTokenString(),
			expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
		};
		await user.save();

		// Enviar correo con la información
		await sendPasswordResetEmail(user, req.get('origin'));

		res.json({
			message:
				'Por favor, revisa tu correo electrónico para ver las instrucciones a seguir para restablecer la contraseña',
		});
	} catch (error) {
		res.status(400).json({ error });
	}
}

async function resetPassword(req, res) {
	try {
		const { token, password, confirmPassword } = req.body;
		const { error } = schemaValidate(tokenSchema, {
			token,
			password,
			confirmPassword,
		});
		if (error) return res.status(400).json({ error });

		if (password !== confirmPassword) {
			return res
				.status(400)
				.json({ error: 'Las contraseñas no son identicas' });
		}

		// Buscamos el usuario en la base de datos
		// $gt - greater than - mayor que
		const currentUser = await User.findOne({
			'resetToken.token': token, // Buscamos el token
			'resetToken.expires': { $gt: Date.now() }, // Comprobamos que la fecha de expiración del token es mayor que la fecha actual
		});
		if (!currentUser) return res.status(400).json({ error: 'Token inválido' });

		// Encriptamos la contraseña
		currentUser.password = await currentUser.encryptPassword(password);

		// Actualizamos los parámetros y guardamos
		currentUser.updated = Date.now();
		currentUser.resetToken = undefined; // Al dejar el parámetro resetToken como indenifido este es removido del documento
		await currentUser.save();

		res.json({ message: 'Contraseña restablecida con éxito' });
	} catch (error) {
		res.status(400).json({ error });
	}
}

module.exports = {
	register,
	login,
	updateProfile,
	updatePassword,
	updateAvatar,
	verifyEmail,
	forgotPassword,
	resetPassword,
};
