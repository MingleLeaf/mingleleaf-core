import WebServerError from "../../../helpers/WebServerError.js"
import JsonWebToken from "../../../helpers/JsonWebToken.js"
import MethodMiddleware from "../../middlewares/MethodMiddleware.js"
import AuthMiddleware from "../../middlewares/AuthMiddleware.js"
import ContentTypeMiddleware from "../../middlewares/ContentTypeMiddleware.js"

export default class ApiTokenPage {
    static async middlewares(req, res) {
        await MethodMiddleware.handle(req, ['get', 'post'])
    }

    static async get(req, res) {
        try {
            await AuthMiddleware.handle(req, res)

            const result = JsonWebToken.check(req.headers.authorization.substring('Bearer '.length, req.headers.authorization.length), req.webserver.opts.secret)

            console.log('[' + req.method + ']', '/api/token', "=> 200 OK")
            res.writeHead(200, {
                "Content-Type": "application/json"
            })
            return JSON.stringify(result)
        } catch (e) {
            if (e instanceof WebServerError) {
                throw e
            }

            throw new WebServerError(404, "Not found")
        }
    }

    static async post(req, res) {
        try {
            await ContentTypeMiddleware.handle(req, 'application/json')

            const data = JSON.parse(req.body)

            // To do - Check credential (clientId and clientSecret)

            const token = JsonWebToken.create({
                id: data.clientId,
                authorized: true,
                role: 'admin'
            }, req.webserver.opts.secret)

            console.log('[' + req.method + ']', '/api/token', "=> 200 OK")
            res.writeHead(200, {
                "Content-Type": "application/json"
            })
            return JSON.stringify({ token })
        } catch (e) {
            if (e instanceof WebServerError) {
                throw e
            }

            console.log(e)
        }
    }
}