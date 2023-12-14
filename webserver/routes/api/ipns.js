import { CID } from 'multiformats/cid'
import WebServerError from "../../../helpers/WebServerError.js"
import AuthMiddleware from '../../middlewares/AuthMiddleware.js'
import MethodMiddleware from '../../middlewares/MethodMiddleware.js'
import ContentTypeMiddleware from '../../middlewares/ContentTypeMiddleware.js'

export default class ApiIpnsPage {
    static async middlewares(req, res) {
        await MethodMiddleware.handle(req, ['post', 'delete'])
        await ContentTypeMiddleware.handle(req, 'application/json')
        await AuthMiddleware.handle(req, res)
    }

    static async post(req, res) {
        try {
            console.log('PeerId:', req.extensions.ipfs.server.libp2p.peerId)
            console.log('Peers:', req.extensions.ipfs.server.libp2p.getPeers())

            const data = JSON.parse(req.body)
            const cid = CID.parse(data.cid)
            const keyInfo = await req.extensions.ipfs.server.libp2p.keychain.findKeyById(data.peerId)
            const peerId = await req.extensions.ipfs.server.libp2p.keychain.exportPeerId(keyInfo.name)
            const published = await req.extensions.ipfs.ipns.publish(peerId, cid, {
                offline: req.extensions.ipfs.opts.offline
            })

            console.log('[' + req.method + ']', '/api/ipns', "=> 200 OK")
            res.writeHead(200, {
                "Content-Type": "application/json"
            })
            return JSON.stringify({
                value: published.value
            })
        } catch (e) {
            if (e instanceof WebServerError) {
                throw e
            }

            console.log(e)
        }
    }

    static async delete(req, res) {
        const data = JSON.parse(req.body)

        if (!Array.isArray(data)) {
            throw new WebServerError(400, "Only array of CID allowed")
        }

        let results = []
        for (const strCid of data) {
            const cid = CID.parse(strCid)
            const pinned = await req.extensions.ipfs.pins.rm(cid)

            results.push(pinned.cid.toString())
        }

        console.log('[' + req.method + ']', '/api/ipns', "=> 200 OK")
        res.writeHead(200, {
            "Content-Type": "application/json"
        })
        return JSON.stringify(results)
    }
}