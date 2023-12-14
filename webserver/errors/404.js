export default function Error404(err, req, res) {
    res
        .writeHead(404, "Not Found")
        .end(`${err.message}\n`)

    console.error(`[${req.method}]`, req.url, "=> 404 Not Found")
}