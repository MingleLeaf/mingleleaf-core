import { CID } from 'multiformats/cid'
import WebServerError from "../../../../helpers/WebServerError.js"
import MethodMiddleware from '../../../middlewares/MethodMiddleware.js'

export default class ApiGetRecordPage {
    static async middlewares(req, res) {
        await MethodMiddleware.handle(req, 'get')
    }

    static async get(req, res) {
        try {
            const cid = CID.parse(req.props.key)
            const result = await req.extensions.ipfs.resolveIpfs(cid)
        
            console.log('[' + req.method + ']', '/api/record/' + req.props.key, "=> 200 OK")
            res.writeHead(200, {
                "Content-Type": "application/json"
            })
            return JSON.stringify(result)
        } catch (e) {
            throw new WebServerError(404, "Not found")
        }
    }
}