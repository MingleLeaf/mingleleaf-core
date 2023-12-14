import path from 'path'
import { FsBlockstore } from 'blockstore-fs'
import { FsDatastore } from 'datastore-fs'
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { mdns } from '@libp2p/mdns'
import { kadDHT } from '@libp2p/kad-dht'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { bootstrap } from '@libp2p/bootstrap'
import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import { ipns } from '@helia/ipns'
import { dht, pubsub } from '@helia/ipns/routing'
import Flags from '../helpers/Flags.js'

const IPFS = {
    opts: {
        verbose: Flags.VERBOSE.LEVEL_O,
        storage: {
            blockstore: './storage/block',
            datastore: './storage/data'
        },
        libp2p: {
            addresses: ['/ip4/127.0.0.1/tcp/0'],
            multiaddrs: undefined
        },
        offline: false
    },

    // Servers
    server: undefined,
    ipns: undefined,

    fs() {
        return unixfs(this.server)
    },

    async create(opts) {
        this.opts = { ...this.opts, ...opts }

        // Initialize storages
        const blockstore = new FsBlockstore(path.resolve() + '/' + this.opts.storage.blockstore)
        const datastore = new FsDatastore(path.resolve() + '/' + this.opts.storage.datastore)

        let peerDiscovery = [mdns()]
        if (this.opts.libp2p.multiaddrs) {
            peerDiscovery = [
                mdns(),
                bootstrap({
                    list: this.opts.libp2p.multiaddrs
                })
            ]
        }

        // Initialize libp2p
        const libp2p = await createLibp2p({
            datastore,
            addresses: {
                listen: this.opts.libp2p.addresses
            },
            transports: [tcp()],
            peerDiscovery: peerDiscovery,
            connectionEncryption: [noise()],
            streamMuxers: [
                yamux(),
                mplex()
            ],
            services: {
                dht: kadDHT(),
                pubsub: gossipsub()
            },
            config: {
                dht: {
                    enabled: true
                }
            },
            start: true
        })

        // Initialize IPFS server
        this.server = await createHelia({
            blockstore,
            datastore,
            libp2p
        })

        // Initialize IPNS server
        this.ipns = ipns(this.server, [
            dht(this.server),
            pubsub(this.server)
        ])

        // To do - Initialize OrbitDB

        // Listen log events
        console.log('Peer ID:', this.server.libp2p.peerId)
        this.server.libp2p.getMultiaddrs().forEach((addr) => {
            console.log('Peer address:', addr.toString())
        })

        if (this.opts.verbose >= Flags.VERBOSE.LEVEL_2) {
            this.server.libp2p.addEventListener('peer:connect', (event) => {
                const peerId = event.detail
                console.log('Peer connected:', peerId)
            })
    
            this.server.libp2p.addEventListener('peer:disconnect', (event) => {
                const peerId = event.detail
                console.log('Peer disconnected:', peerId)
            })
        }

        if (this.opts.verbose >= Flags.VERBOSE.LEVEL_3) {
            this.server.libp2p.addEventListener('peer:update', (event) => {
                const detail = event.detail
                console.log('Peer updated:', detail.peer.id)
                detail.peer.metadata.forEach((value, key) => {
                    console.log("\t", key, '=>', Buffer.from(value).toString())
                })
            })
        }

        return this
    },

    async resolveIpfs(cid) {
        const fs = this.fs()
        const stats = await fs.stat(cid)
        const pinned = await this.server.pins.isPinned(cid)
        let result = {
            cid: cid.toString(),
            pinned: pinned
        }
    
        if ('directory' === stats.type) {
            result.type = 'directory'
        } else {
            let chunks = []
        
            for await (const chunk of fs.cat(cid)) {
                chunks.push(chunk)
            }
    
            const content = Buffer.concat(chunks)
            const fileType = await fileTypeFromBuffer(content)
    
            result.type = 'file'
            result.data = content
    
            if (fileType) {
                result.mime = fileType.mime
            }
        }

        return result
    }
}

export default IPFS