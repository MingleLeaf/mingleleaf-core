import MethodMiddleware from '../middlewares/MethodMiddleware.js'

export default class IndexPage {
    static async middlewares(req, res) {
        await MethodMiddleware.handle(req, 'get')
    }

    static async get(req, res) {
        console.log('/', "=> 200 OK")
        res.writeHead(200, {
            "Content-Type": "text/plain"
        })
        return "Hello World!"
    }
}