import WebServerError from "../../helpers/WebServerError.js"

export default class MethodMiddleware {
    static handle(req, methods) {
        if (Array.isArray(methods)) {
            let found = false
            for (const method of methods) {
                if (!found) {
                    found = checkMethod(req, method)
                } else {
                    break
                }
            }

            if(!found) {
                propagateError(methods)
            }
        } else {
            if (!checkMethod(req, methods)) {
                propagateError(methods)
            }
        }
    }
}

function checkMethod(req, method) {
    if (method === req.method || method.toUpperCase() === req.method) {
        return true
    }
    return false
}

function propagateError(methods) {
    let methodsStr

    if (Array.isArray(methods)) {
        methodsStr = methods.join(', ').toUpperCase()
    } else {
        methodsStr = methods.toUpperCase()
    }

    throw new WebServerError(405, "Only method " + methodsStr + " allowed")
}