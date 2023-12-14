import { CID } from 'multiformats/cid'
import { fileTypeFromBuffer } from 'file-type'
import WebServerError from "../../../helpers/WebServerError.js"
import MethodMiddleware from '../../middlewares/MethodMiddleware.js'

export default class IpfsGetFilePage {
    static async middlewares(req, res) {
        await MethodMiddleware.handle(req, 'get')
    }

    static async get(req, res) {
        try {
            const fs = req.extensions.ipfs.fs()
        
            // Retrieve simple file
            if (req.props.path.split("/").length === 1) {
                const cid = CID.parse(req.props.path)
                const stats = await fs.stat(cid)
        
                if ('directory' === stats.type) {
                    return await searchFileInFolder(fs, stats.cid.toString() + '/index.html', req, res)
                } else {
                    return await readIpfsFile(fs, stats.cid, req, res)
                }
            }
            // Retrieve file in folder
            else {
                return await searchFileInFolder(fs, req.props.path, req, res)
            }
        } catch (e) {
            throw new WebServerError(404, "Not found")
        }
    }
}

async function searchFileInFolder(fs, fullPath, req, res) {
    let path = fullPath.split("/")
    const startPath = path.shift()
    const cid = CID.parse(startPath)

    path = path.join('/')

    for await (const entry of fs.ls(cid)) {
        if (entry.name === path) {
            return await readIpfsFile(fs, entry.cid, req, res)
        }
    }

    throw new WebServerError(404, "Not found")
}

async function readIpfsFile(fs, cid, req, res) {
    let chunks = []
    
    for await (const chunk of fs.cat(cid)) {
        chunks.push(chunk)
    }

    const content = Buffer.concat(chunks)
    const fileType = await fileTypeFromBuffer(content)

    console.log('[' + req.method + ']', "/ipfs/" + req.props.path, "=> 200 OK")

    if (fileType) {
        res.writeHead(200, {
            "Content-Type": fileType.mime
        })
        return content
    }

    return content.toString()
}