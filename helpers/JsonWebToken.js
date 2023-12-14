import Jwt from "jsonwebtoken"

export default class JsonWebToken {
    static create(payload, secret) {
        return Jwt.sign(payload, secret)
    }

    static check(token, secret) {
        return Jwt.verify(token, secret)
    }
}