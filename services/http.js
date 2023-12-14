import http from "http"

const HttpServer = {
    opts: {
        port: 80
    },

    server: undefined,

    create(opts) {
        this.opts = { ...this.opts, ...opts }

        if (this.server) {
            throw new Error("HttpServer already exist")
        }

        this.server = http.createServer()
        this.server.listen(this.opts.port, () => {
            console.log("HTTP Server bind on :" + this.opts.port)
        })

        return this
    },

    on(eventName, fn) {
        this.server.on(eventName, fn)
    }
}

export default HttpServer