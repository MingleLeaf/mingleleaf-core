import WebServerError from "../../../../helpers/WebServerError.js"
import AuthMiddleware from "../../../middlewares/AuthMiddleware.js"
import MethodMiddleware from "../../../middlewares/MethodMiddleware.js"
import ContentTypeMiddleware from "../../../middlewares/ContentTypeMiddleware.js"

export default class ApiIpnsKeyPage {
    static async middlewares(req, res) {
        await MethodMiddleware.handle(req, 'post')
        await ContentTypeMiddleware.handle(req, 'application/json')
        await AuthMiddleware.handle(req, res)
    }
    
    static async post(req, res) {
        try {
            const data = JSON.parse(req.body)

            if (!data.keyName) {
                throw new WebServerError(400, "keyName attribute is mandatory")
            }

            let keyInfo
            try {
                keyInfo = await req.extensions.ipfs.server.libp2p.keychain.findKeyByName(data.keyName)
            } catch (e) {
                if ('ERR_KEY_NOT_FOUND' === e.code) {
                    keyInfo = await req.extensions.ipfs.server.libp2p.keychain.createKey(data.keyName, 'RSA', 4096)
                }
            }

            const peerId = await req.extensions.ipfs.server.libp2p.keychain.exportPeerId(keyInfo.name)

            console.log('[' + req.method + ']', '/api/ipns/key', "=> 200 OK")
            res.writeHead(200, {
                "Content-Type": "application/json"
            })
            return JSON.stringify({ key: peerId.toString() })
        } catch (e) {
            if (e instanceof WebServerError) {
                throw e
            }

            console.log(e)
        }
    }
}