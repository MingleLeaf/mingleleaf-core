import { CID } from 'multiformats/cid'
import WebServerError from "../../../helpers/WebServerError.js"
import AuthMiddleware from '../../middlewares/AuthMiddleware.js'
import MethodMiddleware from '../../middlewares/MethodMiddleware.js'
import ContentTypeMiddleware from '../../middlewares/ContentTypeMiddleware.js'

export default class ApiPinPage {
    static async middlewares(req, res) {
        await MethodMiddleware.handle(req, ['get', 'post', 'delete'])
    }

    static async get(req, res) {
        try {
            let results = []
            for await (const pinned of req.extensions.ipfs.server.pins.ls()) {
                results.push(pinned.cid.toString())
            }

            console.log('[' + req.method + ']', '/api/pin', "=> 200 OK")
            res.writeHead(200, {
                "Content-Type": "application/json"
            })
            return JSON.stringify(results)
        } catch (e) {
            if (e instanceof WebServerError) {
                throw e
            }

            console.log(e)
        }
    }

    static async post(req, res) {
        try {
            await ContentTypeMiddleware.handle(req, 'application/json')
            await AuthMiddleware.handle(req, res)
            
            const data = JSON.parse(req.body)
            
            if (!Array.isArray(data)) {
                throw new WebServerError(400, "Only array of CID allowed")
            }
            
            let results = []
            for (const strCid of data) {
                const cid = CID.parse(strCid)
                const pinned = await req.extensions.ipfs.server.pins.add(cid)

                results.push(pinned.cid.toString())
            }

            console.log('[' + req.method + ']', '/api/pin', "=> 200 OK")
            res.writeHead(200, {
                "Content-Type": "application/json"
            })
            return JSON.stringify(results)
        } catch (e) {
            if (e instanceof WebServerError) {
                throw e
            }

            console.log(e)
        }
    }

    static async delete(req, res) {
        try {
            await ContentTypeMiddleware.handle(req, 'application/json')
            await AuthMiddleware.handle(req, res)
            
            const data = JSON.parse(req.body)
            
            if (!Array.isArray(data)) {
                throw new WebServerError(400, "Only array of CID allowed")
            }
            
            let results = []
            for (const strCid of data) {
                const cid = CID.parse(strCid)
                const pinned = await req.extensions.ipfs.server.pins.rm(cid)

                results.push(pinned.cid.toString())
            }

            console.log('[' + req.method + ']', '/api/pin', "=> 200 OK")
            res.writeHead(200, {
                "Content-Type": "application/json"
            })
            return JSON.stringify(results)
        } catch (e) {
            if (e instanceof WebServerError) {
                throw e
            }

            console.log(e)
        }
    }
}