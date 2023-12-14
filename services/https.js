import https from "https"
import fs from 'fs/promises'

const HttpsServer = {
    opts: {
        port: 443,
        keysDirectory: './storage/keys'
    },

    server: undefined,

    async create(opts) {
        this.opts = { ...this.opts, ...opts }

        if (this.server) {
            throw new Error("HttpsServer already exist")
        }

        this.server = https.createServer({
            key: await fs.readFile(this.keysDirectory + '/key.pem'),
            cert: await fs.readFile(this.keysDirectory + '/cert.pem'),
        })
        this.server.listen(this.opts.port, () => {
            console.log("HTTPS Server bind on :" + this.opts.port)
        })

        return this
    },

    on(eventName, fn) {
        this.server.on(eventName, fn)
    }
}

export default HttpsServer