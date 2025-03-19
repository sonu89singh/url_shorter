import { createServer } from "http";
import { appendFile, readFile , writeFile} from "fs/promises";
import path from "path";
import { json } from "stream/consumers";
import { url } from "inspector";
import Crypto from "crypto"
const PORT = 4000;
const data_file = path.join("data","links.json")
const serverFile = async (res, folder, fileName, contentType) => {
    try {
        const filePath = path.join(folder, fileName);
        const data = await readFile(filePath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(data);
    } catch (error) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("404 Page Not Found");
    }
};
    const loadLinks = async()=>{
        try {
            const data = await readFile(data_file,"utf-8")
            return JSON.parse(data)
        } catch (error) {
            if (error.code === "ENOENT") {
                console.log("File not found, creating new file...");
                
                await writeFile(data_file,JSON.stringify({}))
                return {};
            }
            throw error;
        }
    }
    const saveLinks= async(links)=>{
        await writeFile(data_file, JSON.stringify(links, null, 2));
    }
const server = createServer(async (req, res) => {
    if (req.method === "GET") {
        if (req.url === "/") {
            return serverFile(res, "public", "url.html", "text/html");
        } else if (req.url === "/url.css") {
            return serverFile(res, "public", "url.css", "text/css");
        }else if (req.url==="/links") {
            const links = await loadLinks()
            res.writeHead(200,{"Content-Type":"application/json"})
            return res.end(JSON.stringify(links))
        }else{
            const links =await loadLinks()
            const shortCode=req.url.slice(1)
            if(links[shortCode]){
                res.writeHead(302,{location : links[shortCode]})
                return res.end()
            }
        }
    }

    if(req.method === "POST" && req.url==="/shorten"){

     
        let body = ""; 
        req.on("data",(chunk)=>{
            body=body+chunk
        })
        req.on("end", async()=>{
                try {
                    const {url,shortCode}=JSON.parse(body)
                    if (!url) {
                        res.writeHead({"Content-Type":"text/plain"})
                        return res.end("URL is required")
                    }
                    const links = await loadLinks()
                    let finalShortCode = shortCode|| Crypto.randomBytes(4).toString("hex")

                    if (links[finalShortCode]) {
                       res.writeHead({"Content-Type":"text/plain"}) 
                       return res.end("Short code already exists. please choose another.")
                    }
                    links[finalShortCode]=url;
                    await saveLinks(links)


                    res.writeHead(200,{"Content-Type":"application/json"})
                    res.end(JSON.stringify({success:true,shortCode:finalShortCode}))
                } catch (error) {
                    console.error("Error processing request:", error);
                    res.writeHead(500, { "Content-Type": "text/plain" });
                    res.end("Internal Server Error");
                }
        })
       
       
    }
});


server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
