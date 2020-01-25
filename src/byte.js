const axios = require('axios')
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg')

class Byte {
	constructor({ byteToken }) {
		this.client = axios.create({
			baseURL: 'https://api.byte.co',
			headers: {
				'Authorization': byteToken,
				'User-Agent': 'byte/0.3.52 (co.byte@trials; v55; Android 28/9) okhttp/4.3.1'
			},
		})
	}

	async _requestUpload({ contentType }) {
		const response = await this.client.post('/upload', { contentType })

		return {
			id: response.data.data.uploadID,
			url: response.data.data.uploadURL
		}
	}

	async _upload({ contentType, filePath }) {
		const uploadData = await this._requestUpload({ contentType })
		
		const file = fs.createReadStream(filePath)

		await axios.put(uploadData.url, file, { headers: { 'Content-Type': contentType } })

		file.close()

		return uploadData
	}

	_generateThumbnail({ videoPath }) {
		return new Promise((resolve, reject) => {
			ffmpeg(videoPath).screenshot({
				count: 1,
				folder: '/tmp/byte-uploader',
				filename: 'thumbnail.jpg',
			}).on('end', () => resolve('/tmp/byte-uploader')).on('error', (err) => reject(err))
		})
	}

	async _uploadThumbnail({ videoPath }) {
		return  byte._generateThumbnail({ videoPath: video.path }).then(path => {
			const uploadData = byte.upload({
				contentType: 'image/jpeg',
				filePath: path
			})

			return { path, uploadData }
		}).then(({ path, uploadData }) => {
			fs.unlinkSync(path)

			return uploadData
		})
	}

	post({ caption, videoPath }) {
		const { id: thumbUploadID } = this._uploadThumbnail(videoPath)
		const { id: videoUploadID } = this._upload({ contentType: 'video/mp4', filePath: videoPath })

		return this.client.post('post', { caption, thumbUploadID, videoUploadID }, { headers: { 'Accept-Encoding': 'gzip', Connection: 'Keep-Alive' } }).then(response => response.data).catch(error => {
			console.log(error.response.data)
		})
	}
}

module.exports = Byte