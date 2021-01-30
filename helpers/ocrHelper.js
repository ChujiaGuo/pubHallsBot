const vision = require('@google-cloud/vision')
const ocrClient = new vision.ImageAnnotatorClient()
const { createWorker } = require('tesseract.js')
const worker = createWorker()

module.exports = {
    googleOcr: async function parseImage(imageURL) {
        return await ocrClient.textDetection(imageURL);
    },

    tessOcr: async function tessParseImage(imageURL) {
        await worker.load();
        await worker.loadLanguage('eng');
        await worker.initialize('eng');
        const { data: { text } } = await worker.recognize(image);
        await worker.terminate();
        return text;
    }
}