import WebServerError from "../../helpers/WebServerError.js"

export default class ContentTypeMiddleware {
    static handle(req, cts) {
        if (Array.isArray(cts)) {
            let found = false
            for (const item of cts) {
                if (!found) {
                    found = checkContentType(req, item)
                } else {
                    break
                }
            }

            if(!found) {
                propagateError(cts)
            }
        } else {
            if (!checkContentType(req, cts)) {
                propagateError(cts)
            }
        }
    }
}

function checkContentType(req, ct) {
    if (req.headers['content-type'] && ct === req.headers['content-type'].split(';')[0]) {
        return true
    }
    return false
}

function propagateError(cts) {
    let ctsStr

    if (Array.isArray(cts)) {
        ctsStr = cts.join(', ')
    } else {
        ctsStr = cts
    }

    throw new WebServerError(405, "Only content-type " + ctsStr + " allowed")
}