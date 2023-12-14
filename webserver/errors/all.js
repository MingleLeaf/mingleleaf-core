export default function ErrorAll(err, req, res) {
    res
        .writeHead(err.status, err.message)
        .end(`${err.message}\n`)

    console.error(`[${req.method}]`, req.url, "=>", err.status, err.message)
}