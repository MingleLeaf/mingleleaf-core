import unzipper from "unzipper"
import multipart from "parse-multipart-data"
import WebServerError from "../../../helpers/WebServerError.js"
import AuthMiddleware from "../../middlewares/AuthMiddleware.js"
import MethodMiddleware from "../../middlewares/MethodMiddleware.js"
import ContentTypeMiddleware from "../../middlewares/ContentTypeMiddleware.js"

export default class ApiRecordPage {
    static async middlewares(req, res) {
        await MethodMiddleware.handle(req, 'post')
        await ContentTypeMiddleware.handle(req, 'multipart/form-data')
        await AuthMiddleware.handle(req, res)
    }

    static async post(req, res) {
        try {
            const boundary = req.headers['content-type'].split("; ")[1].replace("boundary=","")
            const form = multipart.parse(req.body, boundary)
            let results = []

            for (const input of form) {
                // File and folder
                if (input.filename) {
                    const fs = req.extensions.ipfs.fs()

                    if ('application/octet-stream' === input.type && input.filename.match(/.zip$/g)) {
                        results.push(await saveZipFile(fs, input))
                    }
                    else {
                        results.push(await saveSimpleFile(fs, input))
                    }
                }
            }

            console.log('[' + req.method + ']', '/api/record', "=> 200 OK")
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

async function saveZipFile(fs, input) {
    const directory = await unzipper.Open.buffer(input.data)
    const folderId = input.filename.substring(0, input.filename.length - '.zip'.length)
    let lastCid

    for await (
        const entry
        of fs.addAll(directory.files.map((file) => {
            return {
                path: folderId + '/' + file.path,
                content: file.stream()
            }
        }))
    ) {
        lastCid = entry.cid
    }

    return {
        name: folderId,
        cid: lastCid.toString()
    }
}

async function saveSimpleFile(fs, input) {
    const cid = await fs.addFile({
        path: input.filename,
        content: input.data
    })

    return {
        name: input.filename,
        cid: cid.toString()
    }
}