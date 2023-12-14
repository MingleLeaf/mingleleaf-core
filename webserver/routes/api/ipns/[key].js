import WebServerError from "../../../../helpers/WebServerError.js"
import MethodMiddleware from "../../../middlewares/MethodMiddleware.js"

export default class ApiGetIpnsPage {
    static async middlewares(req, res) {
        await MethodMiddleware.handle(req, 'get')
    }

    static async get(req, res){
        try {
            const keyInfo = await req.extensions.ipfs.server.libp2p.keychain.findKeyById(req.props.key)
            const peerId = await req.extensions.ipfs.server.libp2p.keychain.exportPeerId(keyInfo.name)
            const cid = await req.extensions.ipfs.ipns.resolve(peerId)
            const result = await req.extensions.ipfs.resolveIpfs(cid)

            console.log('[' + req.method + ']', '/api/ipns/' + req.props.key, "=> 200 OK")
            res.writeHead(200, {
                "Content-Type": "application/json"
            })
            return JSON.stringify(result)
        } catch (e) {
            throw new WebServerError(404, "Not found")
        }
    }
}