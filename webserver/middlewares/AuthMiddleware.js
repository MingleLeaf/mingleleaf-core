import JsonWebToken from "../../helpers/JsonWebToken.js"
import WebServerError from "../../helpers/WebServerError.js"

export default class AuthMiddleware {
    static handle(req, res) {
        try {
            const content = JsonWebToken.check(req.headers.authorization.substring('Bearer '.length, req.headers.authorization.length), req.webserver.opts.secret)

            if (!content) {
                throw new WebServerError(401, "Unauthorized")
            }

            req.token = content
        } catch (e) {
            throw new WebServerError(401, "Unauthorized")
        }
    }
}