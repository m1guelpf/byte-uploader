const express = require('express')
const Byte = require('./src/byte')
const formidable = require('formidable')

require('dotenv').config()

const app = express()

var hbs = require('express-hbs');

app.engine('hbs', hbs.express4());
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.get('/', (req, res) => res.render('index'))

app.post('/post', async (req, res) => {
	let { fields: { caption }, files: { video } } = await new Promise((resolve, reject) => {
		(new formidable.IncomingForm).parse(req, (err, fields, files) => {
			if (err) return reject(err)
			resolve({ fields: fields, files: files })
		})
	})

	const byte = new Byte({
		byteToken: process.env.BYTE_TOKEN
	})

	const response = await byte.post({
		caption,
		videoPath: video.path,
	})

	if (response.success != 1) console.log(response.data)

	res.send('Uploaded!')
})

app.listen(3000, () => console.log(`Live at http://localhost:3000`))