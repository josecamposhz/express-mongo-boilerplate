const checkProductFields = (req, res, next) => {
	const { name, description, price } = req.body
	if (!name) {
		return res.status(400).json({ error: 'El campo Nombre es requerido.'})
	} else if (description === '') {
		return res.status(400).json({ error: 'El campo Descripción es requerido.' })
	} else if (price <= 0) {
		return res.status(400).json({ error: 'El campo Precio debe ser mayor a 0.' })
	}
	next();
}

module.exports = checkProductFields;