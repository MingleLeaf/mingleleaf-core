import HttpServer from "./http.js"
import HttpsServer from "./https.js"
import fs from 'fs/promises'
import path from "path"
import WebServerError from "../helpers/WebServerError.js"
import Flags from "../helpers/Flags.js"

const WebServer = {
    opts: {
        verbose: Flags.VERBOSE.LEVEL_O,
        ports: {
            http: 8000,
            https: 8443
        },
        directories: {
            errors: "./errors",
            routes: "./routes",
            static: "./static"
        }
    },

    servers: {
        http: undefined,
        https: undefined
    },

    create(opts) {
        this.opts = { ...this.opts, ...opts }

        this.routesPath = path.resolve() + "/" + this.opts.directories.routes

        this.createHttpServer({
            port: this.opts.ports.http
        })

        /** To do
        this.createHttpsServer({
            port: this.opts.ports.https
        })
        */
    },

    createHttpServer(opts) {
        this.servers.http = HttpServer.create(opts)
        this.servers.http.on('request', async (req, res) => {
            await this.request(req, res)
        })
        this.servers.http.on('clientError', (err, socket) => {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
        })
    },

    createHttpsServer(opts) {
        this.servers.https = HttpsServer.create(opts)
        this.servers.https.on('request', async (req, res) => {
            await this.request(req, res)
        })
        this.servers.https.on('clientError', (err, socket) => {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n')
        })
    },

    async request(req, res) {
        req.webserver = this

        if (this.opts.services) {
            req.extensions = this.opts.services
        }

        const queries = req.url.split("?").length > 1 ? req.url.split("?")[1] : undefined
        if (queries) {
            const query = {}

            queries.split("&").forEach((item) => {
                item = item.split("=")
                query[item[0]] = decodeURI(item[1])
            })

            req.query = query
        }

        if ([
            'post', 'POST',
            'delete', 'DELETE',
            'put', 'PUT',
            'patch', 'PATCH'
        ].includes(req.method)) {
            function embedDataRecover() {
                return new Promise((resolve, reject) => {
                    let body = []
                    req
                        .on('data', (chunk) => {
                            body.push(chunk)
                        })
                        .on('end', () => {
                            resolve(Buffer.concat(body))
                        })
                        .on('error', (err) => {
                            reject(err)
                        })
                })
            }

            req.body = await embedDataRecover()
        }

        const baseUrl = req.url.split("?")[0]
        // Static file execution
        if (baseUrl.split(".").length > 1) {
            this.staticFile(baseUrl, req, res)
        }
        // JS controller execution
        else {
            await this.execController(
                (baseUrl === "/" ? "/index" : baseUrl),
                req,
                res,
                true
            )
        }
    },

    async execController(controllerPath, req, res, firstCall) {
        try {
            const fullControllerPath = this.routesPath + controllerPath + (firstCall ? '.js' : '')
            // Check if controller file exist
            await fs.access(fullControllerPath, fs.constants.R_OK)

            // Load class controller
            const routeController = (await import(fullControllerPath)).default

            // Execute generic middlewares
            if (routeController.middlewares) {
                await routeController.middlewares(req, res)
            }

            // Execute route controller
            res.end((await routeController[req.method.toLowerCase()](req, res)) + "\n")
        } catch (e) {
            // console.error(e)

            // Propagate webserver error
            if (e instanceof WebServerError) {
                await req.webserver.error(e, req, res)
            }

            // Test dynamic routing
            else {
                if (controllerPath.split("/") <= 1) {
                    await this.error(new WebServerError(404, "Not found"), req, res)
                } else {
                    const dirUrl = controllerPath.split("/")
                    const propValue = dirUrl.pop()
                    const dirPath = dirUrl.join("/")
                    let files

                    req.tmpProp = req.tmpProp ? propValue + "/" + req.tmpProp : propValue
                    
                    try {
                        files = await fs.readdir(this.routesPath + dirPath)
                    } catch (e) {
                        await this.execController(
                            dirPath,
                            req,
                            res,
                            false
                        )
                        return
                    }
    
                    for (const file of files) {
                        const found = file.match(/^\[([A-Za-z0-9-_]+)\]/g)
    
                        if (found && found.length > 0) {
                            req.props = {}
                            req.props[found[0].substring(1, found[0].length-1)] = req.tmpProp
                            req.tmpProp = undefined
    
                            await this.execController(
                                dirPath + "/" + file,
                                req,
                                res,
                                false
                            )
                            return
                        }
                    }

                    await this.error(new WebServerError(404, "Not found"), req, res)
                }
            }
        }
    },

    async staticFile(url, req, res) {
        const filepath = path.resolve() + "/" + this.opts.directories.static + url
        
        try {
            await fs.access(filepath, fs.constants.R_OK)

            const file = await fs.readFile(filepath, "utf-8")
            res.end(file)
            console.log(url, "=> 200 OK")
        } catch (e) {
            await this.execController(
                (url === "/" ? "/index" : url),
                req,
                res,
                true
            )
        }
    },

    async error(err, req, res) {
        try {
            const errorpath = path.resolve() + "/" + this.opts.directories.errors + "/" + err.code + ".js"

            await fs.access(errorpath, fs.constants.R_OK)
            await (await import(errorpath)).default(err, req, res)
        } catch (e) {
            await (await import(path.resolve() + "/" + this.opts.directories.errors + "/all.js")).default(err, req, res)
        }
    }
}

export default WebServer