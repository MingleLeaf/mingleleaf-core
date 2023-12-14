import IPFSServer from "./services/ipfs.js"
import WebServer from "./services/webserver.js"
import Flags from "./helpers/Flags.js"


let stopExecution = false
const opts = {
    secret: 'my-secret',
    verbose: Flags.VERBOSE.LEVEL_O
}
// Parse command arguments
for (let i=2; i<process.argv.length; i+=2) {
    if ('--' === process.argv[i].substring(0, 2)) {
        const key = process.argv[i].substring(2, process.argv[i].length)

        if ('help' === key) {
            console.log('Usage: node main.js [options]')
            console.log("\nList of all options:")
            console.log("  --secret string\t\t- Application secret key")
            console.log("  --ipfs.blockstore string\t- Location of block storage")
            console.log("  --ipfs.datastore string\t- Location of data storage")
            console.log("  --ipns.offline\t\t- Start IPNS only on local node")
            console.log("  --libp2p.addresses array\t- Array of string addresses")
            console.log("  --libp2p.multiaddrs array\t- Array of peers string addresses")
            console.log("  --http.port int\t\t- Listen port for http server")
            console.log("  --https.port int\t\t- Listen port for https server")
            console.log("  --http.route.errors string\t- Location of error controllers")
            console.log("  --http.route.routes string\t- Location of route controllers")
            console.log("  --http.route.static string\t- Location of static files")
            console.log("  --v(vv|vvv) string\t\t- Verbose mode (level 1, 2 or 3)")
            stopExecution = true
            break
        }
        else if ('vvv' === key) {
            opts.verbose = Flags.VERBOSE.LEVEL_3
        }
        else if ('vv' === key) {
            opts.verbose = Flags.VERBOSE.LEVEL_2
        }
        else if ('v' === key) {
            opts.verbose = Flags.VERBOSE.LEVEL_1
        }
        else if ('ipns.offline' === key) {
            opts[key] = true
            i--
            continue
        }
        else {
            opts[key] = process.argv[i+1]
        }
    }
}

if (!stopExecution) {
    // Create IPFS server
    const ipfsServer = await IPFSServer.create({
        verbose: opts.verbose,
        storage: {
            blockstore: opts['ipfs.blockstore'] ? opts['ipfs.blockstore'] : './storage/block',
            datastore: opts['ipfs.datastore'] ? opts['ipfs.datastore'] : './storage/data'
        },
        libp2p: {
            addresses: opts['libp2p.addresses'] ? JSON.parse(opts['libp2p.addresses']) : ['/ip4/127.0.0.1/tcp/0'],
            multiaddrs: opts['libp2p.multiaddrs'] ? JSON.parse(opts['libp2p.multiaddrs']) : undefined
        },
        offline: opts['ipns.offline'] ? true : false
    })
    
    // Create webserver
    WebServer.create({
        verbose: opts.verbose,
        secret: opts.secret,
        ports: {
            http: opts['http.port'] ? opts['http.port'] : 8080,
            https: opts['https.port'] ? opts['https.port'] : 8443
        },
        directories: {
            errors: opts['http.route.errors'] ? opts['http.route.errors'] : "./webserver/errors",
            routes: opts['http.route.routes'] ? opts['http.route.routes'] : "./webserver/routes",
            static: opts['http.route.static'] ? opts['http.route.static'] : "./webserver/static"
        },
        services: {
            ipfs: ipfsServer
        }
    })
}